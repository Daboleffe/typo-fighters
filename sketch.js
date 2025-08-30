let canvas;
let player;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let sparks = [];
let explosions = [];
let fireworks = [];
let fallingLetters = [];
let fallingItems = [];
let score = 0;
let gameOver = false;
let gameStarted = false;
let victory = false;
let lives = 3;
let enemyMoveDir = 1;
let mainFont;
let altFonts = [];
let currentFonts = [];
let victoryFonts = [];
let gameOverFonts = [];
let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const TOP_UI = 120;
let bgMusic;
let targetWord = "";
let collectedWord = "";
let glitchIndex = -1;
let glitchTimer = 0;
let wordFont;

function preload() {
  try {
    mainFont = loadFont('Helvetica.ttf');
    altFonts = [
      loadFont('Roboto-Regular.ttf'),
      loadFont('Merriweather_24pt-Regular.ttf'),
      loadFont('ComicNeue.ttf'),
      loadFont('CourierPrime.ttf')
    ];
  } catch (e) {
    // fallback a font di sistema (p5 può accettare nomi di famiglia come stringhe)
    mainFont = 'sans-serif';
    altFonts = ['serif','monospace','cursive','fantasy'];
  }
  try {
    bgMusic = loadSound('musica.mp3');
  } catch (e) {
    bgMusic = null;
  }
}

function setup() {
  canvas = createCanvas(1280, 720);
  canvas.parent('gameContainer');

  player = new Player();
  setNewWord();
  // meno lettere iniziali per performance e bilanciamento
  for (let i = 0; i < 80; i++) fallingLetters.push(new FallingLetter());
  // meno item contemporanei
  for (let i = 0; i < 4; i++) fallingItems.push(new FallingItem());
  updatePlayerSymbol();
}

class Player {
  constructor() {
    this.x = width / 2;
    this.w = 40;
    this.h = 20;
    this.speed = 6;
    this.symbol = "X";
  }
  show() {
    textAlign(CENTER, CENTER);
    textFont(mainFont);
    // ridotto: dimensione simbolo meno ingombrante
    textSize(40);

    // colore dinamico in base alle vite con lampeggio su 1 vita
    if (lives >= 3) {
      fill(0, 200, 255); // ciano
      drawingContext.shadowColor = color(0, 200, 255);
    } else if (lives === 2) {
      fill(255, 180, 0); // giallo/arancio
      drawingContext.shadowColor = color(255, 180, 0);
    } else if (lives === 1) {
      // rosso lampeggiante
      let pulse = sin(frameCount * 0.2) * 80 + 175;
      fill(255, pulse, pulse);
      drawingContext.shadowColor = color(255, 80, 80);
    }

    drawingContext.shadowBlur = 20;
    text(this.symbol, this.x, height - 50);
    drawingContext.shadowBlur = 0;
  }
  move() {
    // A / D oppure frecce
    if ((keyIsDown(65) || keyIsDown(37)) && this.x - this.w / 2 > 0) this.x -= this.speed;
    if ((keyIsDown(68) || keyIsDown(39)) && this.x + this.w / 2 < width) this.x += this.speed;
  }
}

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 10; // aumentata la velocità del proiettile del player
    this.symbol = random([".", ":", "|", "*"]);
    this.size = 28;
  }
  show() {
    fill(0, 180, 255);
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(0, 180, 255);
    textSize(this.size);
    textAlign(CENTER, CENTER);
    text(this.symbol, this.x, this.y);
    drawingContext.shadowBlur = 0;
  }
  update() {
    this.y -= this.speed;
  }
  offscreen() {
    return this.y < -50;
  }
  hits(enemy) {
    return dist(this.x, this.y, enemy.x, enemy.y) < 30;
  }
}

class EnemyBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 4.5; // aumentata
    this.symbol = "•";
  }
  show() {
    fill(255, 80, 80);
    textSize(25);
    textAlign(CENTER, CENTER);
    text(this.symbol, this.x, this.y);
  }
  update() {
    this.y += this.speed;
  }
  offscreen() {
    return this.y > height + 50;
  }
  hits(player) {
    return dist(this.x, this.y, player.x, height - 50) < 28;
  }
}

