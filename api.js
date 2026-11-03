/**
 * Camada de API (Comunicação com PHP e Fallback Local Inteligente)
 */

class ApiService {
  constructor() {
    this.baseUrl = window.location.origin.includes('http') ? 'backend/index.php' : null;
    this.useFallback = false;
    this.initLocalStorage();
  }

  // Inicializa dados mock caso esteja executando sem servidor PHP
  initLocalStorage() {
    if (!localStorage.getItem('eduup_user')) {
      const initialUser = {
        id: 1,
        name: 'Estudante Roxo',
        email: 'estudante@eduup.com',
        xp: 45,
        streak: 3,
        hearts: 5,
        max_hearts: 5,
        completed_lessons_count: 1
      };
      localStorage.setItem('eduup_user', JSON.stringify(initialUser));
    }

    if (!localStorage.getItem('eduup_progress')) {
      // Lição 1 já completada
      localStorage.setItem('eduup_progress', JSON.stringify([1]));
    }
  }

  async request(action, method = 'GET', data = null) {
    // Se já sabemos que o backend PHP não está disponível, usa fallback direto
    if (this.useFallback || !this.baseUrl) {
      return this.handleFallback(action, method, data);
    }

    try {
      const url = `${this.baseUrl}?action=${encodeURIComponent(action)}`;
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (data && method === 'POST') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      const json = await response.json();
      return json.data;
    } catch (err) {
      console.warn('Backend PHP não acessível no momento. Ativando modo local autônomo.', err);
      this.useFallback = true;
      return this.handleFallback(action, method, data);
    }
  }

  // Fallback que simula exatamente o comportamento dos controllers PHP
  handleFallback(action, method, data) {
    const user = JSON.parse(localStorage.getItem('eduup_user'));
    const completedList = JSON.parse(localStorage.getItem('eduup_progress')) || [];

    if (action === 'user') {
      user.completed_lessons_count = completedList.length;
      return Promise.resolve(user);
    }

    if (action === 'user/refill') {
      user.hearts = user.max_hearts;
      localStorage.setItem('eduup_user', JSON.stringify(user));
      return Promise.resolve(user);
    }

    if (action === 'user/reset') {
      user.xp = 0;
      user.streak = 1;
      user.hearts = 5;
      user.completed_lessons_count = 0;
      localStorage.setItem('eduup_user', JSON.stringify(user));
      localStorage.setItem('eduup_progress', JSON.stringify([]));
      return Promise.resolve(user);
    }

    if (action === 'user/name') {
      user.name = data.name || 'Estudante Roxo';
      localStorage.setItem('eduup_user', JSON.stringify(user));
      return Promise.resolve(user);
    }

    if (action === 'curriculum') {
      const mockCurriculum = this.getMockCurriculum(completedList);
      return Promise.resolve(mockCurriculum);
    }

    if (action.startsWith('lesson')) {
      const lessonId = parseInt(new URLSearchParams(action.split('?')[1] || '').get('id') || '1', 10);
      const lesson = this.getMockLesson(lessonId);
      return Promise.resolve(lesson);
    }

    if (action === 'check-answer') {
      const { question_id, answer } = data;
      const question = this.findMockQuestion(question_id);
      let isCorrect = false;

      if (question.type === 'word_bank') {
        const uWords = (answer || []).map(w => w.trim().toLowerCase());
        const cWords = question.correct_answer.map(w => w.trim().toLowerCase());
        isCorrect = JSON.stringify(uWords) === JSON.stringify(cWords);
      } else if (question.type === 'match_pairs') {
        isCorrect = true;
        for (const [k, v] of Object.entries(question.correct_answer)) {
          if (!answer || answer[k] !== v) {
            isCorrect = false;
            break;
          }
        }
      } else {
        const normUser = String(answer || '').trim().toLowerCase();
        const normCorrect = String(question.correct_answer || '').trim().toLowerCase();
        isCorrect = normUser === normCorrect;
      }

      if (!isCorrect && user.hearts > 0) {
        user.hearts -= 1;
        localStorage.setItem('eduup_user', JSON.stringify(user));
      }

      return Promise.resolve({
        is_correct: isCorrect,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        remaining_hearts: user.hearts
      });
    }

    if (action === 'finish-lesson') {
      const { lesson_id } = data;
      const lesson = this.getMockLesson(lesson_id);
      const xpEarned = lesson ? lesson.xp_reward : 15;

      user.xp += xpEarned;
      if (!completedList.includes(lesson_id)) {
        completedList.push(lesson_id);
        localStorage.setItem('eduup_progress', JSON.stringify(completedList));
      }
      localStorage.setItem('eduup_user', JSON.stringify(user));

      return Promise.resolve({
        success: true,
        xp_earned: xpEarned,
        total_xp: user.xp,
        streak: user.streak,
        lesson_id
      });
    }

    return Promise.reject(new Error('Endpoint não suportado no modo local'));
  }

