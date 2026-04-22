<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->boolean('read')->default(false)->change();
            $table->timestamp('read_at')->nullable()->after('read');
            $table->boolean('edited')->default(false)->after('read_at');
            $table->timestamp('edited_at')->nullable()->after('edited');
            $table->boolean('deleted')->default(false)->after('edited_at');
            $table->string('type')->default('text')->after('deleted');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['read_at', 'edited', 'edited_at', 'deleted', 'type']);
        });
    }
};