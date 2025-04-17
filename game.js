// TODO: Get more assets
// TODO: Maybe add audio

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
    this.spriteSheet = "/assets/FOXSPRITESHEET.png";

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
    this.rotation = 0;
    if (player.playing && !player.lost) this.y += this.speed;
    this.x = (this.lane * width) / 5 + width / 10;
  }
}

let brightness = 0;
let timer = 0;
let player = null;

export function update() {
  // Intro sequence
  if (frameCount % 5 === 0) {
    if (brightness < 200) {
      background((brightness += 10));
    } else {
      timer += 1;
      if (timer < 5) return;

      // This turned out way too cool...
      fill(timer < 25 ? 0 : 200);
      stroke(timer < 25 ? 0 : 200);
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
    background(200);

    if (!player) {
      player = new Player();
      player.lane = 2;
    }

    if (!player.playing) {
      obstacles.removeAll();

      player.lane = 2;
      player.points = 0;

      fill(!kb.pressed("enter") ? 0 : 200);
      text(`Press [return] to start`, width / 2, height - 56);
      fill(200);

      if (kb.pressed("enter")) player.playing = true;
    } else {
      // TODO: Make gameplay work

      if (!player.lost) {
        player.initials = "";
        if (frameCount % 90 === 0) {
          let obstacleCount = Math.floor(Math.random() * 3) + 1;
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

        if (frameCount % 3 === 0) player.points += 1;

        fill(0);
        textSize(4);
        text(`${player.points}`, width / 2, height - 96);
        fill(200);

        if (kb.pressed("enter")) player.playing = false;
      } else {
        for (const obstacle of obstacles) {
          obstacle.color = "#00000010";
        }

        fill(0);
        textSize(4);

        textAlign(CENTER);
        text(`Game Over`, width / 2, height - 108);

        textAlign(LEFT);
        text("Leaderboard", 12, height - 84);

        let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

        leaderboard.push({
          initials: player.initials.padEnd(3, "X"),
          points: player.points,
        });

        leaderboard.sort((a, b) => b.points - a.points);

        const playerIndex = leaderboard.findIndex(
          (entry) =>
            entry.initials === player.initials.padEnd(3, "X") &&
            entry.points === player.points
        );

        let c = 0;

        for (let i = 0; i < leaderboard.length; i++) {
          const entry = leaderboard[i];
          console.log(entry);
          if (
            [playerIndex + 1, playerIndex + 2, playerIndex, 0].includes(i) ||
            (playerIndex === 0 && i === playerIndex + 3)
          ) {
            fill(i == playerIndex ? "red" : 0);
            text(
              `${entry.points} ${"-".repeat(
                15 + 5 - entry.points.toString().length
              )} ${entry.initials.padEnd(3, "X")}`,
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
        fill(200);

        if (kb.pressed("enter") && player.initials.length === 3) {
          localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
          player.lost = false;
          player.playing = false;
        }
      }
    }
  }
}
