/* Các thiết lập cơ bản */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = 800;
const HEIGHT = 600;
const FPS = 60;

// Màu sắc
const WHITE = "#FFFFFF";
const BLACK = "#000000";
const RED = "#FF0000";
const GREEN = "#00FF00";
const BLUE = "#0000FF"; // Dùng cho đạn của enemy

// Biến trạng thái game
let gameOver = false;
let score = 0;

// Quản lý trạng thái phím
const keys = {};
window.addEventListener("keydown", function(e) {
  // Nếu game đã kết thúc, chỉ cho phép phím R (restart) hoặc Q (thoát)
  if (gameOver) {
    if (e.code === "KeyR") {
      restartGame();
    } else if (e.code === "KeyQ") {
      quitGame();
    }
    return;
  }
  keys[e.code] = true;
  // Bấm Space để bắn đạn khi game đang chạy
  if (e.code === "Space") {
    let bullet = new Bullet(player.x + player.width / 2, player.y);
    bullets.push(bullet);
  }
});
window.addEventListener("keyup", e => keys[e.code] = false);

/* --- Thêm hỗ trợ cảm ứng (mobile) --- */
canvas.addEventListener("touchstart", function(e) {
  e.preventDefault();
  let touch = e.touches[0];
  let rect = canvas.getBoundingClientRect();
  let touchX = touch.clientX - rect.left;
  let touchY = touch.clientY - rect.top;
  // Cập nhật vị trí player dựa vào vị trí chạm
  player.x = touchX - player.width / 2;
  player.y = touchY - player.height / 2;
  // Khi chạm, bắn đạn
  let bullet = new Bullet(player.x + player.width / 2, player.y);
  bullets.push(bullet);
});
canvas.addEventListener("touchmove", function(e) {
  e.preventDefault();
  let touch = e.touches[0];
  let rect = canvas.getBoundingClientRect();
  let touchX = touch.clientX - rect.left;
  let touchY = touch.clientY - rect.top;
  // Di chuyển player theo vị trí chạm
  player.x = touchX - player.width / 2;
  player.y = touchY - player.height / 2;
});

/* --- Các hàm tiện ích --- */
// Vẽ chữ
function drawText(text, x, y, size = 20, color = WHITE) {
  ctx.fillStyle = color;
  ctx.font = size + "px Arial";
  ctx.fillText(text, x, y);
}

// Sinh số ngẫu nhiên
function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Sinh màu ngẫu nhiên (không trùng với màu nền hoặc màu player)
function generateRandomColor() {
  let color;
  do {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    color = `#${((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .toUpperCase()}`;
  } while (color === WHITE || color === BLACK);
  return color;
}

// Kiểm tra va chạm giữa 2 hình chữ nhật
function rectanglesIntersect(r1, r2) {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}

/* --- Định nghĩa các lớp game --- */
// Lớp Player
class Player {
  constructor() {
    this.width = 40;
    this.height = 30;
    this.x = WIDTH / 2 - this.width / 2;
    this.y = HEIGHT - this.height - 10;
    this.speed = 5;
  }
  update() {
    if (keys["ArrowLeft"]) this.x -= this.speed;
    if (keys["ArrowRight"]) this.x += this.speed;
    if (keys["ArrowUp"]) this.y -= this.speed;
    if (keys["ArrowDown"]) this.y += this.speed;
    // Giới hạn trong canvas
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > WIDTH) this.x = WIDTH - this.width;
    if (this.y < 0) this.y = 0;
    if (this.y + this.height > HEIGHT) this.y = HEIGHT - this.height;
  }
  draw() {
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    // Vẽ tam giác (đỉnh hướng lên)
    ctx.moveTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.closePath();
    ctx.fill();
  }
}

// Lớp Bullet của player
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.speed = 20; // tốc độ đạn của player (đã tăng gấp đôi)
  }
  update() {
    this.y -= this.speed;
  }
  draw() {
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  isOffScreen() {
    return this.y < 0;
  }
}

// Lớp Enemy (máy bay địch)
class Enemy {
  constructor() {
    this.width = 40;
    this.height = 30;
    // Các thuộc tính này sẽ được thiết lập bởi spawnEnemy()
    this.x = 0;
    this.y = 0;
    // Tốc độ enemy nhân với 1.5 để bay nhanh hơn 1.5 lần
    this.speedY = randomRange(1, 3) * 1.5;
    this.speedX = randomRange(-2, 2) * 1.5;
    this.color = generateRandomColor();
    // Tần số bắn: 800ms
    this.shootDelay = 800;
    this.lastShot = Date.now();
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    // Nếu vượt ra khỏi dưới màn hình, respawn lại theo spawnEnemy() để đảm bảo phân bố đều
    if (this.y > HEIGHT) {
      let newEnemy = spawnEnemy();
      this.x = newEnemy.x;
      this.y = newEnemy.y;
      this.speedX = newEnemy.speedX;
      this.speedY = newEnemy.speedY;
      this.color = newEnemy.color;
      this.lastShot = Date.now();
    }
    // Bắn đạn nếu đủ thời gian (mỗi 800ms)
    if (Date.now() - this.lastShot > this.shootDelay) {
      this.lastShot = Date.now();
      enemyBullets.push(new EnemyBullet(this.x + this.width / 2, this.y + this.height));
    }
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    // Vẽ tam giác cho enemy (đỉnh hướng xuống)
    ctx.moveTo(this.x + this.width / 2, this.y + this.height);
    ctx.lineTo(this.x, this.y);
    ctx.lineTo(this.x + this.width, this.y);
    ctx.closePath();
    ctx.fill();
  }
  // Kiểm tra va chạm giữa enemy và đạn của player
  collidesWith(bullet) {
    let distX = Math.abs(bullet.x - (this.x + this.width / 2));
    let distY = Math.abs(bullet.y - (this.y + this.height / 2));
    if (distX > (this.width / 2 + bullet.radius)) return false;
    if (distY > (this.height / 2 + bullet.radius)) return false;
    return true;
  }
}