class Enemy {
  constructor(x, y, symbol, font, idx, speedX) {
    this.x = x;
    this.y = y;
    this.symbol = symbol;
    this.font = font;
    this.offset = random(0, TWO_PI);
    this.idx = idx;
    this.speedX = speedX || random(0.6, 1.2) * (random() > 0.5 ? 1 : -1);
  }
  show() {
    textAlign(CENTER, CENTER);
    textSize(36);
    let baseColor = color(255, 140, 120 + 80 * sin(frameCount * 0.05 + this.offset));
    drawingContext.shadowBlur = 18;
    drawingContext.shadowColor = baseColor;
    if (this.idx === glitchIndex) {
      textFont(random([mainFont, ...altFonts]));
      let xo = sin(frameCount * 0.15 + this.offset) * random(-6,6);
      push();
      translate(xo, 0);
      fill(255, random(150,255), random(100,255));
      text(this.symbol, this.x, this.y);
      pop();
    } else {
      textFont(this.font);
      fill(baseColor);
      let ox = sin(frameCount * 0.02 + this.offset) * 6;
      text(this.symbol, this.x + ox, this.y);
    }
    drawingContext.shadowBlur = 0;
  }
}

class Spark {
  constructor(x, y, col, symbol) {
    this.x = x;
    this.y = y;
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.alpha = 255;
    this.col = col;
    this.symbol = symbol;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 10;
  }
  show() {
    push();
    fill(red(this.col), green(this.col), blue(this.col), this.alpha);
    textSize(12);
    text(this.symbol, this.x, this.y);
    pop();
  }
  finished() {
    return this.alpha <= 0;
  }
}

class Explosion {
  constructor(x, y, symbol) {
    this.x = x;
    this.y = y;
    this.symbols = [];
    for (let i = 0; i < 15; i++) {
      this.symbols.push({
        x: x,
        y: y,
        vx: random(-3, 3),
        vy: random(-3, 3),
        alpha: 255,
        ch: symbol
      });
    }
  }
  update() {
    for (let s of this.symbols) {
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= 8;
    }
  }
  show() {
    push();
    textSize(18);
    for (let s of this.symbols) {
      fill(255, 150, 0, s.alpha);
      text(s.ch, s.x, s.y);
    }
    pop();
  }
  finished() {
    return this.symbols.every(s => s.alpha <= 0);
  }
}

class Firework {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.symbols = [];
    let s = random(letters);
    for (let i = 0; i < 22; i++) {
      let angle = random(TWO_PI);
      let speed = random(1, 4);
      this.symbols.push({
        x: x,
        y: y,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        alpha: 255,
        ch: s
      });
    }
  }
  update() {
    for (let s of this.symbols) {
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= 6;
    }
  }
  show() {
    push();
    textSize(20);
    for (let s of this.symbols) {
      fill(0, 200, 255, s.alpha);
      text(s.ch, s.x, s.y);
    }
    pop();
  }
  finished() {
    return this.symbols.every(s => s.alpha <= 0);
  }
}

class FallingItem {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = random(60, width - 60);
    // velocità leggermente aumentata
    this.vy = random(1.8, 3.2);
    this.font = random([mainFont, ...altFonts]);
    // spawn più in basso per evitare sovrapposizione con UI/top word
    this.y = random(160, 260);
    this.ch = random(letters);
  }
  update() {
    this.y += this.vy;
    if (this.y > height + 30) {
      // usa reset() che pone l'item più in basso
      this.reset();
      this.x = random(40, width - 40);
    }
  }
  show() {
    push();
    textFont(this.font);
    textSize(28);
    textAlign(CENTER, CENTER);
    fill(255, 80, 80);
    drawingContext.shadowBlur = 12;
    drawingContext.shadowColor = color(255, 80, 80);
    text(this.ch, this.x, this.y);
    drawingContext.shadowBlur = 0;
    pop();
  }
  hitsPlayer() {
    return dist(this.x, this.y, player.x, height - 50) < 32;
  }
}

class FallingLetter {
  constructor() {
    this.x = random(width);
    // spawn più in basso per non apparire sopra la parola target
    this.y = random(120, height);
    // velocità aumentata
    this.vy = random(2.5, 4.5);
    this.ch = random(letters);
    this.font = random([mainFont, ...altFonts]);
  }
  update() {
    this.y += this.vy;
    if (this.y > height) {
      // corregge il reset
      this.y = random(120, height);
      this.x = random(width);
    }
  }
  show() {
    textSize(18); // meno invasivo
    textFont(this.font);
    fill(200, 0, 0, 150);
    text(this.ch, this.x, this.y);
  }
}

