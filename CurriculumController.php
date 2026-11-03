<?php

require_once __DIR__ . '/../config/database.php';

class CurriculumController {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getCurriculum(int $userId = 1): array {
        // Busca todas as unidades
        $unitsStmt = $this->db->query('SELECT id, order_index, title, description, theme_color FROM units ORDER BY order_index ASC');
        $units = $unitsStmt->fetchAll();

        // Busca o progresso do usuário (IDs das lições completadas)
        $progStmt = $this->db->prepare('SELECT lesson_id, completed_at, score FROM user_progress WHERE user_id = ?');
        $progStmt->execute([$userId]);
        $completedLessonsMap = [];
        while ($row = $progStmt->fetch()) {
            $completedLessonsMap[(int)$row['lesson_id']] = $row;
        }

        $allLessonsStmt = $this->db->query('SELECT id, unit_id, order_index, title, xp_reward, icon_type FROM lessons ORDER BY unit_id ASC, order_index ASC');
        $allLessons = $allLessonsStmt->fetchAll();

        // Agrupa lições por unidade e define status ('completed', 'current', 'locked')
        $lessonsByUnit = [];
        $foundCurrent = false;

        foreach ($allLessons as $lesson) {
            $lid = (int)$lesson['id'];
            $uid = (int)$lesson['unit_id'];

            if (isset($completedLessonsMap[$lid])) {
                $status = 'completed';
            } elseif (!$foundCurrent) {
                $status = 'current';
                $foundCurrent = true;
            } else {
                $status = 'locked';
            }

            $lesson['status'] = $status;
            $lesson['completed_info'] = $completedLessonsMap[$lid] ?? null;

            $lessonsByUnit[$uid][] = $lesson;
        }

        // Se o usuário completou tudo, a última lição concluída pode continuar acessível para revisão
        $totalLessons = count($allLessons);
        $completedTotal = count($completedLessonsMap);

        foreach ($units as &$unit) {
            $uid = (int)$unit['id'];
            $unit['lessons'] = $lessonsByUnit[$uid] ?? [];
        }

        return [
            'units' => $units,
            'stats' => [
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedTotal,
                'percentage' => $totalLessons > 0 ? round(($completedTotal / $totalLessons) * 100) : 0
            ]
        ];
    }
}
