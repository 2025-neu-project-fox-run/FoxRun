// TODO: Get more assets
// TODO: Maybe add audio

// Stores all the obstacles generated on the fly
let obstacles = new Group();

export class Player extends Sprite {
  // NOTE: Basically, this game is an infinite runner, where the player has to dodge obstacles that are coming from the top of the screen. The player can move left and right (through 5 lanes) using the arrow keys. The game ends when the player collides with an obstacle.
  lane = 2;
  constructor(lane) {
    super(0, 0);
    this.y = height - 24;
    this.x = (this.lane * width) / 5 + width / 10;
    this.w = 32;
    this.h = 32;
    this.lane = lane;
    this.img = "😭";
    this.spriteSheet = "/assets/FOXSPRITESHEET.png";

    this.addAnis({
      running: { row: 0, frames: [44, 45, 46, 47, 48, 49, 50, 51] },
      standing: { row: 0, frames: [12, 13, 14, 15] },
    });
    this.changeAni("standing");
    allSprites.pixelPerfect = true;

    const defaultDraw = this._draw;
    this._draw = function () {
      defaultDraw();
    };
  }

  update() {
    if (playing) {
      this.changeAni("running");
    } else {
      this.changeAni("standing");
    }

    if (this.collides(obstacles)) {
      alert("Game Over!");
    }

    if (kb.pressed("arrowLeft")) {
      this.lane = constrain(this.lane - 1, 0, 4);
    }

    if (kb.pressed("arrowRight")) {
      this.lane = constrain(this.lane + 1, 0, 4);
    }

    this.y = height - 24;
    this.x = (this.lane * width) / 5 + width / 10;
  }
}

export class Obstacle extends Sprite {
  lane = 0;
  constructor(lane) {
    super(0, 0);
    this.lane = lane;
    this.addToGroup(obstacles);
  }

  update() {
    if (this.position.y > height + 50) {
      this.removeFromGroup(obstacles);
      this.remove();
    }
  }
}

let brightness = 0;
let timer = 0;
let player = null;
let playing = false;

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
      textFont("'Press Start 2P', system-ui");
      text(`© Team name, ${new Date().getFullYear()}`, width / 2, height - 10);
    }
  }

  // Game sequence
  if (timer > 50) {
    background(200);

    if (!player) {
      player = new Player(2);
    }

    if (!playing) {
      fill(!kb.pressed("enter") ? 0 : 200);
      text(`Press [return] to start`, width / 2, height - 56);
      fill(200);
      if (kb.pressed("enter")) playing = true;
    } else {
      // TODO: Make gameplay work
      fill(0);
      textSize(3);
      text(`[Insert very interesting gameplay here]`, width / 2, height - 56);
      fill(200);
      if (kb.pressed("enter")) playing = false;
    }
  }
}
