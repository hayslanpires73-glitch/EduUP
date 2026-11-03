/**
 * Motor de Exercícios Interativos (Lesson Runner)
 * Gerencia a progressão das questões, validação e feedback tátil.
 */

class LessonEngine {
  constructor() {
    this.lesson = null;
    this.questions = [];
    this.currentIndex = 0;
    this.userAnswer = null;
    this.isAnswered = false;
    this.hearts = 5;
    this.correctCount = 0;

    // Elementos da DOM
    this.screen = document.getElementById('lesson-screen');
    this.progressBar = document.getElementById('lesson-progress-bar');
    this.heartsCountEl = document.getElementById('lesson-hearts-count');
    this.bodyEl = document.getElementById('lesson-body');
    this.footerEl = document.getElementById('lesson-footer');
    this.feedbackInfoEl = document.getElementById('feedback-info');
    this.checkBtn = document.getElementById('lesson-check-btn');

    this.bindEvents();
  }

  bindEvents() {
    this.checkBtn.addEventListener('click', () => this.handleAction());

    document.getElementById('lesson-exit-btn').addEventListener('click', () => {
      this.showExitWarningModal();
    });

    // Tecla Enter para verificar ou continuar
    window.addEventListener('keydown', (e) => {
      if (!this.screen || this.screen.style.display === 'none') return;
      if (e.key === 'Enter') {
        if (!this.checkBtn.disabled) {
          this.handleAction();
        }
      }
    });
  }

  async start(lessonId) {
    try {
      this.lesson = await window.apiService.request(`lesson?id=${lessonId}`);
      if (!this.lesson || !this.lesson.questions || this.lesson.questions.length === 0) {
        alert('Esta lição ainda não possui questões cadastradas.');
        return;
      }

      const user = await window.apiService.request('user');
      this.hearts = user.hearts;
      if (this.hearts <= 0) {
        alert('Você está sem vidas! Pratique para recuperar ou recarregue no perfil.');
        return;
      }

      this.questions = this.lesson.questions;
      this.currentIndex = 0;
      this.correctCount = 0;
      this.updateHeartsDisplay();

      this.screen.style.display = 'flex';
      this.renderCurrentQuestion();
    } catch (err) {
      console.error('Erro ao iniciar lição:', err);
      alert('Não foi possível carregar a lição.');
    }
  }

  close() {
    this.screen.style.display = 'none';
    if (window.app) {
      window.app.loadData();
    }
  }

  updateHeartsDisplay() {
    if (this.heartsCountEl) {
      this.heartsCountEl.textContent = this.hearts;
    }
  }

  renderCurrentQuestion() {
    this.isAnswered = false;
    this.userAnswer = null;
    this.checkBtn.disabled = true;
    this.checkBtn.textContent = 'Verificar';
    this.checkBtn.className = 'btn btn-primary';

    // Reseta estado do rodapé
    this.footerEl.className = 'lesson-footer';
    this.feedbackInfoEl.innerHTML = '';

    // Atualiza barra de progresso
    const progressPercent = Math.round((this.currentIndex / this.questions.length) * 100);
    this.progressBar.style.width = `${progressPercent}%`;

    const q = this.questions[this.currentIndex];

    // Constrói cabeçalho da questão
    let html = `
      <h2 class="question-prompt">${q.prompt}</h2>
    `;

    if (q.target_sentence) {
      html += `
        <div class="question-target-wrap">
          ${q.audio_text ? `
            <button class="audio-btn" id="audio-play-btn" title="Ouvir pronúncia" aria-label="Ouvir pronúncia">
              <svg class="icon icon-md"><use href="#icon-speaker"></use></svg>
            </button>
          ` : ''}
          <span class="target-text">${q.target_sentence}</span>
        </div>
      `;
    }

    // Renderiza área de acordo com o tipo
    if (q.type === 'word_bank') {
      html += this.renderWordBank(q);
    } else if (q.type === 'multiple_choice' || q.type === 'fill_blank') {
      html += this.renderMultipleChoice(q);
    } else if (q.type === 'match_pairs') {
      html += this.renderMatchPairs(q);
    }

    this.bodyEl.innerHTML = html;

    // Configura áudio se disponível
    if (q.audio_text) {
      const audioBtn = document.getElementById('audio-play-btn');
      if (audioBtn) {
        audioBtn.addEventListener('click', () => {
          window.soundManager.speak(q.audio_text);
        });
      }
      // Toca áudio automaticamente ao abrir a questão
      setTimeout(() => {
        window.soundManager.speak(q.audio_text);
      }, 200);
    }

    this.attachQuestionListeners(q);
  }

