(() => {
  // ============================================================
  // CONSTANTS
  // ============================================================

  // Level grid sizes [cols, rows]
  const LEVEL_GRIDS = [
    [20, 30],
    [24, 38],
    [30, 50],
    [36, 54],
    [40, 60],
  ];
  const LEVEL_SPEEDS = [4.2, 4.6, 5.0, 5.4, 5.8];
  const TOTAL_LEVELS = LEVEL_GRIDS.length;

    // Colors
  const BRICK_COLORS = [
    '#9fd8ff', '#7ec7ff', '#6cc1ff', '#4fb0f0', '#2f8fd6', '#b9e1ff', '#a5d6ff',
  ];

  // Layout
  const TOP_MARGIN = 10;
  const SIDE_MARGIN = 10;
  const BRICK_PAD = 2;
  const PADDLE_BOTTOM_OFFSET = 36;
  const BRICK_AREA_FRACTION = 0.55; // bricks fill top 55% of playfield height

  // Power-up drop probabilities (per brick break)
  const POWERUP_TRIPLE_CHANCE = 0.05;
  const POWERUP_MULTI_CHANCE = 0.1;

  // Hit-sound chance: roughly 1 out of 3 brick breaks
  const HIT_SOUND_CHANCE = 1 / 3;

  // Lives
  const STARTING_LIVES = 3;

  // Performance cap: above this many balls, triple-all is suppressed
  const MAX_BALLS_FOR_TRIPLE = 600;

  // Dev hack: when true, clicking the level pill instantly clears the level.
  const ALLOW_HACKS = true;

  // Audio paths
  const AUDIO = {
    hits: [
      'audio/mama.mp3',
      'audio/wow.mp3',
      'audio/damn.mp3',
      'audio/amazing.mp3',
      'audio/crazy.mp3',
    ],
    fairy: 'audio/fairy dust.mp3',
    airhorn: 'audio/airhorn.mp3',
    diarrhea: 'audio/diarrhea sound effect.mp3',
    rock: 'audio/rock soundtrack.mp3',
    champions: 'audio/we are the champions.mp3',
  };

  // All in-game strings
  const STRINGS = {
    intro: {
      title: ' לחבלין ב - 💙',
      text:  'את מכירה את המשחק הזה נכון?  אם את רוצה את הברכה שלך, תעברי את כל השלבים, ותהני מהמוזיקה המרגיעה ברקע.',
      btn: 'התחלה',
    },
    gameOver: {
      title: '💩 את כל כך לוזרית! 💩',
      textTpl: (score) => `את באמת כל כך גרועה? תחזרי לשלב אחד פחחחחחחחחח`,
      btn: 'חזור',
    },
    win: {
      title: 'You did it, Hevlin! 💙',
      textTpl: (score) => `All 5 levels cleared. Score: ${score}!`,
      btn: 'הברכה שלך 💙',
    },
    toastMulti: '+3 BALLS',
    toastTriple: 'TRIPLE ALL ✨',
    toastLevel: (n) => `Level ${n}`,
    hintLaunch: 'Tap or drag to launch',
    // Each item is its own paragraph in the final greeting screen.
    greeting: [
      'חבלין היקרה 💙',
      'קודם כל מלא מזל טוב כי חייב לומר, וגם בריאות אושר הצלחה עושר וכל השיט הזה.',
      'אבל בנימה יותר אישית, ברוכה הבאה לגיל 16, שזה מוזר להגיד כי היית בת 15 כשפגשתי אותך בפעם הראשונה רק לפני בערך שלושה חודשים, והייתי מאמין לך אם היית אומרת שאת 17, וזה מוזר לחשוב על זה בתור בן 18.',
      'בקצת שאני מכיר אותך הצלחתי כבר מיד להבין שאת בן אדם מדהים ושמח שאוהב את עצמו ואת החברים שלו אפילו יותר, בן אדם שאוהב לחייך כל הזמן, בן אדם עם עומק, מישהי חכמה שכיף לנהל איתה שיחה על כל דבר שהוא, מישהי ששואפת גבוה ושמה לעצמה מטרות, ובגלל כל אלה, אני שמח לקרוא לעצמי חבר שלך. אבל הדבר הכי מדהים זה איך עם כל זה, את גם קצת שרוטה במוח, ועם לא מעט ברגים רופפים, אבל זה נראה לי הדבר הכי טוב בך מכל אלה.',
      'מאחל לך שתישארי כמו שאת חבלין, שלא תשתני בשביל שום דבר ואף אחד, שתמשיכי לשאוף גבוה ולהסתכל קדימה, שתמשיכי לגרום לאנשים סביבך לחייך, ובמיוחד שתמשיכי להיות בת זוג טובה ומדהימה לפשוש הג\'ינג\'י שלי, ושלא תפסיקי לשים לו את החיוך הילדותי הזה על הפנים שיש לו כשהוא איתך, למרות שלפעמים הוא יכול להקשות קצת ולדרוש כאפה.',
      'מזל טוב ימכוערת!',
      'אוהב מאוד - נאד 💙',
    ],
  };



  // ============================================================
  // DOM
  // ============================================================
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const lvlEl = document.getElementById('lvl');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const overlay = document.getElementById('overlay');
  const ovTitle = document.getElementById('ovTitle');
  const ovText = document.getElementById('ovText');
  const ovBtn = document.getElementById('ovBtn');
  const toastEl = document.getElementById('toast');
  const legendEl = document.getElementById('legend');
  const greetingEl = document.getElementById('greeting');
  const appEl = document.getElementById('app');
  const muteBtn = document.getElementById('muteBtn');
  const muteIconOn = muteBtn.querySelector('.ic-on');
  const muteIconOff = muteBtn.querySelector('.ic-off');

  // ============================================================
  // AUDIO
  // ============================================================
  // Per-sound volume levels (0.0 - 1.0). Tweak these freely.
  const VOLUMES = {
    hits: 1.0,
    fairy: 0.8,
    airhorn: 0.7,
    diarrhea: 0.9,
    rock: 0.15,
    champions: 0.7,
  };

  const hitAudios = AUDIO.hits.map(s => {
    const a = new Audio(s);
    a.volume = VOLUMES.hits;
    return a;
  });
  const fairyAudio = new Audio(AUDIO.fairy);
  fairyAudio.volume = VOLUMES.fairy;
  const airhornAudio = new Audio(AUDIO.airhorn);
  airhornAudio.volume = VOLUMES.airhorn;
  const diarrheaAudio = new Audio(AUDIO.diarrhea);
  diarrheaAudio.volume = VOLUMES.diarrhea;
  const rockAudio = new Audio(AUDIO.rock);
  rockAudio.loop = true;
  rockAudio.volume = VOLUMES.rock;
  const championsAudio = new Audio(AUDIO.champions);
  championsAudio.volume = VOLUMES.champions ?? 0.7;

  function playOneShot(audio) {
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (e) {}
  }
  function playRandomHit() {
    const a = hitAudios[Math.floor(Math.random() * hitAudios.length)];
    // clone-like: reuse the same element but reset
    playOneShot(a);
  }
  let musicMuted = false;
  function startMusic() {
    if (musicMuted) return;
    rockAudio.play().catch(() => {});
  }
  function stopMusic() {
    try { rockAudio.pause(); rockAudio.currentTime = 0; } catch (e) {}
  }
  function setMusicMuted(m) {
    musicMuted = m;
    rockAudio.muted = m;
    muteBtn.classList.toggle('muted', m);
    muteIconOn.style.display = m ? 'none' : '';
    muteIconOff.style.display = m ? '' : 'none';
  }
  muteBtn.addEventListener('click', () => setMusicMuted(!musicMuted));

  // ============================================================
  // GAME STATE
  // ============================================================
  let W = 360, H = 600;
  const DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));

  const state = {
    level: 1,
    score: 0,
    lives: STARTING_LIVES,
    running: false,
    awaitLaunch: true,
    paddle: { w: 90, h: 12, x: 0, y: 0 },
    balls: [],
    bricks: [],
    powerUps: [],
    particles: [],
  };

  // ============================================================
  // HELPERS
  // ============================================================
  function showToast(msg, color) {
    toastEl.textContent = msg;
    toastEl.style.color = color || 'var(--accent-deep)';
    toastEl.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove('show'), 1100);
  }

  function showOverlay(title, text, btnText, opts = {}) {
    ovTitle.textContent = title;
    ovText.textContent = text;
    ovBtn.textContent = btnText;
    if (legendEl) legendEl.style.display = opts.legend ? '' : 'none';
    overlay.classList.add('show');
  }
  function hideOverlay() { overlay.classList.remove('show'); }

  function showGreeting() {
    try { championsAudio.pause(); championsAudio.currentTime = 0; } catch (e) {}
    greetingEl.innerHTML = '';
    for (const para of STRINGS.greeting) {
      const p = document.createElement('p');
      p.textContent = para;
      greetingEl.appendChild(p);
    }
    // Match the canvas's width so it sits where the game container was; let height grow naturally.
    greetingEl.style.width = canvas.style.width;
    canvas.style.display = 'none';
    overlay.style.display = 'none';
    const hud = document.querySelector('.hud');
    if (hud) hud.style.display = 'none';
    if (muteBtn) muteBtn.style.display = 'none';
    // Allow page scrolling on the greeting screen (gameplay normally locks scroll).
    document.documentElement.classList.add('scrollable');
    document.body.classList.add('scrollable');
    greetingEl.classList.add('show');
  }

  function makeBall(x, y, dx, dy) {
    return { x, y, dx, dy, r: 5 };
  }

  function resize() {
    const stage = document.getElementById('stage');
    const pad = 12;
    const aw = stage.clientWidth - pad * 2;
    const ah = stage.clientHeight - pad * 2;
    const ratio = 3 / 5;
    let cw = aw, ch = aw / ratio;
    if (ch > ah) { ch = ah; cw = ch * ratio; }
    W = Math.floor(cw); H = Math.floor(ch);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function layoutLevel(reset = true) {
    const [cols, rows] = LEVEL_GRIDS[state.level - 1];
    const usableW = W - SIDE_MARGIN * 2;
    const bw = (usableW - BRICK_PAD * (cols - 1)) / cols;
    const usableBrickH = H * BRICK_AREA_FRACTION;
    const bh = (usableBrickH - BRICK_PAD * (rows - 1)) / rows;

    if (reset) {
      state.bricks = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          state.bricks.push({
            x: SIDE_MARGIN + c * (bw + BRICK_PAD),
            y: TOP_MARGIN + r * (bh + BRICK_PAD),
            w: bw, h: bh,
            color: BRICK_COLORS[(r + c) % BRICK_COLORS.length],
            alive: true,
          });
        }
      }
    } else {
      let i = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (state.bricks[i]) {
            state.bricks[i].x = SIDE_MARGIN + c * (bw + BRICK_PAD);
            state.bricks[i].y = TOP_MARGIN + r * (bh + BRICK_PAD);
            state.bricks[i].w = bw; state.bricks[i].h = bh;
          }
          i++;
        }
      }
    }

    state.paddle.w = Math.max(70, W * 0.22);
    state.paddle.h = 12;
    state.paddle.y = H - PADDLE_BOTTOM_OFFSET;
    if (reset) state.paddle.x = (W - state.paddle.w) / 2;
    else state.paddle.x = Math.min(Math.max(state.paddle.x, 0), W - state.paddle.w);

    if (reset) {
      state.awaitLaunch = true;
      state.balls = [makeBall(state.paddle.x + state.paddle.w / 2, state.paddle.y - 8, 0, 0)];
      state.powerUps = [];
      state.particles = [];
    }
  }

  function startLevel(n) {
    state.level = n;
    lvlEl.textContent = n;
    layoutLevel(true);
    state.running = true;
    hideOverlay();
  }

  function fullReset() {
    state.score = 0;
    state.lives = STARTING_LIVES;
    state.level = 1;
    scoreEl.textContent = 0;
    livesEl.textContent = STARTING_LIVES;
  }

  function launchBalls() {
    const sp = LEVEL_SPEEDS[state.level - 1];
    state.balls.forEach(b => {
      if (b.dx === 0 && b.dy === 0) {
        const ang = (-Math.PI / 2) + (Math.random() * 0.6 - 0.3);
        b.dx = Math.cos(ang) * sp;
        b.dy = Math.sin(ang) * sp;
      }
    });
    state.awaitLaunch = false;
  }

  // ============================================================
  // INPUT
  // ============================================================
  let dragging = false;
  function pointerMove(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    state.paddle.x = Math.min(Math.max(x - state.paddle.w / 2, 0), W - state.paddle.w);
    if (state.awaitLaunch) {
      state.balls.forEach(b => {
        if (b.dx === 0 && b.dy === 0) b.x = state.paddle.x + state.paddle.w / 2;
      });
    }
  }
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    dragging = true;
    pointerMove(e.touches[0].clientX);
    if (state.awaitLaunch && state.running) launchBalls();
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (dragging) pointerMove(e.touches[0].clientX);
  }, { passive: false });
  canvas.addEventListener('touchend', () => { dragging = false; }, { passive: false });

  canvas.addEventListener('mousedown', e => {
    dragging = true; pointerMove(e.clientX);
    if (state.awaitLaunch && state.running) launchBalls();
  });
  window.addEventListener('mousemove', e => { if (dragging) pointerMove(e.clientX); });
  window.addEventListener('mouseup', () => dragging = false);

  ovBtn.addEventListener('click', () => {
    if (ovBtn.dataset.action === 'greeting') {
      hideOverlay();
      showGreeting();
      return;
    }
    fullReset();
    startLevel(1);
    startMusic();
  });

  window.addEventListener('resize', () => { resize(); layoutLevel(false); });

  if (ALLOW_HACKS) {
    const lvlPill = lvlEl.parentElement;
    lvlPill.style.cursor = 'pointer';
    lvlPill.addEventListener('click', () => {
      if (!state.running) return;
      state.bricks.forEach(br => { br.alive = false; });
    });

    const scorePill = scoreEl.parentElement;
    scorePill.style.cursor = 'pointer';
    scorePill.addEventListener('click', () => {
      state.running = false;
      stopMusic();
      hideOverlay();
      showGreeting();
    });
  }

  // ============================================================
  // POWER-UPS
  // ============================================================
  function maybeDropPowerUp(x, y) {
    const r = Math.random();
    if (r < POWERUP_TRIPLE_CHANCE) {
      state.powerUps.push({ x, y, vy: 2.4, type: 'triple' });
    } else if (r < POWERUP_TRIPLE_CHANCE + POWERUP_MULTI_CHANCE) {
      state.powerUps.push({ x, y, vy: 2.4, type: 'multi' });
    }
  }

  function applyPowerUp(type) {
    if (!state.balls.length) return;
    // Block already-spawned triples once we're past the perf cap.
    if (type === 'triple' && state.balls.length > MAX_BALLS_FOR_TRIPLE) return;
    playOneShot(fairyAudio);
    if (type === 'multi') {
      const src = state.balls[Math.floor(Math.random() * state.balls.length)];
      const sp = Math.hypot(src.dx, src.dy) || LEVEL_SPEEDS[state.level - 1];
      for (let i = 0; i < 3; i++) {
        const ang = Math.random() * Math.PI * 2;
        state.balls.push(makeBall(src.x, src.y, Math.cos(ang) * sp, -Math.abs(Math.sin(ang) * sp) || -sp));
      }
      showToast(STRINGS.toastMulti, '#3aa56b');
    } else if (type === 'triple') {
      const cur = state.balls.slice();
      cur.forEach(b => {
        for (let i = 0; i < 2; i++) {
          const ang = Math.atan2(b.dy, b.dx) + (i === 0 ? 0.5 : -0.5);
          const sp = Math.hypot(b.dx, b.dy);
          state.balls.push(makeBall(b.x, b.y, Math.cos(ang) * sp, Math.sin(ang) * sp));
        }
      });
      showToast(STRINGS.toastTriple, '#d6457a');
    }
  }

  function spawnParticles(x, y, color) {
    for (let i = 0; i < 6; i++) {
      state.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 1,
        color,
      });
    }
  }

  // ============================================================
  // UPDATE
  // ============================================================
  function update() {
    if (!state.running) return;

    for (let i = state.balls.length - 1; i >= 0; i--) {
      const b = state.balls[i];
      b.x += b.dx; b.y += b.dy;

      if (b.x - b.r < 0) { b.x = b.r; b.dx = -b.dx; }
      else if (b.x + b.r > W) { b.x = W - b.r; b.dx = -b.dx; }
      if (b.y - b.r < 0) { b.y = b.r; b.dy = -b.dy; }

      const p = state.paddle;
      if (b.dy > 0 && b.y + b.r >= p.y && b.y + b.r <= p.y + p.h + 6 &&
          b.x >= p.x - 2 && b.x <= p.x + p.w + 2) {
        const hit = (b.x - (p.x + p.w / 2)) / (p.w / 2);
        const speed = Math.hypot(b.dx, b.dy);
        const ang = -Math.PI / 2 + hit * (Math.PI / 3);
        b.dx = Math.cos(ang) * speed;
        b.dy = Math.sin(ang) * speed;
        b.y = p.y - b.r - 0.5;
      }

      if (b.y - b.r > H) {
        state.balls.splice(i, 1);
        continue;
      }

      for (const br of state.bricks) {
        if (!br.alive) continue;
        if (b.x + b.r > br.x && b.x - b.r < br.x + br.w &&
            b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
          const overlapL = (b.x + b.r) - br.x;
          const overlapR = (br.x + br.w) - (b.x - b.r);
          const overlapT = (b.y + b.r) - br.y;
          const overlapB = (br.y + br.h) - (b.y - b.r);
          const minX = Math.min(overlapL, overlapR);
          const minY = Math.min(overlapT, overlapB);
          if (minX < minY) b.dx = -b.dx; else b.dy = -b.dy;
          br.alive = false;
          state.score += 10;
          scoreEl.textContent = state.score;
          spawnParticles(br.x + br.w / 2, br.y + br.h / 2, br.color);
          maybeDropPowerUp(br.x + br.w / 2, br.y + br.h / 2);
          if (Math.random() < HIT_SOUND_CHANCE) playRandomHit();
          break;
        }
      }
    }

    for (let i = state.powerUps.length - 1; i >= 0; i--) {
      const pu = state.powerUps[i];
      pu.y += pu.vy;
      const p = state.paddle;
      if (pu.y + 12 >= p.y && pu.y <= p.y + p.h && pu.x >= p.x && pu.x <= p.x + p.w) {
        applyPowerUp(pu.type);
        state.powerUps.splice(i, 1);
      } else if (pu.y > H + 20) {
        state.powerUps.splice(i, 1);
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.08;
      p.life -= 0.03;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    // Game over: any lost ball means full restart
    if (state.balls.length === 0) {
      state.running = false;
      stopMusic();
      playOneShot(diarrheaAudio);
      const finalScore = state.score;
      ovBtn.dataset.action = 'restart';
      showOverlay(STRINGS.gameOver.title, STRINGS.gameOver.textTpl(finalScore), STRINGS.gameOver.btn);
      fullReset();
      layoutLevel(true);
      state.running = false;
      return;
    }

    // Level cleared
    if (state.bricks.every(br => !br.alive)) {
      state.running = false;
      playOneShot(airhornAudio);
      if (state.level >= TOTAL_LEVELS) {
        stopMusic();
        playOneShot(championsAudio);
        const finalScore = state.score;
        ovBtn.dataset.action = 'greeting';
        showOverlay(STRINGS.win.title, STRINGS.win.textTpl(finalScore), STRINGS.win.btn);
        fullReset();
        layoutLevel(true);
      } else {
        const next = state.level + 1;
        showToast(STRINGS.toastLevel(next));
        startLevel(next);
      }
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f6fbff';
    ctx.fillRect(0, 0, W, H);

    for (const br of state.bricks) {
      if (!br.alive) continue;
      ctx.fillStyle = br.color;
      roundRect(br.x, br.y, br.w, br.h, 3);
      ctx.fill();
    }

    const p = state.paddle;
    const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    grad.addColorStop(0, '#9fd8ff');
    grad.addColorStop(1, '#4fb0f0');
    ctx.fillStyle = grad;
    roundRect(p.x, p.y, p.w, p.h, 6);
    ctx.fill();

    for (const b of state.balls) {
      const g = ctx.createRadialGradient(b.x - 1.5, b.y - 1.5, 1, b.x, b.y, b.r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#6cc1ff');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    }

    for (const pu of state.powerUps) {
      const isTriple = pu.type === 'triple';
      ctx.fillStyle = isTriple ? '#ff7aa2' : '#7be0a6';
      roundRect(pu.x - 12, pu.y - 12, 24, 24, 7);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isTriple ? '×3' : '+3', pu.x, pu.y + 1);
    }

    for (const pt of state.particles) {
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 3, 3);
    }
    ctx.globalAlpha = 1;

    if (state.awaitLaunch && state.running) {
      ctx.fillStyle = 'rgba(47,143,214,.7)';
      ctx.font = '600 13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(STRINGS.hintLaunch, W / 2, p.y - 28);
    }
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  // ============================================================
  // BOOT
  // ============================================================
  resize();
  layoutLevel(true);
  ovBtn.dataset.action = 'start';
  showOverlay(STRINGS.intro.title, STRINGS.intro.text, STRINGS.intro.btn, { legend: true });
  loop();
})();
