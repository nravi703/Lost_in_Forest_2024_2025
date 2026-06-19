var inventory = [];
var life = 100;
var trapCooldown = false;
var timeRemaining = 120;
var monsterCooldown = false;

// 🧠 Store monster behavior interval so it can be cleared later
const monsterInterval = setInterval(() => {
  checkProximity();
  checkMonsterDog();
}, 100);

function checkProximity() {
  const player = document.getElementById('player');
  const lanterns = document.querySelectorAll('[id^="lantern"]');
  const traps = document.querySelectorAll('.trap');
  const playerPos = player.object3D.position;

  lanterns.forEach(lantern => {
    const lanternPos = lantern.object3D.position;
    const distance = playerPos.distanceTo(lanternPos);
    if (distance < 2 && !inventory.includes(lantern.id)) {
      collectLantern(lantern.id);
    }
  });

  if (!trapCooldown) {
    traps.forEach(trap => {
      const trapPos = trap.object3D.position;
      const distance = playerPos.distanceTo(trapPos);
      if (distance < 2) {
        triggerTrap();
      }
    });
  }
}

function collectLantern(id) {
  inventory.push(id);
  updateInventory();
  document.getElementById(id).setAttribute('visible', false);
  updateJournal(id);
  checkWinCondition();
}

function updateInventory() {
  document.getElementById('inventory').innerText = "Inventory: " + inventory.join(', ');
}

function updateJournal(id) {
  const journal = document.getElementById('journalEntry');
  const entries = {
    lantern1: "A faint name is carved into the base... 'Elira'. Who was she?",
    lantern2: "This one still flickers. Someone tried to survive here.",
    lantern3: "A piece of torn cloth lies next to the lantern. You're not alone.",
    lantern4: "Strange symbols are etched on the metal... warnings?",
    lantern5: "You feel warmth as you pick it up. A memory perhaps?",
    lantern6: "It's cold to the touch. Something’s not right here.",
    lantern7: "Moss covers it—it's been here for a long time.",
    lantern8: "It hums faintly, like it's alive."
  };
  journal.innerText = entries[id] || "The forest whispers as you press on.";
}

function checkWinCondition() {
  if (inventory.length === 8) {
    document.getElementById('message').innerText = "🎉 Congratulations! You have collected all the lanterns and escaped the forest!";
    document.getElementById('journalEntry').innerText = "You've collected them all. A hidden path reveals itself...";
    document.getElementById('winMessage').classList.remove('hidden');

    // 🛑 Stop the monster dog
    clearInterval(monsterInterval);
    document.getElementById('monsterDog').setAttribute('visible', false);
  }
}

function triggerTrap() {
  if (trapCooldown) return;
  life -= 5;
  if (life <= 0) {
    life = 0;
    fadeOutAndRestart("Game Over! You lost all your life.");
  } else {
    trapCooldown = true;
    alert("You hit a trap! Lost 5 life.");
    setTimeout(() => { trapCooldown = false; }, 2000);
  }
  document.getElementById('life').innerText = `Life: ${life}`;
  document.getElementById('message').innerText = "Be careful! Avoid the traps.";
}

// Ambient sound variation
setInterval(() => {
  const wind = document.querySelector('#windSound');
  const creak = document.querySelector('#creakSound');
  const rand = Math.random();
  if (rand < 0.5) wind.components.sound.playSound();
  else creak.components.sound.playSound();
}, 7000);

// Footsteps
let lastPlayerPos = new THREE.Vector3();
const footstepSound = document.querySelector('#footstepSound');
setInterval(() => {
  const player = document.getElementById('player');
  const currentPos = player.object3D.position.clone();
  if (currentPos.distanceTo(lastPlayerPos) > 0.1) {
    if (!footstepSound.components.sound.isPlaying) {
      footstepSound.components.sound.playSound();
    }
  }
  lastPlayerPos.copy(currentPos);
}, 300);

// Darkness / time pressure
setInterval(() => {
  if (timeRemaining > 0) {
    timeRemaining--;

    const intensity = 0.8 * (timeRemaining / 120);
    document.getElementById('mainLight').setAttribute('intensity', intensity);

    const gray = Math.floor(153 * (timeRemaining / 120));
    document.getElementById('sky').setAttribute('color', `rgb(${gray}, ${gray}, ${gray})`);

    if (timeRemaining < 60 && Math.random() < 0.1) {
      const creature = document.getElementById('shadowCreature');
      creature.setAttribute('visible', true);
      setTimeout(() => creature.setAttribute('visible', false), 1500);
      document.querySelector('#monsterGrowl')?.components?.sound?.playSound();
    }
  } else {
    fadeOutAndRestart("The darkness consumes you...");
  }
}, 1000);

// Monster Dog 
function checkMonsterDog() {
  const player = document.getElementById('player');
  const monster = document.getElementById('monsterDog');

  const playerPos = player.object3D.position.clone();
  const monsterPos = monster.object3D.position.clone();

  // Fix Y so the monster stays on the ground
  playerPos.y = 0;
  monsterPos.y = 0;

  const direction = new THREE.Vector3().subVectors(playerPos, monsterPos).normalize();
  const newPos = monsterPos.add(direction.multiplyScalar(0.05));
  newPos.y = 0; // Ensure monster stays grounded

  monster.object3D.position.set(newPos.x, newPos.y, newPos.z);

  const distance = playerPos.distanceTo(monster.object3D.position);
  if (distance < 2 && !monsterCooldown) {
    attackPlayer();
  }
}

function attackPlayer() {
  monsterCooldown = true;
  life -= 10;
  if (life <= 0) {
    life = 0;
    fadeOutAndRestart("The monster dog got you...");
  } else {
    document.querySelector('#monsterGrowl').components.sound.playSound();
    document.getElementById('life').innerText = `Life: ${life}`;
    document.getElementById('message').innerText = "The monster dog attacked you!";
    setTimeout(() => { monsterCooldown = false; }, 3000);
  }
}

// Game Over Screen
function fadeOutAndRestart(message) {
  const screen = document.getElementById('gameOverScreen');
  screen.classList.remove('hidden');
  screen.innerHTML = `<p>${message}</p>`;
  document.querySelector('#monsterGrowl')?.components?.sound?.playSound();
  setTimeout(() => location.reload(), 4000);
}