function playLetterSound(letter) {
  // suono glitch veloce (riattivato)
  try {
    let osc = new p5.Oscillator(random(["sine","triangle","sawtooth"]));
    osc.freq(random(300, 900));
    osc.amp(0.25, 0.01);
    osc.start();
    setTimeout(() => osc.stop(), 110);
  } catch (e) {}
}

function playDamageSound() {
  // rumore breve per danno
  try {
    let noise = new p5.Noise("white");
    noise.amp(0.35, 0.02);
    noise.start();
    setTimeout(() => noise.stop(), 160);
  } catch (e) {}
}

function playWinSound() {
  try {
    let freqs = [660, 780, 900];
    for (let i = 0; i < freqs.length; i++) {
      setTimeout(() => {
        let osc = new p5.Oscillator('triangle');
        osc.freq(freqs[i]);
        osc.amp(0.22, 0.01);
        osc.start();
        setTimeout(() => osc.stop(), 180);
      }, i * 110);
    }
  } catch (e) {}
}

function playLoseSound() {
  try {
    let osc = new p5.Oscillator('sawtooth');
    osc.freq(260);
    osc.amp(0.35, 0.01);
    osc.start();
    osc.freq(80, 0.55);
    setTimeout(() => osc.stop(), 560);
  } catch (e) {}
}

function updatePlayerSymbol() {
  if (lives >= 3) player.symbol = "X";
  else if (lives === 2) player.symbol = "Y";
  else if (lives === 1) player.symbol = "Z";
  else player.symbol = "";
}

function loseLife(sourceSymbol) {
  if (lives <= 0) return;
  lives--;
  updatePlayerSymbol();
  playDamageSound();
  explosions.push(new Explosion(player.x, height - 50, sourceSymbol || "•"));
  if (lives <= 0 && !gameOver) {
    gameOver = true;
    try {
      if (bgMusic && typeof bgMusic.isPlaying === 'function' && bgMusic.isPlaying()) {
        bgMusic.setVolume(0, 0.35);
        setTimeout(() => {
          try {
            if (bgMusic && typeof bgMusic.isPlaying === 'function' && bgMusic.isPlaying()) bgMusic.stop();
            if (bgMusic) bgMusic.setVolume(1);
          } catch (e) {}
        }, 400);
      }
    } catch (e) {
      try { if (bgMusic) bgMusic.stop(); } catch (e) {}
    }
    playLoseSound();
  }
}

function setNewWord() {
  let words = ["CODE", "TYPE", "FONT", "SPACE", "PLAY"];
  let newW = random(words);
  if (newW === targetWord) {
    let others = words.filter(w => w !== targetWord);
    if (others.length > 0) newW = random(others);
  }
  targetWord = newW;
  collectedWord = "";
  enemies = [];
  // scegliamo UN solo font per tutta la parola (coerenza grafica)
  wordFont = random([mainFont, ...altFonts]);
  for (let i = 0; i < targetWord.length; i++) {
    let x = map(i, 0, targetWord.length - 1, 200, width - 200);
    let y = 150 + random(-8, 8);
    // assegna velocità orizzontale (più variazione, più sfida)
    let spd = random(0.9, 1.8) * (random() > 0.5 ? 1 : -1);
    enemies.push(new Enemy(x, y, targetWord[i], wordFont, i, spd));
  }
  // numero di fallingItems resettati a 4
  fallingItems = [];
  for (let i = 0; i < 4; i++) fallingItems.push(new FallingItem());

  // glitch più frequente all'inizio della parola
  glitchIndex = floor(random(0, targetWord.length));
  glitchTimer = floor(random(40, 100));
}

function checkLetterHit(letter) {
  if (letter === targetWord[collectedWord.length]) {
    collectedWord += letter;
    // suono lettera ora attivato
    playLetterSound(letter);
    if (collectedWord === targetWord) {
      victory = true;
      try {
        if (bgMusic && typeof bgMusic.isPlaying === 'function' && bgMusic.isPlaying()) {
          bgMusic.setVolume(0, 0.35);
          setTimeout(() => {
            try {
              if (bgMusic && typeof bgMusic.isPlaying === 'function' && bgMusic.isPlaying()) bgMusic.stop();
              if (bgMusic) bgMusic.setVolume(1);
            } catch (e) {}
          }, 400);
        }
      } catch (e) {
        try { if (bgMusic) bgMusic.stop(); } catch (e) {}
      }
      playWinSound();
    }
  }
}

