// Stores all the obstacles generated on the fly
const obstacles = new Group();

export class Player extends Sprite {
  // NOTE: Basically, this game is an infinite runner, where the player has to dodge obstacles that are coming from the top of the screen. The player can move left and right (through 5 lanes) using the arrow keys. The game ends when the player collides with an obstacle.
  lane = 2;
  points = 0;
  playing = false;
  lost = false;
  initials = "";
  constructor() {
    super((2 * width) / 5 + width / 10, height - 24);

    this.x = (this.lane * width) / 5 + width / 10;
    this.y = height - 24;
    this.w = width / 5 - width / 8;
    this.h = height / 24;

    this.lane = 2;
    this.points = 0;
    this.playing = false;
    this.lost = false;
    this.initials = "";

    this.gravityScale = 0;
    this.rotation = 0;

    this.layer = 2;
    this.overlap(obstacles);

    this.collider = "static";
    this.spriteSheet = "/assets/img/FOXSPRITESHEET.png";

    this.addAnis({
      running: {
        frames: [44, 45, 46, 47, 48, 49, 50, 51],
        width: 32,
        height: 32,
      },
      standing: { frames: [12, 13, 14, 15], width: 32, height: 32 },
    });
    this.changeAni("standing");
    allSprites.pixelPerfect = true;

    const defaultDraw = this._draw;
    this._draw = function () {
      defaultDraw();
    };
  }

  update() {
    if (this.collides(obstacles)) {
      this.lost = true;
      gameOverSound.play();
      if (!gameMusic.paused) gameMusic.stop();
      if (menuMusic.paused) menuMusic.play();
    }

    if (this.playing && !this.lost) {
      this.changeAni("running");

      if (kb.pressed("arrowLeft")) {
        this.lane = constrain(this.lane - 1, 0, 4);
      }

      if (kb.pressed("arrowRight")) {
        this.lane = constrain(this.lane + 1, 0, 4);
      }
    } else {
      this.changeAni("standing");
    }

    this.rotation = 0;
    this.y = height - 24;
    this.x = (this.lane * width) / 5 + width / 10;
  }
}

export class Obstacle extends Sprite {
  lane = 2;
  constructor(lane) {
    super((2 * width) / 5 + width / 10, -32);
    this.w = width / 5 - width / 10;
    this.h = 24;
    this.lane = lane || Math.floor(Math.random() * 5);
    this.y = -32;
    this.x = (this.lane * width) / 5 + width / 10;
    this.gravityScale = 0;
    this.rotation = 0;
    this.layer = 1;
    this.speed = 1 + player.points / 1000;
    obstacles.add(this);
  }

  update() {
    // This is a way to prevent a bug from happening where two obstacles get stuck into each other, sometimes causes only a single object spawning, but it happens rarely and it's not like the player will mind the game being more kind to them from time to time
    if (this.collides(obstacles)) this.remove();

    this.rotation = 0;

    if (player.playing && !player.lost) this.y += this.speed;

    this.x = (this.lane * width) / 5 + width / 10;
  }
}

let brightness = 0;
let timer = 0;
let difficulty = parseInt(localStorage.getItem("difficulty")) ?? 1;
let player = null;
let bgColor = 200;
let fgColor = 0;

let gameOverSound = loadSound("/assets/audio/gameover.mp3");
gameOverSound.volume = 0.3;
gameOverSound.loop = false;

let gameMusic = loadSound("/assets/audio/game.mp3");
gameMusic.volume = 0.3;
gameMusic.loop = true;

// Had to convert it from OGG to MP3 and then render it with Premiere Pro, because for some reason p5play couldn't decode the file lol
let menuMusic = loadSound("/assets/audio/menu.mp3");
gameMusic.volume = 0.3;
gameMusic.loop = true;

