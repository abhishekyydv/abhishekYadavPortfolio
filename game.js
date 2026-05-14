const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Rocket
const rocket = { x: canvas.width / 2, y: canvas.height / 2, width: 12, height: 28, angle: 0 };
let mouse = { x: rocket.x, y: rocket.y };
let mouseDown = false;

// Bullets
const bullets = [];
const bulletSpeed = 6;
let lastFireTime = 0;
const fireInterval = 300;

// Targets
const targets = [];
let targetWaveActive = false;
let score = 0;
const scoreDiv = document.getElementById('score');

// Stars + Comets
const stars = Array.from({ length: 150 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 1.3,
  speed: 0.05 + Math.random() * 0.15,
  opacity: 0.15 + Math.random() * 0.25
}));
const comets = [];

// 🎯 Mouse control
canvas.addEventListener('mousemove', e => mouse = { x: e.clientX, y: e.clientY });
canvas.addEventListener('mousedown', () => mouseDown = true);
canvas.addEventListener('mouseup', () => mouseDown = false);

// 🚀 Rocket motion
function updateRocket() {
  const speed = 0.0045;
  rocket.x += (mouse.x - rocket.x) * speed;
  rocket.y += (mouse.y - rocket.y) * speed;
  rocket.angle = Math.atan2(mouse.y - rocket.y, mouse.x - rocket.x);

  if (mouseDown && Date.now() - lastFireTime > fireInterval) {
    fireBullet();
    lastFireTime = Date.now();
  }
}

// 🔫 Fire bullets
function fireBullet() {
  const tipX = rocket.x + Math.cos(rocket.angle) * 15;
  const tipY = rocket.y + Math.sin(rocket.angle) * 15;
  bullets.push({ x: tipX, y: tipY, angle: rocket.angle, speed: bulletSpeed, trail: [] });
}

// 💫 Bullets update
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 4) b.trail.shift();

    ctx.strokeStyle = 'rgba(200,200,200,0.3)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    b.trail.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
    ctx.fill();

    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(i, 1);
  }
}


// 🌌 Targets spawn from screen edges
function spawnTargetWave() {
  // If a wave is already active, don't spawn
  if (targetWaveActive) return;

  // If we already have 50 or more targets, wait
  if (targets.length >= 50) return;

  targetWaveActive = true;

  const waveCount = 6 + Math.floor(Math.random() * 2);

  for (let i = 0; i < waveCount; i++) {
    // Make sure total targets do not exceed 50
    if (targets.length >= 50) break;

    const side = Math.floor(Math.random() * 2);
    const shapes = ['hollow'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    let x, y, vx, vy;
    const targetSize = 15 + Math.random() * 10;

    // Spawn from edges
    if (side === 0) {
      x = Math.random() * canvas.width;
      y = -targetSize * 2;
      vx = (Math.random() - 0.5) * 1.5;
      vy = 1 + Math.random() * 1.5;
    } else if (side === 1) {
      x = canvas.width + targetSize * 2;
      y = Math.random() * canvas.height;
      vx = -(1 + Math.random() * 1.5);
      vy = (Math.random() - 0.5) * 1.5;
    } else if (side === 2) {
      x = Math.random() * canvas.width;
      y = canvas.height + targetSize * 2;
      vx = (Math.random() - 0.5) * 1.5;
      vy = -(1 + Math.random() * 1.5);
    } else {
      x = -targetSize * 2;
      y = Math.random() * canvas.height;
      vx = 1 + Math.random() * 1.5;
      vy = (Math.random() - 0.5) * 1.5;
    }

    targets.push({
      x, y, vx, vy,
      size: targetSize,
      color: `rgba(200,200,200,0.3)`,
      shape,
      hits: shape === 'hollow' ? 2 + Math.floor(Math.random() * 2) : 1,
      entered: false,
      hitEffect: [],
      depthLimit: 150 + Math.random() * 200
    });
  }

  setTimeout(() => targetWaveActive = false, 4500);
}

 

// 💥 Explosion particles
function createExplosion(x, y) {
  const particles = [];
  for (let i = 0; i < 10; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: 2 + Math.random() * 2,
      opacity: 1
    });
  }
  return particles;
}