  // Dados mock fiéis ao seed.sql
  getMockCurriculum(completedList) {
    const allLessons = [
      { id: 1, unit_id: 1, order_index: 1, title: 'Palavras Essenciais', xp_reward: 15, icon_type: 'star' },
      { id: 2, unit_id: 1, order_index: 2, title: 'Cumprimentos & Cortesia', xp_reward: 20, icon_type: 'chat' },
      { id: 3, unit_id: 1, order_index: 3, title: 'Café e Bebidas', xp_reward: 20, icon_type: 'cup' },
      { id: 4, unit_id: 2, order_index: 1, title: 'Café da Manhã', xp_reward: 20, icon_type: 'food' },
      { id: 5, unit_id: 2, order_index: 2, title: 'Ações Cotidianas', xp_reward: 25, icon_type: 'bolt' },
      { id: 6, unit_id: 3, order_index: 1, title: 'No Aeroporto', xp_reward: 25, icon_type: 'plane' },
      { id: 7, unit_id: 3, order_index: 2, title: 'Check-in no Hotel', xp_reward: 30, icon_type: 'key' }
    ];

    let foundCurrent = false;
    const lessonsWithStatus = allLessons.map(l => {
      let status = 'locked';
      if (completedList.includes(l.id)) {
        status = 'completed';
      } else if (!foundCurrent) {
        status = 'current';
        foundCurrent = true;
      }
      return { ...l, status };
    });

    const units = [
      {
        id: 1,
        order_index: 1,
        title: 'Unidade 1: Primeiros Passos',
        description: 'Aprenda cumprimentos, palavras essenciais e frases do dia a dia.',
        theme_color: '#7C3AED',
        lessons: lessonsWithStatus.filter(l => l.unit_id === 1)
      },
      {
        id: 2,
        order_index: 2,
        title: 'Unidade 2: Alimentação & Rotina',
        description: 'Peça comidas e bebidas, e expresse hábitos diários.',
        theme_color: '#6D28D9',
        lessons: lessonsWithStatus.filter(l => l.unit_id === 2)
      },
      {
        id: 3,
        order_index: 3,
        title: 'Unidade 3: Viagens & Destinos',
        description: 'Oriente-se em aeroportos, hotéis e novos lugares.',
        theme_color: '#5B21B6',
        lessons: lessonsWithStatus.filter(l => l.unit_id === 3)
      }
    ];

    return {
      units,
      stats: {
        total_lessons: allLessons.length,
        completed_lessons: completedList.length,
        percentage: Math.round((completedList.length / allLessons.length) * 100)
      }
    };
  }