// Lớp EnemyBullet (đạn của enemy)
class EnemyBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 4;
    this.speed = 5;
  }
  update() {
    this.y += this.speed;
  }
  draw() {
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  isOffScreen() {
    return this.y > HEIGHT;
  }
}

/* --- Hàm spawnEnemy(): đảm bảo spawn đều theo 3 vùng --- */
function spawnEnemy() {
  let enemy = new Enemy();
  // Đếm số enemy hiện có ở 3 vùng: bên trái, giữa và bên phải
  let leftCount = 0, centerCount = 0, rightCount = 0;
  enemies.forEach(e => {
    if (e.x < WIDTH / 3) {
      leftCount++;
    } else if (e.x < (2 * WIDTH) / 3) {
      centerCount++;
    } else {
      rightCount++;
    }
  });
  // Xác định vùng có số lượng enemy ít nhất
  let minCount = Math.min(leftCount, centerCount, rightCount);
  let zones = [];
  if (leftCount === minCount) zones.push("left");
  if (centerCount === minCount) zones.push("center");
  if (rightCount === minCount) zones.push("right");
  let zone = zones[Math.floor(Math.random() * zones.length)];
  
  // Gán vị trí x dựa theo vùng đã chọn
  if (zone === "left") {
    enemy.x = randomRange(0, WIDTH / 3 - enemy.width);
  } else if (zone === "center") {
    enemy.x = randomRange(WIDTH / 3, (2 * WIDTH) / 3 - enemy.width);
  } else {
    enemy.x = randomRange((2 * WIDTH) / 3, WIDTH - enemy.width);
  }
  // Vị trí y khởi tạo nằm ngoài màn hình (trong khoảng [-150, -50])
  enemy.y = randomRange(-150, -50);
  enemy.lastShot = Date.now();
  enemy.shootDelay = 800;
  return enemy;
}

/* --- Khởi tạo các đối tượng game --- */
let player = new Player();
let bullets = [];
let enemies = [];
let enemyBullets = [];

// Spawn ban đầu 5 enemy với phân bố đều
for (let i = 0; i < 5; i++) {
  enemies.push(spawnEnemy());
}

/* --- Vòng lặp game --- */
function update() {
  if (gameOver) return;
  player.update();
  
  // Cập nhật đạn của player
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    if (bullets[i].isOffScreen()) {
      bullets.splice(i, 1);
    }
  }
  
  // Cập nhật enemy
  enemies.forEach(enemy => enemy.update());
  
  // Cập nhật đạn của enemy
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    enemyBullets[i].update();
    if (enemyBullets[i].isOffScreen()) {
      enemyBullets.splice(i, 1);
    }
  }
  
  // Kiểm tra va chạm giữa đạn của player và enemy
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (enemy.collidesWith(bullet)) {
        enemies.splice(eIndex, 1);
        bullets.splice(bIndex, 1);
        score += 1;
        // Spawn enemy mới để đảm bảo luôn có 5 enemy
        enemies.push(spawnEnemy());
      }
    });
  });
  
  // Kiểm tra va chạm giữa player và enemy
  enemies.forEach(enemy => {
    if (rectanglesIntersect(player, enemy)) {
      gameOver = true;
    }
  });
  
  // Kiểm tra va chạm giữa đạn của enemy và player
  enemyBullets.forEach(bullet => {
    if (
      bullet.x > player.x && bullet.x < player.x + player.width &&
      bullet.y > player.y && bullet.y < player.y + player.height
    ) {
      gameOver = true;
    }
  });
  
  // Luôn đảm bảo có ít nhất 5 enemy trên màn hình
  while (enemies.length < 5) {
    enemies.push(spawnEnemy());
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  player.draw();
  bullets.forEach(bullet => bullet.draw());
  enemies.forEach(enemy => enemy.draw());
  enemyBullets.forEach(bullet => bullet.draw());
  drawText("Score: " + score, 10, 30);
  
  // Nếu game kết thúc, hiển thị màn hình GAME OVER
  if (gameOver) {
    drawGameOverScreen();
  }
}

function gameLoop() {
  update();
  draw();
  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  }
}

/* --- Hàm hiển thị màn hình GAME OVER --- */
function drawGameOverScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = WHITE;
  ctx.font = "48px Arial";
  ctx.fillText("GAME OVER", WIDTH / 2 - 130, HEIGHT / 2 - 20);
  ctx.font = "24px Arial";
  ctx.fillText("Nhấn R để chơi lại hoặc Q để thoát", WIDTH / 2 - 200, HEIGHT / 2 + 20);
}

function quitGame() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = WHITE;
  ctx.font = "48px Arial";
  ctx.fillText("Cảm ơn đã chơi!", WIDTH / 2 - 160, HEIGHT / 2);
}

function restartGame() {
  // Reset các biến game
  score = 0;
  gameOver = false;
  player = new Player();
  bullets = [];
  enemies = [];
  enemyBullets = [];
  for (let i = 0; i < 5; i++) {
    enemies.push(spawnEnemy());
  }
  gameLoop();
}

/* --- Khởi động game --- */
gameLoop();