  // 1. Renderiza Banco de Palavras
  renderWordBank(q) {
    const words = Array.isArray(q.options) ? q.options : [];
    return `
      <div class="wordbank-dropzone" id="wordbank-dropzone"></div>
      <div class="wordbank-sourcezone" id="wordbank-sourcezone">
        ${words.map((word, idx) => `
          <button class="word-chip" data-word="${word}" data-index="${idx}">${word}</button>
        `).join('')}
      </div>
    `;
  }

  // 2. Renderiza Múltipla Escolha e Completar Lacuna
  renderMultipleChoice(q) {
    const options = Array.isArray(q.options) ? q.options : [];
    return `
      <div class="choice-list" id="choice-list">
        ${options.map((opt, idx) => `
          <div class="choice-card" data-val="${opt}">
            <span class="choice-badge">${idx + 1}</span>
            <span class="choice-label">${opt}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 3. Renderiza Combinação de Pares
  renderMatchPairs(q) {
    const leftList = q.options.left || [];
    const rightList = q.options.right || [];
    return `
      <div class="match-pairs-grid" id="match-pairs-grid">
        <div class="match-col" id="match-col-left">
          ${leftList.map(item => `
            <button class="pair-btn" data-side="left" data-val="${item}">${item}</button>
          `).join('')}
        </div>
        <div class="match-col" id="match-col-right">
          ${rightList.map(item => `
            <button class="pair-btn" data-side="right" data-val="${item}">${item}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  attachQuestionListeners(q) {
    if (q.type === 'word_bank') {
      const dropzone = document.getElementById('wordbank-dropzone');
      const sourcezone = document.getElementById('wordbank-sourcezone');
      const selectedWords = [];

      sourcezone.addEventListener('click', (e) => {
        const btn = e.target.closest('.word-chip');
        if (!btn || btn.classList.contains('placed')) return;
        window.soundManager.playClick();

        const word = btn.dataset.word;
        const chip = document.createElement('button');
        chip.className = 'word-chip';
        chip.textContent = word;
        chip.dataset.word = word;
        chip.dataset.sourceIdx = btn.dataset.index;

        chip.addEventListener('click', () => {
          window.soundManager.playClick();
          btn.classList.remove('placed');
          chip.remove();
          const remIdx = selectedWords.indexOf(word);
          if (remIdx > -1) selectedWords.splice(remIdx, 1);
          this.userAnswer = [...selectedWords];
          this.checkBtn.disabled = selectedWords.length === 0;
        });

        dropzone.appendChild(chip);
        btn.classList.add('placed');
        selectedWords.push(word);

        this.userAnswer = [...selectedWords];
        this.checkBtn.disabled = selectedWords.length === 0;
      });
    } else if (q.type === 'multiple_choice' || q.type === 'fill_blank') {
      const list = document.getElementById('choice-list');
      list.addEventListener('click', (e) => {
        const card = e.target.closest('.choice-card');
        if (!card) return;
        window.soundManager.playClick();

        list.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        this.userAnswer = card.dataset.val;
        this.checkBtn.disabled = false;
      });
    } else if (q.type === 'match_pairs') {
      let selectedLeft = null;
      let selectedRight = null;
      const matchedPairs = {};
      const totalPairsCount = Object.keys(q.correct_answer).length;

      const grid = document.getElementById('match-pairs-grid');
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.pair-btn');
        if (!btn || btn.classList.contains('matched')) return;
        window.soundManager.playClick();

        const side = btn.dataset.side;
        const val = btn.dataset.val;

        if (side === 'left') {
          grid.querySelectorAll('.match-col#match-col-left .pair-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedLeft = { el: btn, val: val };
        } else {
          grid.querySelectorAll('.match-col#match-col-right .pair-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedRight = { el: btn, val: val };
        }

        // Se ambos foram selecionados, avalia o par
        if (selectedLeft && selectedRight) {
          const expectedRight = q.correct_answer[selectedLeft.val];
          if (expectedRight === selectedRight.val) {
            // Par correto!
            selectedLeft.el.classList.add('matched');
            selectedRight.el.classList.add('matched');
            matchedPairs[selectedLeft.val] = selectedRight.val;
            selectedLeft = null;
            selectedRight = null;

            if (Object.keys(matchedPairs).length === totalPairsCount) {
              this.userAnswer = matchedPairs;
              this.checkBtn.disabled = false;
              // Valida automaticamente quando todos os pares forem combinados
              this.handleAction();
            }
          } else {
            // Par incorreto: treme e desseleciona
            const el1 = selectedLeft.el;
            const el2 = selectedRight.val ? selectedRight.el : null;
            el1.classList.add('error-shake');
            if (el2) el2.classList.add('error-shake');

            setTimeout(() => {
              el1.classList.remove('error-shake', 'active');
              if (el2) el2.classList.remove('error-shake', 'active');
            }, 400);

            selectedLeft = null;
            selectedRight = null;
          }
        }
      });
    }
  }

  async handleAction() {
    if (!this.isAnswered) {
      await this.verifyAnswer();
    } else {
      this.nextQuestion();
    }
  }

  async verifyAnswer() {
    const q = this.questions[this.currentIndex];
    this.isAnswered = true;

    try {
      const result = await window.apiService.request('check-answer', 'POST', {
        question_id: q.id,
        answer: this.userAnswer
      });

      this.hearts = result.remaining_hearts;
      this.updateHeartsDisplay();

      if (result.is_correct) {
        this.correctCount++;
        window.soundManager.playCorrect();
        this.footerEl.className = 'lesson-footer state-correct';
        this.feedbackInfoEl.innerHTML = `
          <img src="assets/img/mascot_confident.png" alt="Mascote Orgulhoso" class="feedback-mascot-img">
          <div>
            <div class="feedback-title">Excelente!</div>
            <div class="feedback-desc">${result.explanation || 'Resposta perfeitamente correta.'}</div>
          </div>
        `;
        this.checkBtn.className = 'btn btn-success';
        this.checkBtn.textContent = 'Continuar';
      } else {
        window.soundManager.playWrong();
        this.footerEl.className = 'lesson-footer state-wrong';
        const correctStr = Array.isArray(result.correct_answer)
          ? result.correct_answer.join(' ')
          : (typeof result.correct_answer === 'object' ? 'Pares corretos memorizados' : result.correct_answer);

        this.feedbackInfoEl.innerHTML = `
          <img src="assets/img/mascot_sad.png" alt="Mascote Triste" class="feedback-mascot-img">
          <div>
            <div class="feedback-title">Não foi dessa vez</div>
            <div class="feedback-desc">Resposta correta: <strong>${correctStr}</strong></div>
          </div>
        `;
        this.checkBtn.className = 'btn btn-error';
        this.checkBtn.textContent = 'Continuar';

        if (this.hearts <= 0) {
          setTimeout(() => {
            this.showGameOverModal();
          }, 800);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar resposta:', err);
    }
  }

  async nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex >= this.questions.length) {
      await this.finishLesson();
    } else {
      this.renderCurrentQuestion();
    }
  }

  async finishLesson() {
    this.progressBar.style.width = '100%';
    window.soundManager.playVictory();

    const score = Math.round((this.correctCount / this.questions.length) * 100);

    try {
      const result = await window.apiService.request('finish-lesson', 'POST', {
        lesson_id: this.lesson.id,
        score
      });

      this.showCompletionModal(result, score);
    } catch (err) {
      console.error('Erro ao finalizar lição:', err);
      this.close();
    }
  }

  showCompletionModal(result, score) {
    const modalHtml = `
      <div class="modal-overlay" id="completion-modal">
        <div class="modal-card">
          <img src="assets/img/mascot.png" alt="Mascote Comemorando" class="modal-mascot-img">
          <h2 class="modal-title">Lição Concluída!</h2>
          <p class="modal-subtitle">Você deu mais um grande passo rumo à fluência.</p>
          
          <div class="modal-rewards-row">
            <div class="reward-box">
              <svg class="icon icon-md" style="color: var(--color-primary);"><use href="#icon-xp"></use></svg>
              <span class="reward-value">+${result.xp_earned}</span>
              <span class="reward-label">Total XP</span>
            </div>
            <div class="reward-box">
              <svg class="icon icon-md" style="color: #D97706;"><use href="#icon-flame"></use></svg>
              <span class="reward-value">${result.streak}</span>
              <span class="reward-label">Dias Ofensiva</span>
            </div>
            <div class="reward-box">
              <svg class="icon icon-md" style="color: #059669;"><use href="#icon-check"></use></svg>
              <span class="reward-value">${score}%</span>
              <span class="reward-label">Precisão</span>
            </div>
          </div>

          <button class="btn btn-primary" id="modal-finish-btn" style="width: 100%;">
            Continuar para a Trilha
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('modal-finish-btn').addEventListener('click', () => {
      document.getElementById('completion-modal').remove();
      this.close();
    });
  }

  showExitWarningModal() {
    const modalHtml = `
      <div class="modal-overlay" id="exit-warning-modal">
        <div class="modal-card">
          <img src="assets/img/mascot_angry.png" alt="Mascote Exigente" class="modal-mascot-img">
          <h2 class="modal-title">Espere! Não desista!</h2>
          <p class="modal-subtitle">Se você sair agora, todo o progresso e as respostas desta lição serão perdidos.</p>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
            <button class="btn btn-primary" id="btn-stay-lesson">Continuar Estudando</button>
            <button class="btn btn-white" id="btn-confirm-exit">Sair Mesmo Assim</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('btn-stay-lesson').addEventListener('click', () => {
      document.getElementById('exit-warning-modal').remove();
    });
    document.getElementById('btn-confirm-exit').addEventListener('click', () => {
      document.getElementById('exit-warning-modal').remove();
      this.close();
    });
  }

  showGameOverModal() {
    const modalHtml = `
      <div class="modal-overlay" id="game-over-modal">
        <div class="modal-card">
          <img src="assets/img/mascot_sad.png" alt="Mascote Sem Vidas" class="modal-mascot-img">
          <h2 class="modal-title">Suas vidas acabaram!</h2>
          <p class="modal-subtitle">Não fique triste! Você pode recarregar suas 5 vidas agora mesmo para continuar aprendendo.</p>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
            <button class="btn btn-primary" id="btn-refill-continue">Recarregar 5 Vidas & Continuar</button>
            <button class="btn btn-white" id="btn-back-path">Voltar para a Trilha</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('btn-refill-continue').addEventListener('click', async () => {
      await window.apiService.request('user/refill', 'POST');
      this.hearts = 5;
      this.updateHeartsDisplay();
      document.getElementById('game-over-modal').remove();
      window.soundManager.playVictory();
    });

    document.getElementById('btn-back-path').addEventListener('click', () => {
      document.getElementById('game-over-modal').remove();
      this.close();
    });
  }
}

window.lessonEngine = new LessonEngine();
