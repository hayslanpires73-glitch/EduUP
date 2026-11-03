-- Inserir Usuário Padrão
INSERT OR IGNORE INTO users (id, name, email, xp, streak, hearts, max_hearts, last_active_date)
VALUES (1, 'Estudante Roxo', 'estudante@eduup.com', 45, 3, 5, 5, DATE('now'));

-- Inserir Unidades
INSERT INTO units (id, order_index, title, description, theme_color) VALUES
(1, 1, 'Unidade 1: Primeiros Passos', 'Aprenda cumprimentos, palavras essenciais e frases do dia a dia.', '#7C3AED'),
(2, 2, 'Unidade 2: Alimentação & Rotina', 'Peça comidas e bebidas, e expresse hábitos diários.', '#6D28D9'),
(3, 3, 'Unidade 3: Viagens & Destinos', 'Oriente-se em aeroportos, hotéis e novos lugares.', '#5B21B6');

-- Inserir Lições da Unidade 1
INSERT INTO lessons (id, unit_id, order_index, title, xp_reward, icon_type) VALUES
(1, 1, 1, 'Palavras Essenciais', 15, 'star'),
(2, 1, 2, 'Cumprimentos & Cortesia', 20, 'chat'),
(3, 1, 3, 'Café e Bebidas', 20, 'cup');

-- Inserir Lições da Unidade 2
INSERT INTO lessons (id, unit_id, order_index, title, xp_reward, icon_type) VALUES
(4, 2, 1, 'Café da Manhã', 20, 'food'),
(5, 2, 2, 'Ações Cotidianas', 25, 'bolt');

-- Inserir Lições da Unidade 3
INSERT INTO lessons (id, unit_id, order_index, title, xp_reward, icon_type) VALUES
(6, 3, 1, 'No Aeroporto', 25, 'plane'),
(7, 3, 2, 'Check-in no Hotel', 30, 'key');

-- ==============================================================
-- QUESTÕES DA LIÇÃO 1 (Palavras Essenciais)
-- ==============================================================

-- Questão 1: Word Bank
INSERT INTO questions (lesson_id, type, prompt, audio_text, target_sentence, options_json, correct_answer_json, explanation) VALUES
(1, 'word_bank', 'Traduza esta frase:', 'Hello', 'Hello', 
 '["Olá", "Tchau", "Água", "Pão", "Você", "Obrigado"]', 
 '["Olá"]', 
 '"Hello" significa "Olá" em inglês.');

-- Questão 2: Múltipla Escolha
INSERT INTO questions (lesson_id, type, prompt, audio_text, target_sentence, options_json, correct_answer_json, explanation) VALUES
(1, 'multiple_choice', 'Como se diz "Água" em inglês?', 'Water', 'Água',
 '["Water", "Coffee", "Tea", "Bread"]',
 '"Water"',
 '"Water" é a tradução exata de água.');

-- Questão 3: Word Bank com frase completa
INSERT INTO questions (lesson_id, type, prompt, audio_text, target_sentence, options_json, correct_answer_json, explanation) VALUES
(1, 'word_bank', 'Traduza para o português:', 'I drink water', 'I drink water',
 '["Eu", "bebo", "água", "leite", "você", "suco", "come"]',
 '["Eu", "bebo", "água"]',
 '"I drink water" traduz-se diretamente como "Eu bebo água".');

-- Questão 4: Combinação de Pares (Match Pairs)
INSERT INTO questions (lesson_id, type, prompt, audio_text, target_sentence, options_json, correct_answer_json, explanation) VALUES
(1, 'match_pairs', 'Toque nos pares correspondentes:', NULL, 'Vocabulário essencial',
 '{"left": ["Hello", "Water", "Coffee", "Bread"], "right": ["Café", "Pão", "Olá", "Água"]}',
 '{"Hello": "Olá", "Water": "Água", "Coffee": "Café", "Bread": "Pão"}',
 'Excelente! Você memorizou todos os termos básicos desta etapa.');

-- Questão 5: Completar Lacuna (Fill Blank)
INSERT INTO questions (lesson_id, type, prompt, audio_text, target_sentence, options_json, correct_answer_json, explanation) VALUES
(1, 'fill_blank', 'Complete a frase com a palavra correta:', 'Good morning', 'Good _____!',
 '["morning", "night", "water", "bread"]',
 '"morning"',
 '"Good morning" significa "Bom dia".');

-- ==============================================================
-- QUESTÕES DA LIÇÃO 2 (Cumprimentos & Cortesia)
-- ==============================================================

-- Questão 1: Múltipla Escolha
INSERT INTO questions (lesson_id, type, prompt, audio_text, target_sentence, options_json, correct_answer_json, explanation) VALUES
(2, 'multiple_choice', 'Qual expressão significa "Por favor"?', 'Please', 'Por favor',
 '["Please", "Thank you", "Sorry", "Welcome"]',
 '"Please"',
 '"Please" é utilizado para pedir algo educadamente.');

-- Questão 2: Word Bank
INSERT INTO questions (lesson_id, type, prompt, audio_text, target_sentence, options_json, correct_answer_json, explanation) VALUES
(2, 'word_bank', 'Monte a frase traduzida:', 'Thank you very much', 'Thank you very much',
 '["Muito", "obrigado", "de", "nada", "por", "favor"]',
 '["Muito", "obrigado"]',
 '"Thank you very much" significa "Muito obrigado".');

-- Questão 3: Match Pairs
INSERT INTO questions (lesson_id, type, prompt, audio_text, target_sentence, options_json, correct_answer_json, explanation) VALUES
(2, 'match_pairs', 'Conecte as saudações às suas traduções:', NULL, 'Cortesia básica',
 '{"left": ["Please", "Thank you", "Goodbye", "Excuse me"], "right": ["Com licença", "Tchau", "Por favor", "Obrigado"]}',
 '{"Please": "Por favor", "Thank you": "Obrigado", "Goodbye": "Tchau", "Excuse me": "Com licença"}',
 'Perfeito! As formas de cortesia são fundamentais em qualquer conversa.');

-- Questão 4: Fill Blank
INSERT INTO questions (lesson_id, type, prompt, audio_text, target_sentence, options_json, correct_answer_json, explanation) VALUES
(2, 'fill_blank', 'Complete a despedida formal:', 'See you tomorrow', 'See you _____!',
 '["tomorrow", "yesterday", "today", "please"]',
 '"tomorrow"',
 '"See you tomorrow" significa "Até amanhã".');

-- ==============================================================
-- QUESTÕES DA LIÇÃO 3 (Café e Bebidas)
-- ==============================================================

INSERT INTO questions (lesson_id, type, prompt, audio_text, target_sentence, options_json, correct_answer_json, explanation) VALUES
(3, 'word_bank', 'Traduza o pedido:', 'Coffee with milk, please', 'Coffee with milk, please',
 '["Café", "com", "leite,", "por", "favor", "chá", "sem"]',
 '["Café", "com", "leite,", "por", "favor"]',
 '"Coffee with milk, please" é o clássico pedido: "Café com leite, por favor".'),

(3, 'multiple_choice', 'Como se diz "Chá" em inglês?', 'Tea', 'Chá',
 '["Tea", "Milk", "Juice", "Soda"]',
 '"Tea"',
 '"Tea" pronuncia-se como /ti:/ e significa chá.');

-- Inserir Progresso Inicial (Usuário já concluiu a lição 1 no passado ou começa desbloqueada)
INSERT OR IGNORE INTO user_progress (user_id, lesson_id, score) VALUES
(1, 1, 100);