// 🎯 Targets update
function updateTargets() {
  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i];

    // Move further inside the screen
    if (!t.entered) {
      t.x += t.vx;
      t.y += t.vy;

      // Move deeper (closer to center)
      if (
        t.x > t.depthLimit &&
        t.x < canvas.width - t.depthLimit &&
        t.y > t.depthLimit &&
        t.y < canvas.height - t.depthLimit
      ) {
        t.entered = true;
        t.vx = t.vy = 0; // stop inside the play area
      }
    }

    // Hit explosion particles
    if (t.hitEffect.length > 0) {
      t.hitEffect.forEach(p => {
        ctx.fillStyle = `rgba(255,150,100,${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.02;
      });
      t.hitEffect = t.hitEffect.filter(p => p.opacity > 0);
    }

    // Draw shapes
    if (t.shape === 'hollow') {
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = t.color;
      ctx.beginPath();
      if (t.shape === 'circle') ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
      else if (t.shape === 'triangle') {
        ctx.moveTo(t.x, t.y - t.size);
        ctx.lineTo(t.x + t.size, t.y + t.size);
        ctx.lineTo(t.x - t.size, t.y + t.size);
        ctx.closePath();
      } else if (t.shape === 'hexagon') {
        for (let j = 0; j < 6; j++) {
          const a = Math.PI / 3 * j;
          const x = t.x + t.size * Math.cos(a);
          const y = t.y + t.size * Math.sin(a);
          j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
      }
      ctx.fill();
    }

    // 🔫 Bullet collision
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dist = Math.hypot(b.x - t.x, b.y - t.y);
      if (dist < t.size + 2) {
        bullets.splice(j, 1);
        t.hits--;
        t.hitEffect.push(...createExplosion(t.x, t.y));
        if (t.hits <= 0) {
          targets.splice(i, 1);
          score++;
          if (score >= 10) {
  setTimeout(() => {
    window.location.href = "portfolio.html";
  }, 500);
}

        }
        scoreDiv.textContent = `${score}/10`;
        break;
      }
    }
  }
}

// 🌠 Stars + Comets
function drawStarsAndComets() {
  stars.forEach(s => {
    ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });

  if (Math.random() < 0.002) {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 3 + Math.random() * 3;
    if (side === 0) { x = Math.random() * canvas.width; y = -20; vx = (Math.random() - 0.5) * 1; vy = speed; }
    else if (side === 1) { x = canvas.width + 20; y = Math.random() * canvas.height; vx = -speed; vy = (Math.random() - 0.5) * 1; }
    else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 20; vx = (Math.random() - 0.5) * 1; vy = -speed; }
    else { x = -20; y = Math.random() * canvas.height; vx = speed; vy = (Math.random() - 0.5) * 1; }
    comets.push({ x, y, vx, vy, length: 40 + Math.random() * 40, opacity: 0.2 + Math.random() * 0.3 });
  }

  comets.forEach((c, i) => {
    ctx.strokeStyle = `rgba(255,255,255,${c.opacity})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x - c.length * c.vx / 4, c.y - c.length * c.vy / 4);
    ctx.stroke();
    c.x += c.vx;
    c.y += c.vy;

    targets.forEach((t, ti) => {
      const dist = Math.hypot(c.x - t.x, c.y - t.y);
      if (dist < t.size + 10) {
        t.hitEffect.push(...createExplosion(t.x, t.y));
        targets.splice(ti, 1);
        comets.splice(i, 1);
        score++;
        if (score >= 10) {
  setTimeout(() => {
    window.location.href = "portfolio.html";
  }, 500);
}

        scoreDiv.textContent = `${score}/10`;
      }
    });

    if (c.x < -100 || c.x > canvas.width + 100 || c.y < -100 || c.y > canvas.height + 100)
      comets.splice(i, 1);
  });
}

// 🚀 Rocket draw
function drawRocket() {
  const angle = Math.atan2(mouse.y - rocket.y, mouse.x - rocket.x);
  ctx.save();
  ctx.translate(rocket.x, rocket.y);
  ctx.rotate(angle);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-10, -7);
  ctx.lineTo(-10, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 🎮 Main loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStarsAndComets();
  updateRocket();
  drawRocket();
  updateBullets();
  updateTargets();
  requestAnimationFrame(gameLoop);
}

setInterval(spawnTargetWave, 4500);
requestAnimationFrame(gameLoop);
