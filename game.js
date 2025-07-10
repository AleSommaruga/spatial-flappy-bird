class FlappyBird {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Mobile detection and speed settings
    this.isMobile = this.detectMobile();
    this.mobileSpeedMultiplier = 0.6; // Reduce speed by 40% on mobile

    if (this.isMobile) {
      console.log(
        "📱 Mobile mode detected - Game speed reduced for better mobile experience"
      );
    }

    // Game state
    this.gameState = "start"; // 'start', 'playing', 'gameOver'
    this.score = 0;
    this.highScore = localStorage.getItem("flappyBirdHighScore") || 0;

    // Game mode settings
    this.selectedGameMode = "normal"; // Always start in normal mode
    this.isVerticalMode = false;
    this.originalCanvasWidth = this.width;
    this.originalCanvasHeight = this.height;
    this.transitionPause = false;
    this.transitionTimer = null;

    // Debug mode - set to true to start in space mode
    // Change this line to: this.debugSpaceMode = true; to test space mode only
    this.debugSpaceMode = false;

    // Random mode switching
    this.nextModeSwitch = this.getRandomModeSwitch();
    this.lastModeSwitch = 0;

    // Bird properties
    this.bird = {
      x: 80,
      y: this.height / 2,
      width: 30,
      height: 30,
      velocity: 0,
      gravity: this.isMobile ? 0.4 : 0.5, // Reduced gravity on mobile
      jumpPower: this.isMobile ? -7 : -8, // Reduced jump power on mobile
      rotation: 0,
      velocityX: 0, // Added for horizontal movement
    };

    // Pipes
    this.pipes = [];
    this.pipeWidth = 60;
    this.pipeGap = 150;
    this.pipeSpacing = 200;
    this.pipeSpeed = this.isMobile ? 2 * this.mobileSpeedMultiplier : 2; // Reduced speed on mobile

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
    this.verticalModeElement = document.getElementById("verticalMode");

    this.setupEventListeners();
    this.updateHighScore();
    this.updateMobileInstructions();
    this.adjustCanvasForMobile();
    this.gameLoop();
  }

  // Mobile detection method
  detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      (window.innerWidth <= 768 && window.innerHeight <= 1024)
    );
  }

  // Update mobile instructions visibility
  updateMobileInstructions() {
    const mobileInstructions = document.querySelector(".mobile-instructions");
    if (mobileInstructions) {
      if (this.isMobile) {
        mobileInstructions.style.display = "block";
      } else {
        mobileInstructions.style.display = "none";
      }
    }
  }

  // Adjust canvas size for mobile
  adjustCanvasForMobile() {
    if (this.isMobile) {
      // Reduce canvas size on mobile for better performance
      const maxWidth = Math.min(window.innerWidth - 40, 350);
      const maxHeight = Math.min(window.innerHeight * 0.6, 500);

      this.canvas.style.width = maxWidth + "px";
      this.canvas.style.height = maxHeight + "px";
    }
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
    // Ignora input durante la transizione
    if (this.transitionPause) return;

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

    // Debug mode: start in space mode if enabled
    if (this.debugSpaceMode) {
      this.isVerticalMode = true;
      this.selectedGameMode = "space";
      this.canvas.classList.add("space-mode");
      document.querySelector(".game-container").classList.add("space-mode");
    } else {
      this.isVerticalMode = false;
      this.selectedGameMode = "normal";
    }

    // Reset mode switching for new game
    this.nextModeSwitch = this.getRandomModeSwitch();
    this.lastModeSwitch = 0;

    this.updateScore();
    this.updateVerticalModeStatus();
    this.resetBird();
    this.pipes = [];
    this.generatePipes();
    this.resetCanvas();
  }

  restart() {
    this.gameState = "start";
    this.gameOverScreen.classList.add("hidden");
    this.startScreen.classList.remove("hidden");
    this.isVerticalMode = false;
    this.selectedGameMode = "normal";
    this.updateVerticalModeStatus();
    this.resetBird();
    this.pipes = [];
    this.generateClouds();
    this.resetCanvas();

    // Reset mode switching for restart
    this.nextModeSwitch = this.getRandomModeSwitch();
    this.lastModeSwitch = 0;
  }

  resetBird() {
    if (this.isVerticalMode) {
      this.bird.x = this.width / 2 - this.bird.width / 2;
      this.bird.y = this.height - this.bird.height - 10; // Posizione in basso
      this.bird.velocity = 0;
      this.bird.velocityX = 0; // Reset horizontal velocity
      this.bird.rotation = 0;
    } else {
      this.bird.x = 80;
      this.bird.y = this.height / 2;
      this.bird.velocity = 0;
      this.bird.rotation = 0;
    }
  }

  jump() {
    if (this.isVerticalMode) {
      // In modalità spaziale, il salto muove la navicella a destra
      this.bird.velocityX = this.isMobile ? 6 : 8; // Reduced horizontal speed on mobile
    } else {
      // Modalità normale
      this.bird.velocity = this.bird.jumpPower;
      this.bird.rotation = -20;
    }
  }

  updateBird() {
    if (this.transitionPause) return;

    if (this.isVerticalMode) {
      // Modalità spaziale: movimento orizzontale come nella modalità normale ma ruotato
      this.bird.velocityX -= this.isMobile ? 0.4 : 0.5; // Reduced horizontal gravity on mobile
      this.bird.x += this.bird.velocityX;
      this.bird.rotation = this.bird.velocityX > 0 ? -20 : 20; // Rotazione basata sulla velocità

      // Limiti orizzontali - Game over se tocca i bordi
      if (this.bird.x < 0) {
        this.gameOver();
        return;
      }
      if (this.bird.x + this.bird.width > this.width) {
        this.gameOver();
        return;
      }

      // L'astronave rimane sempre alla stessa altezza (centro dello schermo)
      this.bird.y = this.height / 2 - this.bird.height / 2;
    } else {
      // Modalità normale
      this.bird.velocity += this.bird.gravity;
      this.bird.y += this.bird.velocity;
      this.bird.rotation += this.bird.velocity > 0 ? 3 : -2;
      this.bird.rotation = Math.max(-20, Math.min(90, this.bird.rotation));

      if (this.bird.y < 0) {
        this.bird.y = 0;
        this.bird.velocity = 0;
      }
      if (this.bird.y + this.bird.height > this.height) {
        this.gameOver();
      }
    }
  }

  generatePipes() {
    if (this.isVerticalMode) {
      // Generate asteroids for space mode
      this.generateAsteroids();
    } else {
      // Generate pipes for normal mode
      const gapY = Math.random() * (this.height - this.pipeGap - 100) + 50;
      this.pipes.push({
        x: this.width,
        gapY: gapY,
        passed: false,
        type: "pipe",
      });
    }
  }

  generateAsteroids() {
    const x = Math.random() * (this.width - 100) + 50; // Centrato con margini
    const y = -50 - Math.random() * 50; // Spaziatura verticale
    const size = Math.random() * 15 + 20; // Asteroidi di media dimensione (20-35)

    // Controlla se ci sono asteroidi troppo vicini
    const minDistance = 200; // Distanza minima tra asteroidi
    for (const pipe of this.pipes) {
      if (pipe.type === "asteroid") {
        const distance = Math.sqrt((x - pipe.x) ** 2 + (y - pipe.y) ** 2);
        if (distance < minDistance) {
          return; // Non generare se troppo vicino
        }
      }
    }

    this.pipes.push({
      x: x,
      y: y,
      size: size,
      passed: false,
      type: "asteroid",
    });
  }

  updatePipes() {
    if (this.transitionPause) return;

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];

      // Controllo di sicurezza per evitare errori con pipe undefined
      if (!pipe || !pipe.type) {
        this.pipes.splice(i, 1);
        continue;
      }

      if (this.isVerticalMode && pipe.type === "asteroid") {
        // Asteroidi cadono dall'alto verso il basso
        pipe.y += this.pipeSpeed;
        if (
          !pipe.passed &&
          pipe.y + pipe.size > this.bird.y + this.bird.height &&
          this.gameState === "playing"
        ) {
          pipe.passed = true;
          this.score++;
          this.updateScore();
        }
        if (pipe.y > this.height + 50) {
          this.pipes.splice(i, 1);
        }
      } else if (!this.isVerticalMode && pipe.type === "pipe") {
        // Pipe normali
        pipe.x -= this.pipeSpeed;
        if (
          !pipe.passed &&
          pipe.x + this.pipeWidth < this.bird.x &&
          this.gameState === "playing"
        ) {
          pipe.passed = true;
          this.score++;
          this.updateScore();
        }
        if (pipe.x + this.pipeWidth < 0) {
          this.pipes.splice(i, 1);
        }
      }
    }

    // Genera nuovi ostacoli solo se l'array non è vuoto o se è il primo ostacolo
    if (this.isVerticalMode) {
      if (
        this.pipes.length === 0 ||
        (this.pipes.length > 0 &&
          this.pipes[this.pipes.length - 1] &&
          this.pipes[this.pipes.length - 1].y > -200)
      ) {
        // Spaziatura normale per gli asteroidi
        this.generateAsteroids();
      }
    } else {
      if (
        this.pipes.length === 0 ||
        (this.pipes.length > 0 &&
          this.pipes[this.pipes.length - 1] &&
          this.pipes[this.pipes.length - 1].x < this.width - this.pipeSpacing)
      ) {
        this.generatePipes();
      }
    }
  }

  checkCollisions() {
    for (const obstacle of this.pipes) {
      // Controllo di sicurezza per evitare errori con obstacle undefined
      if (!obstacle || !obstacle.type) {
        continue;
      }

      if (obstacle.type === "pipe") {
        // Check pipe collisions
        if (
          this.bird.x < obstacle.x + this.pipeWidth &&
          this.bird.x + this.bird.width > obstacle.x &&
          this.bird.y < obstacle.gapY
        ) {
          this.gameOver();
          return;
        }

        if (
          this.bird.x < obstacle.x + this.pipeWidth &&
          this.bird.x + this.bird.width > obstacle.x &&
          this.bird.y + this.bird.height > obstacle.gapY + this.pipeGap
        ) {
          this.gameOver();
          return;
        }
      } else if (obstacle.type === "asteroid") {
        // Check asteroid collisions
        const dx = this.bird.x + this.bird.width / 2 - obstacle.x;
        const dy = this.bird.y + this.bird.height / 2 - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < obstacle.size + this.bird.width / 2) {
          this.gameOver();
          return;
        }
      }
    }
  }

  gameOver() {
    // Non permettere game over durante la transizione
    if (this.transitionPause) {
      console.log("Game over prevented during transition");
      return;
    }

    this.gameState = "gameOver";
    this.transitionPause = false; // Assicurati che non sia in pausa di transizione

    // Usa il sistema di game over esistente
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

    // Check for random mode switch only if game is still playing, not in transition, and not in debug mode
    if (
      this.gameState === "playing" &&
      !this.transitionPause &&
      !this.debugSpaceMode &&
      this.score >= this.nextModeSwitch &&
      this.score > this.lastModeSwitch
    ) {
      this.randomModeSwitch();
    }
  }

  updateHighScore() {
    this.highScoreElement.textContent = this.highScore;
  }

  getRandomModeSwitch() {
    // Random switch between 10-17 points for normal mode, 13-24 points for space mode
    if (this.isVerticalMode) {
      return Math.floor(Math.random() * 12) + 13; // 13-24 points for space mode
    } else {
      return Math.floor(Math.random() * 8) + 10; // 10-17 points for normal mode
    }

    // DEBUG
    // if (this.isVerticalMode) {
    //   return Math.floor(Math.random() * 1) + 4; // 4 points for space mode DEBUG
    // } else {
    //   return Math.floor(Math.random() * 1) + 2; // 2 points for normal mode DEBUG
    // }
  }

  randomModeSwitch() {
    console.log("Starting random mode switch");
    this.lastModeSwitch = this.score;

    // Switch to opposite mode first
    this.selectedGameMode =
      this.selectedGameMode === "normal" ? "space" : "normal";
    this.isVerticalMode = this.selectedGameMode === "space";

    // Now get the next switch based on the new mode
    this.nextModeSwitch = this.score + this.getRandomModeSwitch();

    console.log(
      "Switching to mode:",
      this.selectedGameMode,
      "isVertical:",
      this.isVerticalMode
    );

    // Reset bird position for new mode
    this.resetBird();

    // Clear and regenerate obstacles for new mode
    this.pipes = [];
    this.generatePipes();

    // Use the simple activation functions
    if (this.isVerticalMode) {
      console.log("Calling activateVerticalMode");
      this.activateVerticalMode();
    } else {
      console.log("Calling activateNormalMode");
      this.activateNormalMode();
    }
  }

  activateNormalMode() {
    console.log("activateNormalMode started");
    this.isVerticalMode = false;
    this.updateVerticalModeStatus();

    // Start transition animation
    this.startTransitionAnimation(false);

    // Adjust game parameters for normal mode
    this.pipeSpeed = 2;
    this.pipeGap = 150;

    // Pause only obstacles generation during transition, but let bird continue
    this.transitionPause = true;
    this.transitionTimer = setTimeout(() => {
      this.transitionPause = false;
    }, 800);

    // Show transition message
    this.showNormalModeTransition();
  }

  activateVerticalMode() {
    console.log("activateVerticalMode started");
    this.isVerticalMode = true;
    this.updateVerticalModeStatus();

    // Start transition animation
    this.startTransitionAnimation(true);

    // Adjust game parameters for vertical mode
    this.pipeSpeed = 3; // Slightly faster
    this.pipeGap = 120; // Smaller gap for more challenge

    // Pause only obstacles generation during transition, but let spaceship continue
    this.transitionPause = true;
    this.transitionTimer = setTimeout(() => {
      this.transitionPause = false;
    }, 800);

    // Show transition message
    this.showVerticalModeTransition();
  }

  updateVerticalModeStatus() {
    this.verticalModeElement.textContent = this.isVerticalMode
      ? "Spaziale"
      : "Normale";
    this.verticalModeElement.style.color = this.isVerticalMode
      ? "#4A90E2"
      : "#FFD700";
  }

  startTransitionAnimation(toSpaceMode) {
    const canvas = this.canvas;
    const container = document.querySelector(".game-container");
    const duration = 1500; // 1.5 seconds for cinematic transition
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing function
      const easeProgress = this.easeInOutCubic(progress);

      // Update transition progress for background animation
      this.transitionProgress = toSpaceMode ? easeProgress : 1 - easeProgress;

      // Create cinematic transition effects
      const blurAmount = Math.sin(easeProgress * Math.PI) * 8; // Blur effect
      const rotationAmount = (easeProgress - 0.5) * 0.1; // Slight rotation
      const scaleAmount = 1 + Math.sin(easeProgress * Math.PI) * 0.05; // Scale effect

      // Apply cinematic effects
      canvas.style.filter = `blur(${blurAmount}px)`;
      canvas.style.transform = `rotate(${rotationAmount}deg) scale(${scaleAmount})`;
      container.style.transform = `scale(${scaleAmount})`;

      // Add glow effect during transition
      if (toSpaceMode) {
        const glowIntensity = Math.sin(easeProgress * Math.PI) * 0.5;
        canvas.style.boxShadow = `0 0 ${
          20 + glowIntensity * 30
        }px rgba(74, 144, 226, ${0.3 + glowIntensity})`;
      } else {
        const glowIntensity = Math.sin(easeProgress * Math.PI) * 0.5;
        canvas.style.boxShadow = `0 0 ${
          20 + glowIntensity * 30
        }px rgba(255, 215, 0, ${0.3 + glowIntensity})`;
      }

      if (progress >= 1) {
        // Complete transition
        if (toSpaceMode) {
          canvas.classList.add("space-mode");
          container.classList.add("space-mode");
        } else {
          canvas.classList.remove("space-mode");
          container.classList.remove("space-mode");
        }

        // Reset all effects
        canvas.style.filter = "";
        canvas.style.transform = "";
        canvas.style.boxShadow = "";
        container.style.transform = "";
        this.transitionProgress = null;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  resetCanvas() {
    // Rimuovi tutte le classi CSS
    this.canvas.classList.remove("vertical-mode");
    this.canvas.classList.remove("space-mode");
    document.querySelector(".game-container").classList.remove("space-mode");

    // Reset dei parametri del gioco
    this.pipeSpeed = 2;
    this.pipeGap = 150;

    // Assicurati che il container sia sincronizzato
    const container = document.querySelector(".game-container");
    if (container) {
      container.classList.remove("space-mode");
    }
  }

  showNormalModeTransition() {
    // Create a temporary overlay for the transition
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: #FFD700;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Fredoka One', cursive;
      font-size: 1.2rem;
      z-index: 1000;
      text-align: center;
      border: 2px solid #FFD700;
      animation: fadeInOut 0.8s ease-in-out;
    `;
    overlay.innerHTML = `
      <div style="margin-bottom: 5px;">🌍 TERRESTRE 🌍</div>
    `;

    this.canvas.parentElement.style.position = "relative";
    this.canvas.parentElement.appendChild(overlay);

    // Remove overlay after 0.8 seconds
    setTimeout(() => {
      if (overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      }
    }, 800);
  }

  showVerticalModeTransition() {
    // Create a temporary overlay for the transition
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: #4A90E2;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Fredoka One', cursive;
      font-size: 1.2rem;
      z-index: 1000;
      text-align: center;
      border: 2px solid #4A90E2;
      animation: fadeInOut 0.8s ease-in-out;
    `;
    overlay.innerHTML = `
      <div style="margin-bottom: 5px;">🚀 SPAZIALE 🚀</div>
    `;

    this.canvas.parentElement.style.position = "relative";
    this.canvas.parentElement.appendChild(overlay);

    // Remove overlay after 0.8 seconds
    setTimeout(() => {
      if (overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      }
    }, 800);
  }

  showRandomModeTransition() {
    const isSpaceMode = this.selectedGameMode === "space";
    const overlay = document.createElement("div");
    overlay.id = "transition-overlay";
    overlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: ${isSpaceMode ? "#4A90E2" : "#FFD700"};
      padding: 20px;
      border-radius: 10px;
      font-family: 'Fredoka One', cursive;
      font-size: 1.5rem;
      z-index: 1000;
      text-align: center;
      border: 2px solid ${isSpaceMode ? "#4A90E2" : "#FFD700"};
    `;
    overlay.innerHTML = `
      <div style="margin-bottom: 10px;">
        ${isSpaceMode ? "🚀 MODALITÀ SPAZIALE!" : "🌍 MODALITÀ TERRESTRE!"}
      </div>
      <div style="font-size: 1rem; opacity: 0.8;">Cambio automatico!</div>
    `;

    this.canvas.parentElement.style.position = "relative";
    this.canvas.parentElement.appendChild(overlay);

    // Remove overlay after 1 second
    setTimeout(() => {
      const existingOverlay = document.getElementById("transition-overlay");
      if (existingOverlay && existingOverlay.parentElement) {
        existingOverlay.parentElement.removeChild(existingOverlay);
        console.log("Transition overlay removed");
      }
    }, 1000);
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

    if (this.isVerticalMode) {
      // Space ship view from above
      this.drawSpaceShip();
    } else {
      // Normal bird view
      this.ctx.rotate((this.bird.rotation * Math.PI) / 180);
      this.drawNormalBird();
    }

    this.ctx.restore();
  }

  drawNormalBird() {
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
  }

  drawSpaceShip() {
    // Space ship body (view from above)
    this.ctx.fillStyle = "#4A90E2";
    this.ctx.fillRect(
      -this.bird.width / 2,
      -this.bird.height / 2,
      this.bird.width,
      this.bird.height
    );

    // Space ship cockpit
    this.ctx.fillStyle = "#87CEEB";
    this.ctx.fillRect(
      -this.bird.width / 2 + 3,
      -this.bird.height / 2 + 3,
      this.bird.width - 6,
      this.bird.height - 6
    );

    // Space ship engines
    this.ctx.fillStyle = "#FF6B6B";
    this.ctx.fillRect(
      -this.bird.width / 2 + 2,
      -this.bird.height / 2 + 8,
      4,
      4
    );
    this.ctx.fillRect(this.bird.width / 2 - 6, -this.bird.height / 2 + 8, 4, 4);

    // Space ship details
    this.ctx.fillStyle = "#1E3A8A";
    this.ctx.fillRect(
      -this.bird.width / 2 + 8,
      -this.bird.height / 2 + 5,
      6,
      6
    );
  }

  drawPipes() {
    if (this.isVerticalMode) {
      // Draw asteroids for space mode
      this.ctx.fillStyle = "#8B4513"; // Brown color for asteroids

      for (const obstacle of this.pipes) {
        if (obstacle && obstacle.type === "asteroid") {
          this.drawAsteroid(obstacle);
        }
      }
    } else {
      // Green pipes for normal mode
      this.ctx.fillStyle = "#228B22";

      for (const pipe of this.pipes) {
        if (pipe && pipe.type === "pipe") {
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
          this.ctx.fillRect(
            pipe.x - 5,
            pipe.gapY - 20,
            this.pipeWidth + 10,
            20
          );
          this.ctx.fillRect(
            pipe.x - 5,
            pipe.gapY + this.pipeGap,
            this.pipeWidth + 10,
            20
          );
          this.ctx.fillStyle = "#228B22";
        }
      }
    }
  }

  drawAsteroid(asteroid) {
    // Draw asteroid as a circle with some texture
    this.ctx.fillStyle = "#8B4513";
    this.ctx.beginPath();
    this.ctx.arc(asteroid.x, asteroid.y, asteroid.size, 0, Math.PI * 2);
    this.ctx.fill();

    // Add some texture to the asteroid
    this.ctx.fillStyle = "#654321";
    this.ctx.beginPath();
    this.ctx.arc(
      asteroid.x - 5,
      asteroid.y - 5,
      asteroid.size / 3,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(
      asteroid.x + 3,
      asteroid.y + 3,
      asteroid.size / 4,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  drawClouds() {
    if (!this.isVerticalMode) {
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

      for (const cloud of this.clouds) {
        this.ctx.beginPath();
        this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  drawBackground() {
    if (this.isVerticalMode) {
      // Space background for vertical mode
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, "#0B1426"); // Deep space
      gradient.addColorStop(0.3, "#1E3A8A"); // Dark blue
      gradient.addColorStop(0.7, "#3B82F6"); // Blue
      gradient.addColorStop(1, "#60A5FA"); // Light blue
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Add stars
      this.drawStars();
    } else {
      // Sky gradient for normal mode
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, "#87CEEB");
      gradient.addColorStop(1, "#98FB98");
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawTransitionBackground() {
    // Create a cinematic transition between backgrounds
    const transitionProgress = this.transitionProgress || 0;

    // Normal mode colors
    const normalColors = {
      top: "#87CEEB",
      bottom: "#98FB98",
    };

    // Space mode colors
    const spaceColors = {
      top: "#0B1426",
      bottom: "#60A5FA",
    };

    // Create dramatic color interpolation with intermediate colors
    let topColor, bottomColor;

    if (transitionProgress < 0.5) {
      // First half: normal to intermediate dramatic colors
      const firstHalfProgress = transitionProgress * 2;
      topColor = this.interpolateColor(
        normalColors.top,
        "#4A90E2",
        firstHalfProgress
      );
      bottomColor = this.interpolateColor(
        normalColors.bottom,
        "#1E3A8A",
        firstHalfProgress
      );
    } else {
      // Second half: intermediate to space colors
      const secondHalfProgress = (transitionProgress - 0.5) * 2;
      topColor = this.interpolateColor(
        "#4A90E2",
        spaceColors.top,
        secondHalfProgress
      );
      bottomColor = this.interpolateColor(
        "#1E3A8A",
        spaceColors.bottom,
        secondHalfProgress
      );
    }

    // Create gradient with multiple color stops for more dramatic effect
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(
      0.3,
      this.interpolateColor(topColor, bottomColor, 0.3)
    );
    gradient.addColorStop(
      0.7,
      this.interpolateColor(topColor, bottomColor, 0.7)
    );
    gradient.addColorStop(1, bottomColor);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Add dramatic star effect
    if (transitionProgress > 0.2) {
      const starAlpha = Math.min((transitionProgress - 0.2) / 0.8, 1);
      this.ctx.globalAlpha = starAlpha;

      // Draw more stars during transition for dramatic effect
      this.drawEnhancedStars(transitionProgress);
      this.ctx.globalAlpha = 1;
    }

    // Add particle effects during transition
    this.drawTransitionParticles(transitionProgress);
  }

  drawEnhancedStars(progress) {
    // Draw more stars with varying sizes and intensities
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

    const numStars = 80 + Math.floor(progress * 40); // More stars during transition
    for (let i = 0; i < numStars; i++) {
      const x = (i * 37) % this.width;
      const y = (i * 73) % this.height;
      const size = (i % 4) + 1;
      const alpha = 0.3 + (Math.sin(i + progress * 10) * 0.5 + 0.5) * 0.7;

      this.ctx.globalAlpha = alpha;
      this.ctx.fillRect(x, y, size, size);
    }
    this.ctx.globalAlpha = 1;
  }

  drawTransitionParticles(progress) {
    // Create floating particles during transition
    const particleCount = 20;
    const particleSize = 2;

    for (let i = 0; i < particleCount; i++) {
      const x = ((i * 23) % this.width) + Math.sin(progress * 10 + i) * 20;
      const y = ((i * 17) % this.height) + Math.cos(progress * 10 + i) * 15;

      // Particle color based on transition progress
      const isSpaceMode = this.selectedGameMode === "space";
      const color = isSpaceMode ? "#4A90E2" : "#FFD700";
      const alpha = 0.3 + Math.sin(progress * 20 + i) * 0.4;

      this.ctx.fillStyle = `rgba(${
        isSpaceMode ? "74, 144, 226" : "255, 215, 0"
      }, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, particleSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  interpolateColor(color1, color2, factor) {
    // Simple color interpolation (can be improved for more complex colors)
    const hex1 = color1.replace("#", "");
    const hex2 = color2.replace("#", "");

    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);

    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  drawStars() {
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % this.width;
      const y = (i * 73) % this.height;
      const size = (i % 3) + 1;
      this.ctx.fillRect(x, y, size, size);
    }
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw background (with transition if active)
    if (
      this.transitionProgress !== null &&
      this.transitionProgress !== undefined
    ) {
      this.drawTransitionBackground();
    } else {
      this.drawBackground();
    }

    // Draw clouds
    this.drawClouds();

    // Draw pipes
    this.drawPipes();

    // Draw bird
    this.drawBird();
  }

  update() {
    if (this.gameState === "playing") {
      // Durante la transizione, aggiorna tutto tranne gli ostacoli per continuità
      if (!this.transitionPause) {
        this.updateBird();
        this.updatePipes();
        this.updateClouds();
        this.checkCollisions();
      } else {
        // Durante la transizione, aggiorna bird, nuvole e collisioni ma non gli ostacoli
        this.updateBird();
        this.updateClouds();
        this.checkCollisions();
        // Non aggiorniamo updatePipes() per evitare nuovi ostacoli durante la transizione
      }
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
