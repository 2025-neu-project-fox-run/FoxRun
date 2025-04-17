function setup() {
  // Small screen size makes text and objects look glitchy and makes things appear more pixelated, which is what we want to achieve.
  createCanvas(128, 128);
  displayMode("maxed");

  loadScene("game", 1);
}

let currentScene;

async function loadScene(name, ...setupArgs) {
  currentScene = await import(`./${name}.js`);

  allSprites.remove();
  world.gravity = new Vector(0, 0);

  await currentScene.setup?.(...setupArgs);
}

function update() {
  currentScene?.update?.();
}

function drawFrame() {
  currentScene?.drawFrame?.();
}
