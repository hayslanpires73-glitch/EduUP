<?php
/**
 * Roteador da API RESTful (PHP)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/CurriculumController.php';
require_once __DIR__ . '/controllers/LessonController.php';

// Obtém o caminho da requisição
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Suporta /api/endpoint ou /backend/index.php?endpoint=... ou query string ?action=...
$action = $_GET['action'] ?? '';

if (empty($action)) {
    // Extrai o endpoint da URI se houver reescrita
    $parts = explode('/api/', $requestUri);
    if (count($parts) > 1) {
        $action = trim($parts[1], '/');
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$body = [];
$rawInput = file_get_contents('php://input');
if (!empty($rawInput)) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $body = $decoded;
    }
}

try {
    $userController = new UserController();
    $curriculumController = new CurriculumController();
    $lessonController = new LessonController();

    $userId = isset($body['user_id']) ? (int)$body['user_id'] : (isset($_GET['user_id']) ? (int)$_GET['user_id'] : 1);

    switch ($action) {
        case 'user':
            if ($method === 'GET') {
                $user = $userController->getUser($userId);
                echo json_encode(['success' => true, 'data' => $user]);
            } else {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Método não permitido']);
            }
            break;

        case 'user/refill':
            if ($method === 'POST') {
                $user = $userController->refillHearts($userId);
                echo json_encode(['success' => true, 'data' => $user]);
            } else {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Método não permitido']);
            }
            break;

        case 'user/reset':
            if ($method === 'POST') {
                $user = $userController->resetProgress($userId);
                echo json_encode(['success' => true, 'data' => $user]);
            } else {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Método não permitido']);
            }
            break;

        case 'user/name':
            if ($method === 'POST') {
                $name = $body['name'] ?? 'Estudante Roxo';
                $user = $userController->updateName($userId, $name);
                echo json_encode(['success' => true, 'data' => $user]);
            } else {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Método não permitido']);
            }
            break;

        case 'curriculum':
            if ($method === 'GET') {
                $curriculum = $curriculumController->getCurriculum($userId);
                echo json_encode(['success' => true, 'data' => $curriculum]);
            } else {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Método não permitido']);
            }
            break;

        case 'lesson':
            if ($method === 'GET') {
                $lessonId = isset($_GET['id']) ? (int)$_GET['id'] : 1;
                $lesson = $lessonController->getLesson($lessonId);
                if (!$lesson) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Lição não encontrada']);
                } else {
                    echo json_encode(['success' => true, 'data' => $lesson]);
                }
            } else {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Método não permitido']);
            }
            break;

        case 'check-answer':
            if ($method === 'POST') {
                $questionId = (int)($body['question_id'] ?? 0);
                $answer = $body['answer'] ?? null;
                $result = $lessonController->checkAnswer($questionId, $answer, $userId);
                echo json_encode(['success' => true, 'data' => $result]);
            } else {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Método não permitido']);
            }
            break;

        case 'finish-lesson':
            if ($method === 'POST') {
                $lessonId = (int)($body['lesson_id'] ?? 0);
                $score = (int)($body['score'] ?? 100);
                $result = $lessonController->finishLesson($lessonId, $userId, $score);
                echo json_encode(['success' => true, 'data' => $result]);
            } else {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Método não permitido']);
            }
            break;

        default:
            echo json_encode([
                'success' => true,
                'message' => 'API EduUP ativa e operacional',
                'endpoints' => [
                    'GET  /api/user',
                    'POST /api/user/refill',
                    'POST /api/user/reset',
                    'POST /api/user/name',
                    'GET  /api/curriculum',
                    'GET  /api/lesson?id={id}',
                    'POST /api/check-answer',
                    'POST /api/finish-lesson'
                ]
            ]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erro interno no servidor: ' . $e->getMessage()
    ]);
}
