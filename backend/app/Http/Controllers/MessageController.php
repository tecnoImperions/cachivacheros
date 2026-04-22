<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request, $listingId)
    {
        $messages = Message::where('listing_id', $listingId)
            ->where('deleted', false)
            ->where(function ($query) use ($request) {
                $query->where('sender_id', $request->user()->id)
                      ->orWhere('receiver_id', $request->user()->id);
            })
            ->with(['sender', 'receiver'])
            ->oldest()
            ->get();

        Message::where('listing_id', $listingId)
            ->where('receiver_id', $request->user()->id)
            ->where('read', false)
            ->update([
                'read'    => true,
                'read_at' => now(),
            ]);

        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $request->validate([
            'listing_id'  => 'required|exists:listings,id',
            'receiver_id' => 'required|exists:users,id',
            'body'        => 'required|string|max:1000',
            'type'        => 'nullable|string|in:text,image',
        ]);

        $message = Message::create([
            'listing_id'  => $request->listing_id,
            'sender_id'   => $request->user()->id,
            'receiver_id' => $request->receiver_id,
            'body'        => $request->body,
            'type'        => $request->type ?? 'text',
        ]);

        $message->load(['sender', 'receiver']);

        return response()->json($message, 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $message = Message::where('id', $id)
            ->where('sender_id', $request->user()->id)
            ->where('deleted', false)
            ->firstOrFail();

        $message->update([
            'body'      => $request->body,
            'edited'    => true,
            'edited_at' => now(),
        ]);

        return response()->json($message);
    }

    public function destroy(Request $request, $id)
    {
        $message = Message::where('id', $id)
            ->where('sender_id', $request->user()->id)
            ->firstOrFail();

        $message->update([
            'deleted' => true,
            'body'    => 'Este mensaje fue eliminado',
        ]);

        return response()->json(['message' => 'Mensaje eliminado']);
    }

    public function conversations(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = Message::where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)
                  ->orWhere('receiver_id', $userId);
            })
            ->where('deleted', false)
            ->with(['listing', 'sender', 'receiver'])
            ->latest()
            ->get()
            ->groupBy('listing_id')
            ->map(function ($messages) use ($userId) {
                $last   = $messages->first();
                $unread = $messages->where('receiver_id', $userId)
                                   ->where('read', false)
                                   ->count();
                return [
                    'last_message' => $last,
                    'unread_count' => $unread,
                    'listing'      => $last->listing,
                ];
            })
            ->values();

        return response()->json($conversations);
    }

    public function markRead(Request $request, $listingId)
    {
        Message::where('listing_id', $listingId)
            ->where('receiver_id', $request->user()->id)
            ->where('read', false)
            ->update([
                'read'    => true,
                'read_at' => now(),
            ]);

        return response()->json(['message' => 'Marcado como leído']);
    }
}