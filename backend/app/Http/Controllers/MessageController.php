<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Listing;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    // Ver conversación de una publicación
    public function index(Request $request, $listingId)
    {
        $messages = Message::where('listing_id', $listingId)
            ->where(function ($query) use ($request) {
                $query->where('sender_id', $request->user()->id)
                      ->orWhere('receiver_id', $request->user()->id);
            })
            ->with(['sender', 'receiver'])
            ->oldest()
            ->get();

        // Marcar como leídos
        Message::where('listing_id', $listingId)
            ->where('receiver_id', $request->user()->id)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json($messages);
    }

    // Enviar mensaje
    public function store(Request $request)
    {
        $request->validate([
            'listing_id'  => 'required|exists:listings,id',
            'receiver_id' => 'required|exists:users,id',
            'body'        => 'required|string|max:1000',
        ]);

        $message = Message::create([
            'listing_id'  => $request->listing_id,
            'sender_id'   => $request->user()->id,
            'receiver_id' => $request->receiver_id,
            'body'        => $request->body,
        ]);

        $message->load(['sender', 'receiver']);

        return response()->json($message, 201);
    }

    // Mis conversaciones
    public function conversations(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = Message::where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->with(['listing', 'sender', 'receiver'])
            ->latest()
            ->get()
            ->groupBy('listing_id')
            ->map(function ($messages) {
                return $messages->first();
            })
            ->values();

        return response()->json($conversations);
    }
}