function draw() {
  if (!gameStarted) {
    drawStartMenu();
    return;
  }
  if (gameOver) {
    drawGameOverScreen();
    return;
  }
  if (victory) {
    drawVictoryScreen();
    return;
  }

  drawGameBackground();
  drawTargetWord();
  drawLives();

  player.show();
  player.move();

  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].show();
    bullets[i].update();
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (bullets[i] && bullets[i].hits(enemies[j])) {
        let expected = targetWord[collectedWord.length];
        if (enemies[j].symbol === expected) {
          checkLetterHit(enemies[j].symbol);
          explosions.push(new Explosion(enemies[j].x, enemies[j].y, enemies[j].symbol));
          enemies.splice(j, 1);
          score++;
        } else {
          loseLife(enemies[j].symbol);
        }
        bullets.splice(i, 1);
        break;
      }
    }
    if (bullets[i] && bullets[i].offscreen()) bullets.splice(i, 1);
  }

  for (let e of enemies) {
    e.show();
    // nemici si muovono con la propria velocità orizzontale
    e.x += e.speedX;
    if (e.x < 40 || e.x > width - 40) {
      e.speedX *= -1;
      e.y += 25; // scendono più rapidamente quando toccano bordo
    }
  }

  // nemici sparano più spesso: ogni 90 frame se ce ne sono
  if (frameCount % 90 === 0 && enemies.length > 0) {
    let shooter = random(enemies);
    enemyBullets.push(new EnemyBullet(shooter.x, shooter.y + 12));
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    enemyBullets[i].show();
    enemyBullets[i].update();
    if (enemyBullets[i].hits(player)) {
      loseLife(player.symbol);
      enemyBullets.splice(i, 1);
    } else if (enemyBullets[i].offscreen()) {
      enemyBullets.splice(i, 1);
    }
  }

  for (let i = fallingItems.length - 1; i >= 0; i--) {
    let it = fallingItems[i];
    it.update();
    it.show();
    if (it.hitsPlayer()) {
      loseLife(it.ch);
      explosions.push(new Explosion(it.x, it.y, it.ch));
      it.reset();
    }
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].update();
    sparks[i].show();
    if (sparks[i].finished()) sparks.splice(i, 1);
  }

  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update();
    explosions[i].show();
    if (explosions[i].finished()) explosions.splice(i, 1);
  }

  // glitch più frequente durante il gioco
  if (glitchTimer > 0) {
    glitchTimer--;
  } else {
    if (targetWord.length > 0) glitchIndex = floor(random(0, targetWord.length));
    glitchTimer = floor(random(60, 120));
  }
}

function drawGameBackground() {
  background(18);
  let c1 = color(0, 140, 240, 40);
  let c2 = color(220, 30, 60, 30);
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    stroke(lerpColor(c1, c2, inter));
    line(0, i, width, i);
  }
}

function drawTargetWord() {
  // parola grande e centrata con evidenziazione delle lettere raccolte
  textAlign(CENTER, CENTER);

  // dimensioni ridotte per UI meno ingombrante
  let baseSize = 50;
  textFont(wordFont || mainFont);
  textSize(baseSize);

  // disegno ogni lettera singolarmente
  let startX = width / 2 - (targetWord.length - 1) * (baseSize * 0.5);
  for (let i = 0; i < targetWord.length; i++) {
    let ch = targetWord[i];
    let x = startX + i * (baseSize * 0.9);
    // spostata la parola più in alto (più leggera)
    let y = 40;
    push();
    textAlign(CENTER, CENTER);
    if (i < collectedWord.length) {
      // lettera già raccolta
      fill(0, 200, 255);
      textSize(baseSize + 6);
      drawingContext.shadowBlur = 24;
      drawingContext.shadowColor = color(0, 200, 255);
      text(ch, x, y);
    } else {
      // lettera ancora da prendere
      textSize(baseSize);
      drawingContext.shadowBlur = 6;
      drawingContext.shadowColor = color(80, 80, 80);
      fill(220);
      if (i === glitchIndex) {
        // piccolo glitch visivo
        textFont(random([mainFont, ...altFonts]));
        let xo = sin(frameCount * 0.15 + i) * random(-8,8);
        translate(xo, 0);
        fill(255, random(120,255), random(100,255));
        text(ch, x, y);
      } else {
        textFont(wordFont || mainFont);
        fill(220);
        text(ch, x, y);
      }
    }
    drawingContext.shadowBlur = 0;
    pop();
  }

  // sotto la parola: raccolto (ridotto e rialzato)
  textFont(mainFont);
  textSize(20);
  fill(200);
  text("Raccolto: " + (collectedWord || "-"), width/2, 75);
}

