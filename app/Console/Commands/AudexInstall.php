<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class AudexInstall extends Command
{
    protected $signature = 'audex:install';
    protected $description = 'Install and set up the Audex API (creates DB, migrates, seeds)';

    public function handle(): int
    {
        $this->info('🚀 Installing Audex API...');
        $this->newLine();

        // Step 1: Copy .env if missing
        if (!File::exists(base_path('.env'))) {
            File::copy(base_path('.env.example'), base_path('.env'));
            $this->info('✅ .env file created from .env.example');
        } else {
            $this->line('   .env already exists, skipping copy.');
        }

        // Step 2: Generate app key if missing
        if (empty(env('APP_KEY'))) {
            $this->call('key:generate');
            $this->info('✅ Application key generated.');
        } else {
            $this->line('   App key already set, skipping generation.');
        }

        // Step 3: Create MySQL database if not exists
        $this->info('📦 Creating database if it does not exist...');
        try {
            $dbName = config('database.connections.mysql.database', 'audex');
            $host = config('database.connections.mysql.host', '127.0.0.1');
            $port = config('database.connections.mysql.port', '3306');
            $username = config('database.connections.mysql.username', 'root');
            $password = config('database.connections.mysql.password', '');

            $pdo = new \PDO(
                "mysql:host={$host};port={$port}",
                $username,
                $password,
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );

            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $this->info("✅ Database '{$dbName}' is ready.");
        } catch (\PDOException $e) {
            $this->error('❌ Could not connect to MySQL: ' . $e->getMessage());
            $this->error('');
            $this->error('💡 Make sure MySQL is running and your .env has the correct credentials:');
            $this->error('   DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD');
            $this->newLine();
            return self::FAILURE;
        }

        // Step 4: Run migrations and seed
        $this->info('🗄️  Running migrations...');
        $this->call('migrate:fresh', ['--seed' => true, '--force' => true]);

        // Step 5: Print credentials
        $this->newLine();
        $this->info('✅ Audex API is ready!');
        $this->newLine();
        $this->line('📋 <fg=yellow>Seeded Login Credentials:</fg=yellow>');
        $this->line('');
        $this->line('   <fg=cyan>Admin:</fg=cyan>');
        $this->line('   Email:    admin@audex.com');
        $this->line('   Password: password');
        $this->line('');
        $this->line('   <fg=cyan>CEO:</fg=cyan>');
        $this->line('   Email:    ceo@audex.com');
        $this->line('   Password: password');
        $this->line('');
        $this->line('   <fg=cyan>Academic Director:</fg=cyan>');
        $this->line('   Email:    academic@audex.com');
        $this->line('   Password: password');
        $this->newLine();
        $this->line('🌐 <fg=yellow>Base URL:</fg=yellow> http://127.0.0.1:8000/api/v1');
        $this->newLine();
        $this->line('💡 Start the server: <fg=green>php artisan serve</fg=green>');
        $this->newLine();

        return self::SUCCESS;
    }
}
