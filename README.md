# EduUP

Uma plataforma web moderna e minimalista para aprendizado de idiomas inspirada no Duolingo, desenvolvida com as cores **roxo e branco**, mascote da **raposa roxa**, arquitetura com **HTML, CSS, JavaScript, PHP e Banco de Dados (SQLite e MySQL)**, e uma interface limpa **sem o uso de emojis** (100% ícones vetoriais SVG).

---

## Características Principais

- **Identidade Visual Roxo & Branco**: Paleta inspirada nos tons `#7C3AED` e `#6B21A8` com botões táteis 3D estilo Duolingo.
- **Mascote da Raposa Roxa Integrado**: Presente nas saudações da trilha com balões dinâmicos de fala, incentivos na coluna lateral e tela de vitória com celebração.
- **Livre de Emojis**: Toda a iconografia (vidas, chamas de ofensiva, XP, alto-falante, checkmarks e cadeados) utiliza vetores SVG minimalistas e elegantes.
- **Diversidade de Exercícios**:
  - *Banco de Palavras*: Construção de frases ordenando blocos de palavras.
  - *Múltipla Escolha*: Opções com seleção tátil e atalhos numéricos.
  - *Combinação de Pares*: Conexão de termos equivalentes com animação de feedback.
  - *Completar Lacunas*: Preenchimento contextual de sentenças.
  - *Pronúncia em Voz Alta*: Síntese de voz nativa (`Web Speech API`) para termos em inglês.
  - *Efeitos Sonoros Sintéticos*: Chimes e fanfarras sintetizados via `Web Audio API` sem arquivos pesados.
- **Mecânica de Gamificação**:
  - 5 Vidas (corações com perda em respostas erradas e recarga).
  - Sequência de dias (Streak / Ofensiva).
  - Pontos de Experiência (XP).
  - Trilha com nós alternados e desbloqueio sequencial.
- **Backend Completo em PHP com SQLite e MySQL**:
  - Banco de dados SQLite portátil e pré-populado em `backend/database/database.sqlite`.
  - Scripts SQL limpos (`schema.sql`, `seed.sql`, `schema_mysql.sql`).
  - Fallback autônomo em JavaScript (`localStorage`) para visualização direta sem necessidade de servidor web.

---

## Estrutura do Projeto

```
lingua-roxo/
├── assets/
│   ├── css/
│   │   └── style.css          # Design system roxo e branco, botões táteis 3D
│   ├── js/
│   │   ├── api.js             # Conector com o backend PHP e fallback local
│   │   ├── audio.js           # Gerador de sons (Web Audio API) e síntese de voz
│   │   ├── lesson-engine.js   # Motor de exercícios interativos e validação
│   │   └── app.js             # Orquestrador da trilha, dados do usuário e perfil
│   ├── img/
│   │   └── mascot.png         # Imagem da raposa roxa otimizada
│   └── icons/
│       └── icons.svg          # Sprites SVG minimalistas (sem emojis)
├── backend/
│   ├── config/
│   │   └── database.php       # Conexão PDO (SQLite / MySQL)
│   ├── controllers/
│   │   ├── UserController.php
│   │   ├── CurriculumController.php
│   │   └── LessonController.php
│   ├── database/
│   │   ├── schema.sql         # Definição das tabelas
│   │   ├── seed.sql           # Carga inicial com 3 unidades e lições ricas
│   │   ├── schema_mysql.sql   # Versão para MySQL/XAMPP
│   │   └── database.sqlite    # Banco SQLite pronto para uso
│   └── index.php              # Roteador da API RESTful (/api/...)
├── index.html                 # Interface SPA direta
├── index.php                  # Roteador raiz para servidor embutido do PHP
└── README.md                  # Este documento
```

---

## Como Executar

### 1. Servidor Embutido do PHP (Recomendado)
Se você tiver o PHP instalado (versão 8.0 ou superior):
```bash
cd /Users/hayslan/.gemini/antigravity/scratch/lingua-roxo
php -S localhost:8000
```
Em seguida, abra no seu navegador: `http://localhost:8000`

### 2. Com Docker
Caso queira executar em um container PHP sem instalar nada na máquina:
```bash
docker run -d -p 8000:80 -v "$PWD":/var/www/html php:8.2-apache
```

### 3. Abertura Direta no Navegador
Graças ao fallback inteligente em `assets/js/api.js`, você também pode abrir diretamente o arquivo `index.html` em qualquer navegador ou servidor estático simples. Ele executará todas as lições, cálculos de vidas, XP e streak de forma instantânea.

---

## Endpoints da API (PHP)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET`  | `/api/user` | Retorna os dados do aprendiz, XP, streak e vidas |
| `POST` | `/api/user/refill` | Recarrega as 5 vidas do aprendiz |
| `POST` | `/api/user/name` | Altera o nome de exibição do usuário |
| `POST` | `/api/user/reset` | Reinicia todo o progresso para testes |
| `GET`  | `/api/curriculum` | Retorna as unidades, módulos e status de cada nó |
| `GET`  | `/api/lesson?id={id}` | Retorna as questões estruturadas da lição |
| `POST` | `/api/check-answer` | Valida uma resposta e deduz vidas em caso de erro |
| `POST` | `/api/finish-lesson` | Grava a conclusão, soma XP e atualiza a ofensiva |
