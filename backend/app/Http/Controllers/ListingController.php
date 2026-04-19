<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;

class ListingController extends Controller
{
    // Ver todas las publicaciones activas
    public function index()
    {
        $listings = Listing::with('user')
            ->where('status', 'active')
            ->latest()
            ->paginate(20);

        return response()->json($listings);
    }

    // Ver una publicación
    public function show($id)
    {
        $listing = Listing::with('user')->findOrFail($id);

        return response()->json($listing);
    }

    // Crear publicación
    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'price'       => 'required|numeric|min:0',
            'category'    => 'nullable|string',
            'image_url'   => 'nullable|string',
            'cloudinary_public_id' => 'nullable|string',
        ]);

        $listing = Listing::create([
            'user_id'              => $request->user()->id,
            'title'                => $request->title,
            'description'          => $request->description,
            'price'                => $request->price,
            'category'             => $request->category,
            'image_url'            => $request->image_url,
            'cloudinary_public_id' => $request->cloudinary_public_id,
        ]);

        return response()->json($listing, 201);
    }

    // Editar publicación
    public function update(Request $request, $id)
    {
        $listing = Listing::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $listing->update($request->only([
            'title',
            'description',
            'price',
            'category',
            'status',
            'image_url',
            'cloudinary_public_id',
        ]));

        return response()->json($listing);
    }

    // Eliminar publicación
    public function destroy(Request $request, $id)
    {
        $listing = Listing::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $listing->delete();

        return response()->json(['message' => 'Publicación eliminada']);
    }

    // Mis publicaciones
    public function myListings(Request $request)
    {
        $listings = Listing::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($listings);
    }
}