/**
 * Orquestrador da Aplicação (App Controller)
 * Controla visualizações (Trilha, Perfil), renderização da árvore e estatísticas.
 */

class App {
  constructor() {
    this.currentView = 'path'; // 'path' | 'profile'
    this.user = null;
    this.curriculum = null;

    this.initElements();
    this.bindEvents();
    this.loadData();
  }

  initElements() {
    this.pathViewEl = document.getElementById('view-path');
    this.profileViewEl = document.getElementById('view-profile');

    this.statXpEl = document.getElementById('stat-xp-val');
    this.statStreakEl = document.getElementById('stat-streak-val');
    this.statHeartsEl = document.getElementById('stat-hearts-val');

    this.pathListEl = document.getElementById('roadmap-units-list');
  }

  bindEvents() {
    // Navegação Sidebar e Mobile
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetView = btn.dataset.nav;
        this.switchView(targetView);
      });
    });

    // Clique na pílula de vidas para recarregar
    document.getElementById('pill-hearts').addEventListener('click', async () => {
      if (this.user && this.user.hearts < this.user.max_hearts) {
        if (confirm('Deseja recarregar suas vidas para 5?')) {
          this.user = await window.apiService.request('user/refill', 'POST');
          this.updateUserStats();
          window.soundManager.playVictory();
        }
      }
    });

    // Perfil: Recomeçar progresso
    document.getElementById('btn-reset-progress').addEventListener('click', async () => {
      if (confirm('Atenção: Isto irá redefinir todas as lições, XP e progresso para o início. Deseja continuar?')) {
        this.user = await window.apiService.request('user/reset', 'POST');
        await this.loadData();
        this.switchView('path');
        alert('Progresso reiniciado com sucesso.');
      }
    });

    // Perfil: Salvar novo nome
    document.getElementById('btn-save-name').addEventListener('click', async () => {
      const input = document.getElementById('input-profile-name');
      const newName = input.value.trim();
      if (newName) {
        this.user = await window.apiService.request('user/name', 'POST', { name: newName });
        this.updateProfileView();
        alert('Nome atualizado com sucesso!');
      }
    });

    // Seletor de humor/sprite do mascote
    const picker = document.getElementById('mascot-sprites-picker');
    if (picker) {
      picker.addEventListener('click', (e) => {
        const opt = e.target.closest('.mascot-sprite-option');
        if (!opt) return;
        window.soundManager.playClick();
        picker.querySelectorAll('.mascot-sprite-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        const sprite = opt.dataset.sprite;
        localStorage.setItem('eduup_mascot_sprite', sprite);
        this.applyMascotSprite(sprite);
      });
    }
  }

  switchView(viewName) {
    this.currentView = viewName;

    // Atualiza botões ativos
    document.querySelectorAll('[data-nav]').forEach(b => {
      b.classList.toggle('active', b.dataset.nav === viewName);
    });

    if (viewName === 'path') {
      this.pathViewEl.style.display = 'block';
      this.profileViewEl.style.display = 'none';
    } else if (viewName === 'profile') {
      this.pathViewEl.style.display = 'none';
      this.profileViewEl.style.display = 'block';
      this.updateProfileView();
    }
  }

  async loadData() {
    try {
      const [user, curriculum] = await Promise.all([
        window.apiService.request('user'),
        window.apiService.request('curriculum')
      ]);

      this.user = user;
      this.curriculum = curriculum;

      const activeSprite = localStorage.getItem('eduup_mascot_sprite') || 'mascot_happy.png';
      this.applyMascotSprite(activeSprite);

      this.updateUserStats();
      this.renderCurriculum();
    } catch (err) {
      console.error('Erro ao carregar dados do app:', err);
    }
  }

  applyMascotSprite(sprite) {
    const src = `assets/img/${sprite}`;
    const profileAvatar = document.querySelector('.profile-avatar-large');
    if (profileAvatar) profileAvatar.src = src;

    const brandThumb = document.querySelector('.brand-mascot-thumb');
    if (brandThumb) brandThumb.src = src;

    const sideMascot = document.querySelector('.side-mascot-img');
    if (sideMascot) sideMascot.src = src;

    const picker = document.getElementById('mascot-sprites-picker');
    if (picker) {
      picker.querySelectorAll('.mascot-sprite-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.sprite === sprite);
      });
    }
  }

  updateUserStats() {
    if (!this.user) return;
    if (this.statXpEl) this.statXpEl.textContent = this.user.xp;
    if (this.statStreakEl) this.statStreakEl.textContent = this.user.streak;
    if (this.statHeartsEl) this.statHeartsEl.textContent = this.user.hearts;

    // Mascote dinâmico reage ao estado do usuário na coluna lateral
    const sideMascot = document.querySelector('.side-mascot-img');
    const sideText = document.querySelector('.side-mascot-text');
    if (sideMascot && sideText) {
      if (this.user.hearts <= 1) {
        sideMascot.src = 'assets/img/mascot_sad.png';
        sideText.textContent = '"Estou sem forças! Toque no coração vermelho para recuperar suas vidas."';
      } else if (this.user.streak >= 3) {
        sideMascot.src = 'assets/img/mascot_confident.png';
        sideText.textContent = `"Sensacional! Você já acumulou ${this.user.streak} dias de ofensiva seguidos!"`;
      } else {
        const savedSprite = localStorage.getItem('eduup_mascot_sprite') || 'mascot_happy.png';
        sideMascot.src = `assets/img/${savedSprite}`;
        sideText.textContent = '"Estudar 10 minutos por dia constrói fluência duradoura."';
      }
    }
  }

  renderCurriculum() {
    if (!this.curriculum || !this.curriculum.units) return;

    const alternatingPositions = ['node-pos-center', 'node-pos-left', 'node-pos-center', 'node-pos-right'];
    let nodeCounter = 0;
    let html = '';

    const mascotGreetings = [
      'Vamos praticar!',
      'Pronto para aprender?',
      'Você consegue!',
      'Hora da lição!',
      'Foco e fluência!'
    ];

    this.curriculum.units.forEach((unit, unitIdx) => {
      html += `
        <div class="unit-card" style="background-color: ${unit.theme_color || '#7C3AED'};">
          <div class="unit-header-top">
            <span class="unit-tag">Módulo ${unit.order_index}</span>
            <span class="unit-tag">${unit.lessons ? unit.lessons.length : 0} Lições</span>
          </div>
          <h2 class="unit-title">${unit.title}</h2>
          <p class="unit-desc">${unit.description}</p>
        </div>

        <div class="roadmap-nodes">
      `;

      if (unit.lessons) {
        unit.lessons.forEach(lesson => {
          const posClass = alternatingPositions[nodeCounter % alternatingPositions.length];
          nodeCounter++;

          const isCompleted = lesson.status === 'completed';
          const isCurrent = lesson.status === 'current';
          const isLocked = lesson.status === 'locked';

          let stateClass = 'node-locked';
          let iconName = 'icon-lock';

          if (isCompleted) {
            stateClass = 'node-completed';
            iconName = 'icon-check';
          } else if (isCurrent) {
            stateClass = 'node-current';
            iconName = 'icon-star';
          }

          const greeting = mascotGreetings[nodeCounter % mascotGreetings.length];

          html += `
            <div class="node-container ${posClass}">
              <button class="node-btn ${stateClass}" 
                      data-lesson-id="${lesson.id}" 
                      data-status="${lesson.status}" 
                      title="${lesson.title}" 
                      aria-label="${lesson.title}">
                <svg class="icon icon-lg"><use href="#${iconName}"></use></svg>
              </button>

              ${isCurrent ? (() => {
                let nodeSprite = localStorage.getItem('eduup_mascot_sprite') || 'mascot_happy.png';
                let nodeGreeting = greeting;
                if (this.user && this.user.hearts <= 1) {
                  nodeSprite = 'mascot_sad.png';
                  nodeGreeting = 'Cuidado com as vidas!';
                } else if (this.user && this.user.streak >= 3) {
                  nodeSprite = 'mascot_confident.png';
                  nodeGreeting = `Ofensiva de ${this.user.streak} dias!`;
                }
                return `
                  <div class="mascot-bubble-wrap">
                    <img src="assets/img/${nodeSprite}" alt="Mascote EduUP" class="mascot-mini-avatar">
                    <div class="mascot-speech-bubble">${nodeGreeting}</div>
                  </div>
                `;
              })() : ''}
            </div>
          `;
        });
      }

      html += `</div>`;
    });

    this.pathListEl.innerHTML = html;

    // Conecta cliques nos nós
    this.pathListEl.querySelectorAll('.node-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundManager.playClick();
        const status = btn.dataset.status;
        const lessonId = parseInt(btn.dataset.lessonId, 10);

        if (status === 'locked') {
          alert('Esta lição está bloqueada. Complete a lição anterior para avançar na trilha!');
        } else {
          window.lessonEngine.start(lessonId);
        }
      });
    });
  }

  updateProfileView() {
    if (!this.user) return;

    document.getElementById('profile-display-name').textContent = this.user.name;
    document.getElementById('profile-display-email').textContent = this.user.email || 'estudante@eduup.com';
    document.getElementById('input-profile-name').value = this.user.name;

    document.getElementById('prof-stat-streak').textContent = this.user.streak;
    document.getElementById('prof-stat-xp').textContent = this.user.xp;
    document.getElementById('prof-stat-completed').textContent = this.user.completed_lessons_count || 0;
    document.getElementById('prof-stat-hearts').textContent = `${this.user.hearts} / ${this.user.max_hearts}`;
  }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
