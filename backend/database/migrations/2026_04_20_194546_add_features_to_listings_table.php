<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->enum('condition', ['new', 'like_new', 'good', 'fair'])->default('good')->after('category');
            $table->boolean('delivery')->default(false)->after('condition');
            $table->decimal('delivery_cost', 10, 2)->nullable()->after('delivery');
            $table->string('location')->nullable()->after('delivery_cost');
            $table->boolean('featured')->default(false)->after('location');
            $table->boolean('urgent')->default(false)->after('featured');
            $table->integer('views')->default(0)->after('urgent');
            $table->json('images')->nullable()->after('views');
        });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn(['condition','delivery','delivery_cost','location','featured','urgent','views','images']);
        });
    }
};