function drawLives() {
  // Mostra numero di vite e punteggio in modo discreto
  textAlign(LEFT, TOP);
  textSize(18);
  textFont(mainFont);
  fill(255, 200, 0);
  text("Vite: " + lives, 12, 12);

  // punteggio piccolo in alto a destra
  textAlign(RIGHT, TOP);
  textSize(18);
  fill(200);
  text("Score: " + score, width - 12, 12);
}

function drawStartMenu() {
  background(10);
  for (let x = 0; x < width; x += 40) {
    for (let y = 0; y < height; y += 40) {
      let ch = random(["A","B","C","D","E"]);
      fill(50 + 80 * sin(frameCount * 0.02 + x * 0.08));
      textSize(14);
      textAlign(CENTER, CENTER);
      text(ch, x + 20, y + 20);
    }
  }

  // Titolo molto evidente
  let title = "TYPO FIGHTERS";
  textSize(80); // più grande
  textAlign(CENTER, CENTER);
  if (frameCount % 30 === 0) {
    currentFonts = [];
    for (let i = 0; i < title.length; i++) {
      currentFonts.push(random([mainFont, ...altFonts]));
    }
  }
  for (let i = 0; i < title.length; i++) {
    let char = title[i];
    let x = width/2 - (title.length*22) + i*50;
    let y = height/2 - 140 + 8 * sin(frameCount * 0.1 + i);
    let col = color(255, 230, 60, 200 + 40 * sin(frameCount * 0.05 + i));
    fill(col);
    drawingContext.shadowBlur = 18;
    drawingContext.shadowColor = col;
    textFont(currentFonts[i] || mainFont);
    text(char, x, y);
    drawingContext.shadowBlur = 0;
  }

  // GIOCA (pulsante principale)
  let btnText = "GIOCA";
  textSize(24);
  let tw = textWidth(btnText);
  fill(0, 200, 0);
  rect(width/2 - tw/2 - 25, height/2 + 40, tw + 50, 52, 10);
  fill(255);
  text(btnText, width/2, height/2 + 66);

  // RELAZIONE (secondario, meno invadente)
  let relText = "RELAZIONE";
  textSize(16);
  let twr = textWidth(relText);
  noFill();
  stroke(0, 110, 200);
  strokeWeight(2);
  rect(width/2 - twr/2 - 20, height/2 + 110, twr + 40, 38, 10);
  noStroke();
  fill(200);
  text(relText, width/2, height/2 + 129);
}

function drawVictoryScreen() {
  background(16);
  if (random(1) < 0.12) fireworks.push(new Firework(random(width), random(height/2)));
  for (let i = fireworks.length-1; i>=0; i--) {
    fireworks[i].update();
    fireworks[i].show();
    if (fireworks[i].finished()) fireworks.splice(i,1);
  }

  // Titolo enorme
  let title = "HAI VINTO!";
  if (frameCount % 30 === 0 || victoryFonts.length === 0) {
    victoryFonts = [];
    for (let i = 0; i < title.length; i++) {
      victoryFonts.push(random([mainFont, ...altFonts]));
    }
  }
  for (let i = 0; i < title.length; i++) {
    let char = title[i];
    let x = width/2 - (title.length*20) + i*40;
    let y = height/2 - 150 + 10*sin(frameCount*0.1 + i);
    let col = color(0, 150, 255, 220 + 30*sin(frameCount*0.05 + i));
    fill(col);
    drawingContext.shadowBlur = 26;
    drawingContext.shadowColor = col;
    textFont(victoryFonts[i] || mainFont);
    textSize(90); // più grande
    text(char, x, y);
    drawingContext.shadowBlur = 0;
  }

  // Pulsante meno invadente
  let btnText = "TORNA AL MENU";
  textSize(13);
  let tw = textWidth(btnText);
  fill(0,150,0);
  rect(width/2 - tw/2 - 15, height/2, tw + 30, 40, 8);
  fill(255);
  text(btnText, width/2, height/2 + 20);
}

