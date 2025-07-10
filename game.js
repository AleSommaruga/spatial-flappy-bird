class FlappyBird {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Game state
    this.gameState = "start"; // 'start', 'playing', 'gameOver'
    this.score = 0;
    this.highScore = localStorage.getItem("flappyBirdHighScore") || 0;

    // Bird properties
    this.bird = {
      x: 80,
      y: this.height / 2,
      width: 30,
      height: 30,
      velocity: 0,
      gravity: 0.5,
      jumpPower: -8,
      rotation: 0,
    };

    // Pipes
    this.pipes = [];
    this.pipeWidth = 60;
    this.pipeGap = 150;
    this.pipeSpacing = 200;
    this.pipeSpeed = 2;

    // Background
    this.clouds = [];
    this.generateClouds();

    // UI elements
    this.startScreen = document.getElementById("startScreen");
    this.gameOverScreen = document.getElementById("gameOverScreen");
    this.scoreElement = document.getElementById("score");
    this.highScoreElement = document.getElementById("highScore");
    this.finalScoreElement = document.getElementById("finalScore");
    this.restartBtn = document.getElementById("restartBtn");

    this.setupEventListeners();
    this.updateHighScore();
    this.gameLoop();
  }

  setupEventListeners() {
    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        this.handleInput();
      }
    });

    // Mouse/touch controls
    this.canvas.addEventListener("click", () => this.handleInput());
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.handleInput();
    });

    // Restart button
    this.restartBtn.addEventListener("click", () => this.restart());
  }

  handleInput() {
    switch (this.gameState) {
      case "start":
        this.startGame();
        break;
      case "playing":
        this.jump();
        break;
      case "gameOver":
        this.restart();
        break;
    }
  }

  startGame() {
    this.gameState = "playing";
    this.startScreen.classList.add("hidden");
    this.score = 0;
    this.updateScore();
    this.resetBird();
    this.pipes = [];
    this.generatePipes();
  }

  restart() {
    this.gameState = "start";
    this.gameOverScreen.classList.add("hidden");
    this.startScreen.classList.remove("hidden");
    this.resetBird();
    this.pipes = [];
    this.generateClouds();
  }

  resetBird() {
    this.bird.y = this.height / 2;
    this.bird.velocity = 0;
    this.bird.rotation = 0;
  }

  jump() {
    this.bird.velocity = this.bird.jumpPower;
    this.bird.rotation = -20;
  }

  updateBird() {
    // Apply gravity
    this.bird.velocity += this.bird.gravity;
    this.bird.y += this.bird.velocity;

    // Rotate bird based on velocity
    this.bird.rotation += this.bird.velocity > 0 ? 3 : -2;
    this.bird.rotation = Math.max(-20, Math.min(90, this.bird.rotation));

    // Check boundaries
    if (this.bird.y < 0) {
      this.bird.y = 0;
      this.bird.velocity = 0;
    }

    if (this.bird.y + this.bird.height > this.height) {
      this.gameOver();
    }
  }

  generatePipes() {
    const gapY = Math.random() * (this.height - this.pipeGap - 100) + 50;

    this.pipes.push({
      x: this.width,
      gapY: gapY,
      passed: false,
    });
  }

  updatePipes() {
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.x -= this.pipeSpeed;

      // Check if bird passed the pipe
      if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
        pipe.passed = true;
        this.score++;
        this.updateScore();
      }

      // Remove pipes that are off screen
      if (pipe.x + this.pipeWidth < 0) {
        this.pipes.splice(i, 1);
      }
    }

    // Generate new pipes
    if (
      this.pipes.length === 0 ||
      this.pipes[this.pipes.length - 1].x < this.width - this.pipeSpacing
    ) {
      this.generatePipes();
    }
  }

  checkCollisions() {
    for (const pipe of this.pipes) {
      // Top pipe
      if (
        this.bird.x < pipe.x + this.pipeWidth &&
        this.bird.x + this.bird.width > pipe.x &&
        this.bird.y < pipe.gapY
      ) {
        this.gameOver();
        return;
      }

      // Bottom pipe
      if (
        this.bird.x < pipe.x + this.pipeWidth &&
        this.bird.x + this.bird.width > pipe.x &&
        this.bird.y + this.bird.height > pipe.gapY + this.pipeGap
      ) {
        this.gameOver();
        return;
      }
    }
  }

  gameOver() {
    this.gameState = "gameOver";
    this.gameOverScreen.classList.remove("hidden");
    this.finalScoreElement.textContent = this.score;

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("flappyBirdHighScore", this.highScore);
      this.updateHighScore();
    }
  }

  updateScore() {
    this.scoreElement.textContent = this.score;
  }

  updateHighScore() {
    this.highScoreElement.textContent = this.highScore;
  }

  generateClouds() {
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height / 2),
        size: Math.random() * 30 + 20,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  }

  updateClouds() {
    for (const cloud of this.clouds) {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.size < 0) {
        cloud.x = this.width + cloud.size;
        cloud.y = Math.random() * (this.height / 2);
      }
    }
  }

  drawBird() {
    this.ctx.save();
    this.ctx.translate(
      this.bird.x + this.bird.width / 2,
      this.bird.y + this.bird.height / 2
    );
    this.ctx.rotate((this.bird.rotation * Math.PI) / 180);

    // Bird body
    this.ctx.fillStyle = "#FFD700";
    this.ctx.fillRect(
      -this.bird.width / 2,
      -this.bird.height / 2,
      this.bird.width,
      this.bird.height
    );

    // Bird eye
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(
      -this.bird.width / 2 + 5,
      -this.bird.height / 2 + 5,
      8,
      8
    );

    // Bird wing
    this.ctx.fillStyle = "#FFA500";
    this.ctx.fillRect(
      -this.bird.width / 2 + 2,
      -this.bird.height / 2 + 10,
      15,
      8
    );

    // Bird beak
    this.ctx.fillStyle = "#FF4500";
    this.ctx.fillRect(this.bird.width / 2 - 5, -3, 8, 6);

    this.ctx.restore();
  }

  drawPipes() {
    this.ctx.fillStyle = "#228B22";

    for (const pipe of this.pipes) {
      // Top pipe
      this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.gapY);

      // Bottom pipe
      this.ctx.fillRect(
        pipe.x,
        pipe.gapY + this.pipeGap,
        this.pipeWidth,
        this.height - pipe.gapY - this.pipeGap
      );

      // Pipe caps
      this.ctx.fillStyle = "#006400";
      this.ctx.fillRect(pipe.x - 5, pipe.gapY - 20, this.pipeWidth + 10, 20);
      this.ctx.fillRect(
        pipe.x - 5,
        pipe.gapY + this.pipeGap,
        this.pipeWidth + 10,
        20
      );
      this.ctx.fillStyle = "#228B22";
    }
  }

  drawClouds() {
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

    for (const cloud of this.clouds) {
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawBackground() {
    // Sky gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#98FB98");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw background
    this.drawBackground();

    // Draw clouds
    this.drawClouds();

    // Draw pipes
    this.drawPipes();

    // Draw bird
    this.drawBird();
  }

  update() {
    if (this.gameState === "playing") {
      this.updateBird();
      this.updatePipes();
      this.updateClouds();
      this.checkCollisions();
    }
  }

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Start the game when the page loads
window.addEventListener("load", () => {
  new FlappyBird();
});
