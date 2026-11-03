-- Esquema e Carga para MySQL / MariaDB (Compatível com XAMPP, phpMyAdmin e cPanel)
CREATE DATABASE IF NOT EXISTS eduup CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eduup;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT 'Aprendiz',
    email VARCHAR(150) UNIQUE,
    xp INT NOT NULL DEFAULT 0,
    streak INT NOT NULL DEFAULT 1,
    hearts INT NOT NULL DEFAULT 5,
    max_hearts INT NOT NULL DEFAULT 5,
    last_active_date DATE NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_index INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    theme_color VARCHAR(30) NOT NULL DEFAULT '#7C3AED'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id INT NOT NULL,
    order_index INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    xp_reward INT NOT NULL DEFAULT 15,
    icon_type VARCHAR(50) NOT NULL DEFAULT 'star',
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    audio_text TEXT NULL,
    target_sentence TEXT NULL,
    options_json LONGTEXT NOT NULL,
    correct_answer_json LONGTEXT NOT NULL,
    explanation TEXT NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lesson_id INT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    score INT NOT NULL DEFAULT 100,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_lesson (user_id, lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
