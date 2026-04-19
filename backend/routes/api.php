<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\OrderController;

// Rutas públicas
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/auth/google', [AuthController::class, 'googleLogin']);

// Publicaciones públicas (cualquiera puede ver)
Route::get('/listings',      [ListingController::class, 'index']);
Route::get('/listings/{id}', [ListingController::class, 'show']);

// Rutas protegidas (requieren token)
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Publicaciones
    Route::post('/listings',           [ListingController::class, 'store']);
    Route::put('/listings/{id}',       [ListingController::class, 'update']);
    Route::delete('/listings/{id}',    [ListingController::class, 'destroy']);
    Route::get('/my-listings',         [ListingController::class, 'myListings']);

    // Mensajes / Chat
    Route::get('/conversations',              [MessageController::class, 'conversations']);
    Route::get('/messages/{listingId}',       [MessageController::class, 'index']);
    Route::post('/messages',                  [MessageController::class, 'store']);

    // Órdenes
    Route::post('/orders',            [OrderController::class, 'store']);
    Route::get('/my-purchases',       [OrderController::class, 'myPurchases']);
    Route::get('/my-sales',           [OrderController::class, 'mySales']);
    Route::put('/orders/{id}',        [OrderController::class, 'update']);
});