function drawGameOverScreen() {
  background(0);
  for (let f of fallingLetters) {
    f.update();
    f.show();
  }

  let title = "GAME OVER";
  if (frameCount % 30 === 0 || gameOverFonts.length === 0) {
    gameOverFonts = [];
    for (let i = 0; i < title.length; i++) {
      gameOverFonts.push(random([mainFont, ...altFonts]));
    }
  }
  for (let i = 0; i < title.length; i++) {
    let char = title[i];
    let x = width/2 - (title.length*20) + i*54;
    let y = height/2 - 150 + 10*sin(frameCount*0.1 + i);
    let col = color(255, 0, 0, 200 + 40*sin(frameCount*0.05 + i));
    fill(col);
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = col;
    textFont(gameOverFonts[i] || mainFont);
    textSize(95); // più grande
    text(char, x, y);
    drawingContext.shadowBlur = 0;
  }

  let btnText = "RIPROVA";
  textSize(13);
  let tw = textWidth(btnText);
  fill(0,180,0);
  rect(width/2 - tw/2 - 15, height/2, tw + 30, 40, 8);
  fill(255);
  text(btnText, width/2, height/2 + 20);
}

function keyPressed() {
  if (key === ' ' && !gameOver && gameStarted && !victory) {
    bullets.push(new Bullet(player.x, height-60));
    for (let i = 0; i < 6; i++) sparks.push(new Spark(player.x, height-60, color(0,150,255), "."));
  }
  if (keyCode === ENTER && !gameStarted && !gameOver) {
    gameStarted = true;
    if (bgMusic) {
      try {
        if (typeof bgMusic.isPlaying === 'function') {
          if (!bgMusic.isPlaying()) {
            bgMusic.setVolume(0.6);
            bgMusic.loop();
          }
        } else {
          bgMusic.loop();
        }
      } catch (e) {
        try {
          if (bgMusic && typeof bgMusic.isPlaying === 'function' && !bgMusic.isPlaying()) bgMusic.loop();
        } catch (e) {}
      }
    }
  }
}

function mousePressed() {
  if (!gameStarted) {
    // GIOCA button
    let btnText = "GIOCA";
    textSize(24);
    let tw = textWidth(btnText);
    if (mouseX > width/2 - tw/2 - 25 && mouseX < width/2 + tw/2 + 25 &&
        mouseY > height/2 + 40 && mouseY < height/2 + 92) {
      gameStarted = true;
      if (bgMusic) {
        try {
          if (typeof bgMusic.isPlaying === 'function') {
            if (!bgMusic.isPlaying()) {
              bgMusic.setVolume(0.1);
              bgMusic.loop();
            }
          } else {
            bgMusic.loop();
          }
        } catch (e) {
          try {
            if (bgMusic && typeof bgMusic.isPlaying === 'function' && !bgMusic.isPlaying()) bgMusic.loop();
          } catch (e) {}
        }
      }
      return;
    }

    // RELAZIONE button -> apre info.html con markdown
    let relText = "RELAZIONE";
    textSize(8);
    let twr = textWidth(relText);
    if (mouseX > width/2 - twr/2 - 20 && mouseX < width/2 + twr/2 + 20 &&
        mouseY > height/2 + 110 && mouseY < height/2 + 148) {
      // apri il file 'info.html' che mostra la relazione (usa markdown-it)
      window.open("info.html", "_blank");
      return;
    }
  } else if (gameOver) {
    let btnText = "RIPROVA";
    textSize(22);
    let tw = textWidth(btnText);
    if (mouseX > width/2 - tw/2 - 15 && mouseX < width/2 + tw/2 + 15 &&
        mouseY > height/2 && mouseY < height/2 + 40) {
      resetGame();
    }
  } else if (victory) {
    let btnText = "TORNA AL MENU";
    textSize(16);
    let tw = textWidth(btnText);
    if (mouseX > width/2 - tw/2 - 15 && mouseX < width/2 + tw/2 + 15 &&
        mouseY > height/2 && mouseY < height/2 + 40) {
      resetGame();
    }
  }
}

function resetGame() {
  enemies = [];
  bullets = [];
  enemyBullets = [];
  sparks = [];
  explosions = [];
  fireworks = [];
  fallingLetters = [];
  fallingItems = [];
  collectedWord = "";
  lives = 3;
  score = 0;
  gameStarted = false;
  gameOver = false;
  victory = false;
  setNewWord();
  // ripopola con 80 lettere e 4 item
  for (let i = 0; i < 80; i++) fallingLetters.push(new FallingLetter());
  for (let i = 0; i < 4; i++) fallingItems.push(new FallingItem());
  updatePlayerSymbol();
  try {
    if (bgMusic && typeof bgMusic.isPlaying === 'function' && bgMusic.isPlaying()) {
      bgMusic.stop();
      bgMusic.setVolume(1);
    }
  } catch (e) {}
}