export function update() {
  // Intro sequence
  if (frameCount % 5 === 0) {
    if (brightness < bgColor) {
      background((brightness += 10));
    } else {
      timer += 1;
      if (timer < 5) return;

      // This turned out way too cool...
      fill(timer < 25 ? fgColor : bgColor);
      stroke(timer < 25 ? fgColor : bgColor);
      rectMode(CENTER);
      rect(width / 2, height / 2, 24, 24);
      noStroke();
      textAlign(CENTER);
      textSize(4);
      textFont("'Press Start 2P'");
      text(`© Team name, ${new Date().getFullYear()}`, width / 2, height - 10);
    }
  }

  // Game sequence
  if (timer > 50) {
    background(bgColor);

    if (!player) {
      player = new Player();
      player.lane = 2;
    }

    if (!player.playing) {
      if (!menuMusic.isPlaying()) menuMusic.play();
      if (!gameMusic.paused) gameMusic.stop();
      if (frameCount % 2 === 0 && bgColor != 200) bgColor += 10;
      if (frameCount % 2 === 0 && fgColor != 0) fgColor -= 10;

      obstacles.removeAll();

      player.lane = 2;
      player.points = 0;

      fill(fgColor);
      textAlign(LEFT);
      text("Select difficulty", width / 7, height - 108);
      textSize(3);

      for (const [dif, i] of Object.entries({ easy: 0, medium: 1, hard: 2 })) {
        fill(difficulty == 2 - i ? "red" : fgColor);
        text(
          `[${i}]: ${dif.charAt(0).toUpperCase() + dif.slice(1)}`,
          width / 7,
          height - 80 - (2 - i) * 8
        );
      }

      if (kb.pressed("2")) difficulty = 0;
      if (kb.pressed("1")) difficulty = 1;
      if (kb.pressed("0")) difficulty = 2;

      fill(!kb.pressed("enter") ? fgColor : bgColor);
      textSize(4);
      textAlign(CENTER);
      text(`Press [return] to start`, width / 2, height - 44);
      fill(bgColor);

      if (kb.pressed("enter")) {
        gameMusic.play();
        menuMusic.stop();
        localStorage.setItem("difficulty", difficulty);
        player.playing = true;
      }
    } else {
      if (!player.lost) {
        if (!gameMusic.isPlaying()) gameMusic.play();
        if (!menuMusic.paused) menuMusic.stop();

        player.initials = "";

        if (frameCount % (45 + difficulty * 30) === 0) {
          let obstacleCount = Math.floor(Math.random() * 2) + 2;
          let usedLanes = new Set();
          for (let i = 0; i < obstacleCount; i++) {
            let lane;
            do {
              lane = Math.floor(Math.random() * 5);
            } while (usedLanes.has(lane));
            usedLanes.add(lane);
            new Obstacle(lane);
          }
        }

        if (Math.floor(player.points / 700) % 2 !== 0) {
          if (frameCount % 2 === 0 && bgColor != 0) bgColor -= 10;
          if (frameCount % 2 === 0 && fgColor != 200) fgColor += 10;
        } else {
          if (frameCount % 2 === 0 && bgColor != 200) bgColor += 10;
          if (frameCount % 2 === 0 && fgColor != 0) fgColor -= 10;
        }

        if (frameCount % 3 === 0) player.points += 1;

        fill(fgColor);
        textSize(4);
        text(`${player.points}`, width / 2, height - 96);
        fill(bgColor);

        if (kb.pressed("enter")) player.playing = false;
      } else {
        setTimeout(() => {
          if (!menuMusic.isPlaying()) menuMusic.play();
          if (!gameMusic.paused) gameMusic.stop();
        }, 200);

        if (frameCount % 2 === 0 && bgColor != 200) bgColor += 10;
        if (frameCount % 2 === 0 && fgColor != 0) fgColor -= 10;

        for (const obstacle of obstacles) {
          obstacle.color = "#00000020";
        }

        fill(fgColor);
        textSize(4);

        textAlign(CENTER);
        text(`Game Over`, width / 2, height - 108);

        textAlign(LEFT);
        text("Leaderboard", 12, height - 84);

        let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

        leaderboard.push({
          initials: player.initials.padEnd(3, "-"),
          points: player.points,
        });

        leaderboard.sort((a, b) => b.points - a.points);

        const playerIndex = leaderboard.findIndex(
          (entry) =>
            entry.initials === player.initials.padEnd(3, "-") &&
            entry.points === player.points
        );

        let c = 0;

        for (let i = 0; i < leaderboard.length; i++) {
          const entry = leaderboard[i];
          if (
            [playerIndex + 1, playerIndex + 2, playerIndex, 0].includes(i) ||
            (playerIndex === 0 && i === playerIndex + 3)
          ) {
            fill(i == playerIndex ? "red" : fgColor);
            text(
              `${entry.points} ${"-".repeat(
                15 + 5 - entry.points.toString().length
              )} ${entry.initials.padEnd(3, "-")}`,
              12,
              height - 72 + c * 12
            );
            c++;
          }
        }

        if (player.initials.length < 3) {
          for (let i = 65; i <= 90; i++) {
            if (kb.pressed(String.fromCharCode(i).toLowerCase())) {
              player.initials += String.fromCharCode(i);
            }
          }
        }

        if (kb.backspace && frameCount % 6 === 0) {
          player.initials = player.initials.slice(0, -1);
        }

        textAlign(CENTER);
        fill(bgColor);

        if (kb.pressed("enter")) {
          if (player.initials.length === 3) {
            if (!gameMusic.paused) gameMusic.stop();
            if (!menuMusic.isPlaying()) menuMusic.play();

            localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

            player.lost = false;
            player.playing = false;
          } else {
            gameOverSound.play();
          }
        }
      }
    }
  }
}
