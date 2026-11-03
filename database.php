<?php
/**
 * Conexão com o Banco de Dados (PDO)
 * Suporta SQLite nativo (padrão sem dependência de serviço externo) e MySQL opcional.
 */

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $driver = getenv('DB_DRIVER') ?: 'sqlite';
        $sqlitePath = __DIR__ . '/../database/database.sqlite';

        if ($driver === 'sqlite') {
            $isNew = !file_exists($sqlitePath);
            self::$instance = new PDO('sqlite:' . $sqlitePath);
            self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

            // Se o arquivo SQLite foi criado agora, executa o schema e seed
            if ($isNew || filesize($sqlitePath) === 0) {
                self::runSqlFile(__DIR__ . '/../database/schema.sql');
                self::runSqlFile(__DIR__ . '/../database/seed.sql');
            }
        } else {
            $host = getenv('DB_HOST') ?: 'localhost';
            $port = getenv('DB_PORT') ?: '3306';
            $dbName = getenv('DB_NAME') ?: 'eduup';
            $user = getenv('DB_USER') ?: 'root';
            $pass = getenv('DB_PASS') ?: '';

            $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";
            self::$instance = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ]);
        }

        return self::$instance;
    }

    private static function runSqlFile(string $filePath): void {
        if (!file_exists($filePath)) return;
        $sql = file_get_contents($filePath);
        if ($sql) {
            self::$instance->exec($sql);
        }
    }
}
