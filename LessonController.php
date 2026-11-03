<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/UserController.php';

class LessonController {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getLesson(int $lessonId): ?array {
        $stmt = $this->db->prepare('SELECT l.id, l.unit_id, l.title, l.xp_reward, l.icon_type, u.title as unit_title 
                                     FROM lessons l 
                                     JOIN units u ON l.unit_id = u.id 
                                     WHERE l.id = ?');
        $stmt->execute([$lessonId]);
        $lesson = $stmt->fetch();

        if (!$lesson) {
            return null;
        }

        $qStmt = $this->db->prepare('SELECT id, type, prompt, audio_text, target_sentence, options_json, correct_answer_json, explanation 
                                     FROM questions 
                                     WHERE lesson_id = ? 
                                     ORDER BY id ASC');
        $qStmt->execute([$lessonId]);
        $rawQuestions = $qStmt->fetchAll();

        $questions = [];
        foreach ($rawQuestions as $q) {
            $questions[] = [
                'id' => (int)$q['id'],
                'type' => $q['type'],
                'prompt' => $q['prompt'],
                'audio_text' => $q['audio_text'],
                'target_sentence' => $q['target_sentence'],
                'options' => json_decode($q['options_json'], true),
                'correct_answer' => json_decode($q['correct_answer_json'], true),
                'explanation' => $q['explanation']
            ];
        }

        $lesson['questions'] = $questions;
        return $lesson;
    }

    public function checkAnswer(int $questionId, $userAnswer, int $userId = 1): array {
        $stmt = $this->db->prepare('SELECT id, type, correct_answer_json, explanation FROM questions WHERE id = ?');
        $stmt->execute([$questionId]);
        $question = $stmt->fetch();

        if (!$question) {
            return ['success' => false, 'error' => 'Questão não encontrada'];
        }

        $correctAnswer = json_decode($question['correct_answer_json'], true);
        $type = $question['type'];
        $isCorrect = false;

        if ($type === 'word_bank') {
            // Compara arrays de palavras (ignorando espaços ou pontuações sutis)
            $userWords = is_array($userAnswer) ? $userAnswer : [];
            $normUser = array_map(fn($w) => mb_strtolower(trim($w, " .,!?:;")), $userWords);
            $normCorrect = array_map(fn($w) => mb_strtolower(trim($w, " .,!?:;")), (array)$correctAnswer);
            $isCorrect = ($normUser === $normCorrect);
        } elseif ($type === 'match_pairs') {
            // Compara mapeamento de pares {left: right}
            $isCorrect = true;
            if (!is_array($userAnswer)) {
                $isCorrect = false;
            } else {
                foreach ($correctAnswer as $k => $v) {
                    if (!isset($userAnswer[$k]) || mb_strtolower(trim($userAnswer[$k])) !== mb_strtolower(trim($v))) {
                        $isCorrect = false;
                        break;
                    }
                }
            }
        } else {
            // Múltipla escolha ou fill blank (string simples)
            $normUser = mb_strtolower(trim((string)$userAnswer, " .,!?:;"));
            $normCorrect = mb_strtolower(trim((string)$correctAnswer, " .,!?:;"));
            $isCorrect = ($normUser === $normCorrect);
        }

        $userController = new UserController();
        $user = $userController->getUser($userId);
        $hearts = (int)$user['hearts'];

        if (!$isCorrect && $hearts > 0) {
            $hearts--;
            $updateStmt = $this->db->prepare('UPDATE users SET hearts = ? WHERE id = ?');
            $updateStmt->execute([$hearts, $userId]);
        }

        return [
            'is_correct' => $isCorrect,
            'correct_answer' => $correctAnswer,
            'explanation' => $question['explanation'],
            'remaining_hearts' => $hearts
        ];
    }

    public function finishLesson(int $lessonId, int $userId = 1, int $score = 100): array {
        $stmt = $this->db->prepare('SELECT xp_reward FROM lessons WHERE id = ?');
        $stmt->execute([$lessonId]);
        $lesson = $stmt->fetch();
        $xpEarned = $lesson ? (int)$lesson['xp_reward'] : 15;

        // Grava no progresso
        $progStmt = $this->db->prepare('INSERT INTO user_progress (user_id, lesson_id, score, completed_at) 
                                        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                                        ON CONFLICT(user_id, lesson_id) DO UPDATE SET score = ?, completed_at = CURRENT_TIMESTAMP');
        $progStmt->execute([$userId, $lessonId, $score, $score]);

        // Atualiza usuário: XP e Streak
        $userController = new UserController();
        $user = $userController->getUser($userId);

        $today = date('Y-m-d');
        $lastActive = $user['last_active_date'] ?? null;
        $newStreak = (int)$user['streak'];

        if ($lastActive !== $today) {
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            if ($lastActive === $yesterday) {
                $newStreak += 1;
            } elseif ($lastActive === null || strtotime($lastActive) < strtotime($yesterday)) {
                $newStreak = 1;
            }
        }

        $newXp = (int)$user['xp'] + $xpEarned;
        $upUserStmt = $this->db->prepare('UPDATE users SET xp = ?, streak = ?, last_active_date = ? WHERE id = ?');
        $upUserStmt->execute([$newXp, $newStreak, $today, $userId]);

        return [
            'success' => true,
            'xp_earned' => $xpEarned,
            'total_xp' => $newXp,
            'streak' => $newStreak,
            'lesson_id' => $lessonId
        ];
    }
}
