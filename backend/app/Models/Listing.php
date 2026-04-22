<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Listing extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'price',
        'image_url',
        'cloudinary_public_id',
        'status',
        'category',
        'condition',
        'delivery',
        'delivery_cost',
        'location',
        'featured',
        'urgent',
        'views',
        'images',
    ];

    protected $casts = [
        'delivery'  => 'boolean',
        'featured'  => 'boolean',
        'urgent'    => 'boolean',
        'images'    => 'array',
        'price'     => 'decimal:2',
        'delivery_cost' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}