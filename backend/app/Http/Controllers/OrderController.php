<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Listing;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    // Crear orden de compra
    public function store(Request $request)
    {
        $request->validate([
            'listing_id' => 'required|exists:listings,id',
            'notes'      => 'nullable|string|max:500',
        ]);

        $listing = Listing::findOrFail($request->listing_id);

        // No puedes comprarte tu propia publicación
        if ($listing->user_id === $request->user()->id) {
            return response()->json([
                'message' => 'No puedes comprar tu propia publicación'
            ], 403);
        }

        // Verificar que esté activa
        if ($listing->status !== 'active') {
            return response()->json([
                'message' => 'Esta publicación no está disponible'
            ], 400);
        }

        $order = Order::create([
            'listing_id' => $listing->id,
            'buyer_id'   => $request->user()->id,
            'seller_id'  => $listing->user_id,
            'amount'     => $listing->price,
            'notes'      => $request->notes,
        ]);

        // Marcar publicación como vendida
        $listing->update(['status' => 'sold']);

        $order->load(['listing', 'buyer', 'seller']);

        return response()->json($order, 201);
    }

    // Mis compras
    public function myPurchases(Request $request)
    {
        $orders = Order::where('buyer_id', $request->user()->id)
            ->with(['listing', 'seller'])
            ->latest()
            ->get();

        return response()->json($orders);
    }

    // Mis ventas
    public function mySales(Request $request)
    {
        $orders = Order::where('seller_id', $request->user()->id)
            ->with(['listing', 'buyer'])
            ->latest()
            ->get();

        return response()->json($orders);
    }

    // Confirmar o cancelar orden
    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:confirmed,cancelled',
        ]);

        $order = Order::where('id', $id)
            ->where('seller_id', $request->user()->id)
            ->firstOrFail();

        $order->update(['status' => $request->status]);

        // Si cancela, volver a activar la publicación
        if ($request->status === 'cancelled') {
            $order->listing->update(['status' => 'active']);
        }

        return response()->json($order);
    }
}