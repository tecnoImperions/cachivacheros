<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;

class ListingController extends Controller
{
    public function index(Request $request)
    {
        $query = Listing::with('user')->where('status', 'active');

        if ($request->category && $request->category !== 'Todo') {
            $query->where('category', $request->category);
        }
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }
        if ($request->condition) {
            $query->where('condition', $request->condition);
        }
        if ($request->delivery) {
            $query->where('delivery', true);
        }
        if ($request->max_price) {
            $query->where('price', '<=', $request->max_price);
        }

        // Destacados primero, luego urgentes, luego por fecha
        $query->orderByDesc('featured')
              ->orderByDesc('urgent')
              ->orderByDesc('created_at');

        return response()->json($query->paginate(20));
    }

    public function show($id)
    {
        $listing = Listing::with('user')->findOrFail($id);
        $listing->increment('views');
        return response()->json($listing);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'required|string',
            'price'          => 'required|numeric|min:0',
            'category'       => 'nullable|string',
            'image_url'      => 'nullable|string',
            'cloudinary_public_id' => 'nullable|string',
            'condition'      => 'nullable|in:new,like_new,good,fair',
            'delivery'       => 'nullable|boolean',
            'delivery_cost'  => 'nullable|numeric|min:0',
            'location'       => 'nullable|string',
            'images'         => 'nullable|array',
        ]);

        $listing = Listing::create([
            'user_id'              => $request->user()->id,
            'title'                => $request->title,
            'description'          => $request->description,
            'price'                => $request->price,
            'category'             => $request->category,
            'image_url'            => $request->image_url,
            'cloudinary_public_id' => $request->cloudinary_public_id,
            'condition'            => $request->condition ?? 'good',
            'delivery'             => $request->delivery ?? false,
            'delivery_cost'        => $request->delivery_cost,
            'location'             => $request->location,
            'images'               => $request->images ?? [],
        ]);

        return response()->json($listing, 201);
    }

    public function update(Request $request, $id)
    {
        $listing = Listing::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $listing->update($request->only([
            'title', 'description', 'price', 'category',
            'status', 'image_url', 'cloudinary_public_id',
            'condition', 'delivery', 'delivery_cost',
            'location', 'images',
        ]));

        return response()->json($listing);
    }

    public function destroy(Request $request, $id)
    {
        $listing = Listing::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
        $listing->delete();
        return response()->json(['message' => 'Eliminada']);
    }

    public function myListings(Request $request)
    {
        $listings = Listing::where('user_id', $request->user()->id)
            ->latest()->get();
        return response()->json($listings);
    }

    public function feature(Request $request, $id)
    {
        $listing = Listing::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $listing->update([
            'featured' => true,
            'urgent'   => $request->urgent ?? false,
        ]);

        return response()->json(['message' => 'Publicación destacada', 'listing' => $listing]);
    }
}