  getMockLesson(id) {
    const mockQuestionsDb = {
      1: [
        {
          id: 1,
          type: 'word_bank',
          prompt: 'Traduza esta frase:',
          audio_text: 'Hello',
          target_sentence: 'Hello',
          options: ['Olá', 'Tchau', 'Água', 'Pão', 'Você', 'Obrigado'],
          correct_answer: ['Olá'],
          explanation: '"Hello" significa "Olá" em inglês.'
        },
        {
          id: 2,
          type: 'multiple_choice',
          prompt: 'Como se diz "Água" em inglês?',
          audio_text: 'Water',
          target_sentence: 'Água',
          options: ['Water', 'Coffee', 'Tea', 'Bread'],
          correct_answer: 'Water',
          explanation: '"Water" é a tradução exata de água.'
        },
        {
          id: 3,
          type: 'word_bank',
          prompt: 'Traduza para o português:',
          audio_text: 'I drink water',
          target_sentence: 'I drink water',
          options: ['Eu', 'bebo', 'água', 'leite', 'você', 'suco', 'come'],
          correct_answer: ['Eu', 'bebo', 'água'],
          explanation: '"I drink water" traduz-se como "Eu bebo água".'
        },
        {
          id: 4,
          type: 'match_pairs',
          prompt: 'Toque nos pares correspondentes:',
          audio_text: null,
          target_sentence: 'Vocabulário essencial',
          options: {
            left: ['Hello', 'Water', 'Coffee', 'Bread'],
            right: ['Café', 'Pão', 'Olá', 'Água']
          },
          correct_answer: { Hello: 'Olá', Water: 'Água', Coffee: 'Café', Bread: 'Pão' },
          explanation: 'Excelente! Você memorizou todos os termos básicos desta etapa.'
        },
        {
          id: 5,
          type: 'fill_blank',
          prompt: 'Complete a frase com a palavra correta:',
          audio_text: 'Good morning',
          target_sentence: 'Good _____!',
          options: ['morning', 'night', 'water', 'bread'],
          correct_answer: 'morning',
          explanation: '"Good morning" significa "Bom dia".'
        }
      ],
      2: [
        {
          id: 6,
          type: 'multiple_choice',
          prompt: 'Qual expressão significa "Por favor"?',
          audio_text: 'Please',
          target_sentence: 'Por favor',
          options: ['Please', 'Thank you', 'Sorry', 'Welcome'],
          correct_answer: 'Please',
          explanation: '"Please" é utilizado para pedir algo educadamente.'
        },
        {
          id: 7,
          type: 'word_bank',
          prompt: 'Monte a frase traduzida:',
          audio_text: 'Thank you very much',
          target_sentence: 'Thank you very much',
          options: ['Muito', 'obrigado', 'de', 'nada', 'por', 'favor'],
          correct_answer: ['Muito', 'obrigado'],
          explanation: '"Thank you very much" significa "Muito obrigado".'
        },
        {
          id: 8,
          type: 'match_pairs',
          prompt: 'Conecte as saudações às suas traduções:',
          audio_text: null,
          target_sentence: 'Cortesia básica',
          options: {
            left: ['Please', 'Thank you', 'Goodbye', 'Excuse me'],
            right: ['Com licença', 'Tchau', 'Por favor', 'Obrigado']
          },
          correct_answer: {
            Please: 'Por favor',
            Thank you: 'Obrigado',
            Goodbye: 'Tchau',
            'Excuse me': 'Com licença'
          },
          explanation: 'Perfeito! As formas de cortesia são fundamentais em qualquer conversa.'
        },
        {
          id: 9,
          type: 'fill_blank',
          prompt: 'Complete a despedida formal:',
          audio_text: 'See you tomorrow',
          target_sentence: 'See you _____!',
          options: ['tomorrow', 'yesterday', 'today', 'please'],
          correct_answer: 'tomorrow',
          explanation: '"See you tomorrow" significa "Até amanhã".'
        }
      ],
      3: [
        {
          id: 10,
          type: 'word_bank',
          prompt: 'Traduza o pedido:',
          audio_text: 'Coffee with milk, please',
          target_sentence: 'Coffee with milk, please',
          options: ['Café', 'com', 'leite,', 'por', 'favor', 'chá', 'sem'],
          correct_answer: ['Café', 'com', 'leite,', 'por', 'favor'],
          explanation: '"Coffee with milk, please" é o clássico pedido: "Café com leite, por favor".'
        },
        {
          id: 11,
          type: 'multiple_choice',
          prompt: 'Como se diz "Chá" em inglês?',
          audio_text: 'Tea',
          target_sentence: 'Chá',
          options: ['Tea', 'Milk', 'Juice', 'Soda'],
          correct_answer: 'Tea',
          explanation: '"Tea" pronuncia-se como /ti:/ e significa chá.'
        }
      ]
    };

    return {
      id,
      title: id === 1 ? 'Palavras Essenciais' : (id === 2 ? 'Cumprimentos & Cortesia' : 'Café e Bebidas'),
      unit_title: 'Unidade 1: Primeiros Passos',
      xp_reward: 15,
      questions: mockQuestionsDb[id] || mockQuestionsDb[1]
    };
  }

  findMockQuestion(qId) {
    for (let lid = 1; lid <= 3; lid++) {
      const lesson = this.getMockLesson(lid);
      const q = lesson.questions.find(item => item.id === qId);
      if (q) return q;
    }
    return this.getMockLesson(1).questions[0];
  }
}

window.apiService = new ApiService();
