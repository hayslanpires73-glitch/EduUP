<?php

require_once __DIR__ . '/../config/database.php';

class UserController {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getUser(int $userId = 1): array {
        $stmt = $this->db->prepare('SELECT id, name, email, xp, streak, hearts, max_hearts, last_active_date, created_at FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            // Cria usuário padrão caso não exista
            $insert = $this->db->prepare('INSERT INTO users (id, name, xp, streak, hearts, max_hearts, last_active_date) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $today = date('Y-m-d');
            $insert->execute([$userId, 'Estudante Roxo', 0, 1, 5, 5, $today]);
            return $this->getUser($userId);
        }

        // Contagem de lições completas
        $countStmt = $this->db->prepare('SELECT COUNT(*) as total_completed FROM user_progress WHERE user_id = ?');
        $countStmt->execute([$userId]);
        $progress = $countStmt->fetch();
        $user['completed_lessons_count'] = (int)($progress['total_completed'] ?? 0);

        return $user;
    }

    public function refillHearts(int $userId = 1): array {
        $stmt = $this->db->prepare('UPDATE users SET hearts = max_hearts WHERE id = ?');
        $stmt->execute([$userId]);
        return $this->getUser($userId);
    }

    public function updateName(int $userId = 1, string $name = 'Estudante Roxo'): array {
        $cleanName = trim(strip_tags($name));
        if (empty($cleanName)) {
            $cleanName = 'Estudante Roxo';
        }
        $stmt = $this->db->prepare('UPDATE users SET name = ? WHERE id = ?');
        $stmt->execute([$cleanName, $userId]);
        return $this->getUser($userId);
    }

    public function resetProgress(int $userId = 1): array {
        $this->db->prepare('DELETE FROM user_progress WHERE user_id = ?')->execute([$userId]);
        $this->db->prepare('UPDATE users SET xp = 0, streak = 1, hearts = 5, last_active_date = ? WHERE id = ?')->execute([date('Y-m-d'), $userId]);
        return $this->getUser($userId);
    }
}
