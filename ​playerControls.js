// ==========================================
// playerControls.js - FPS MOVEMENT, SHOOTING & HEALTH
// ==========================================

// --- PLAYER STATS ---
window.playerStats = {
    health: 100,
    maxHealth: 100,
    stamina: 100,
    ammo: 30,
    maxAmmo: 120,
    speed: 5.0,
    runSpeedMultiplier: 1.5,
    jumpPower: 4.0,
    isDead: false
};

// --- MOVEMENT VARIABLES ---
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isRunning = false;
let canJump = false;
const mass = 100.0;

// --- CAMERA MOUSE LOOK ---
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const PI_2 = Math.PI / 2;

// --- RAYCASTER (For Shooting) ---
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0); // Center of screen for FPS crosshair

// ==========================================
// INITIALIZATION & EVENT LISTENERS
// ==========================================

function initPlayerControls() {
    // Keyboard Listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Mouse Look Listener
    document.addEventListener('mousemove', onMouseMove);

    // Mouse Click Listener (Shooting)
    document.addEventListener('mousedown', onMouseDown);
    
    // UI Init
    updateHUD();
}

// 1. Mouse Look Logic
function onMouseMove(event) {
    if (!window.gameActive || playerStats.isDead) return;

    // Movement delta from pointer lock
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    euler.setFromQuaternion(camera.quaternion);

    // Adjust sensitivity here (0.002)
    euler.y -= movementX * 0.002; 
    euler.x -= movementY * 0.002;

    // Clamp pitch to avoid breaking neck (looking too far up/down)
    euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));

    camera.quaternion.setFromEuler(euler);
}

// 2. Keyboard Input
function onKeyDown(event) {
    if (!window.gameActive || playerStats.isDead) return;
    
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = true; break;
        case 'Space': 
            if (canJump) {
                velocity.y += playerStats.jumpPower;
                canJump = false;
            }
            break;
        case 'ShiftLeft': isRunning = true; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = false; break;
        case 'ShiftLeft': isRunning = false; break;
    }
}

// ==========================================
// SHOOTING MECHANICS
// ==========================================

function onMouseDown(event) {
    if (!window.gameActive || playerStats.isDead) return;
    
    // Left Click (Shoot)
    if (event.button === 0) {
        shootWeapon();
    }
}

function shootWeapon() {
    if (playerStats.ammo <= 0) {
        // Trigger empty clip sound/UI here
        logAction("Out of ammo!", "text-red-500");
        return;
    }

    playerStats.ammo--;
    updateHUD();

    // 1. Recoil Simulation (Slightly bump camera up)
    euler.setFromQuaternion(camera.quaternion);
    euler.x += 0.02; // Kick up
    camera.quaternion.setFromEuler(euler);

    // 2. Muzzle Flash (Briefly increase light intensity)
    if (window.playerLight) {
        window.playerLight.intensity = 5;
        setTimeout(() => { window.playerLight.intensity = 1; }, 50);
    }

    // 3. Raycast to hit enemies
    raycaster.setFromCamera(screenCenter, camera);
    
    // Grab enemies array from global scope (will be created in enemyAI.js)
    const enemies = window.zombieMeshes || []; 
    const intersects = raycaster.intersectObjects(enemies, true);

    if (intersects.length > 0) {
        // Hit detected!
        const hitObject = intersects[0].object;
        
        // Log kill/hit in UI
        logAction("Hit Target!", "text-green-400");
        
        // Trigger damage on enemy (we will link this in enemyAI.js)
        if (hitObject.userData && hitObject.userData.takeDamage) {
            hitObject.userData.takeDamage(25); 
        }
    }
}

// ==========================================
// HEALTH & DAMAGE SYSTEM
// ==========================================

// Global function so enemies can call it when they attack
window.takeDamage = function(amount) {
    if (playerStats.isDead) return;

    playerStats.health -= amount;
    
    // Damage Flash Screen Effect
    const flash = document.getElementById('damage-flash');
    if (flash) {
        flash.classList.add('damage-active');
        setTimeout(() => flash.classList.remove('damage-active'), 200);
    }

    if (playerStats.health <= 0) {
        playerStats.health = 0;
        playerDie();
    }
    
    updateHUD();
};

function playerDie() {
    playerStats.isDead = true;
    document.exitPointerLock();
    logAction("YOU DIED", "text-red-600 font-bold text-xl");
    
    // Fall to the ground
    velocity.x = 0;
    velocity.z = 0;
    
    // Tu yahan respawn menu ya game over screen show kar sakta hai
}

// ==========================================
// HUD UPDATES
// ==========================================

function updateHUD() {
    const healthBar = document.getElementById('hud-health');
    if (healthBar) healthBar.style.width = (playerStats.health / playerStats.maxHealth) * 100 + '%';
    
    // Quick Ammo Hack (Since index.html uses a text format)
    const ammoDisplays = document.querySelectorAll('.font-mono');
    ammoDisplays.forEach(el => {
        if(el.innerHTML.includes('/')) {
            el.innerHTML = `${playerStats.ammo} <span class="text-lg text-gray-500">/ ${playerStats.maxAmmo}</span>`;
        }
    });
}

function logAction(msg, colorClass = "text-gray-400") {
    const feed = document.getElementById('kill-feed');
    if (feed) {
        const p = document.createElement('p');
        p.className = colorClass;
        p.innerText = msg;
        feed.appendChild(p);
        
        // Keep only last 4 logs
        if (feed.children.length > 4) {
            feed.removeChild(feed.firstChild);
        }
    }
}

// ==========================================
// UPDATE LOOP (Called every frame from main.js)
// ==========================================

// Attach to global window object
window.updatePlayer = function(delta) {
    if (!camera || playerStats.isDead) return;

    // Apply Gravity
    velocity.y -= 9.8 * mass * delta; 

    // Dampen velocity (Friction)
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // Ensures consistent speed in all directions

    const currentSpeed = isRunning ? playerStats.speed * playerStats.runSpeedMultiplier : playerStats.speed;

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    // Apply movement based on camera's rotation (Yaw)
    camera.translateX(-velocity.x * delta * currentSpeed);
    camera.translateZ(velocity.z * delta * currentSpeed);
    
    // Apply Vertical Movement (Jump/Gravity)
    camera.position.y += (velocity.y * delta);

    // Floor collision (Basic - assumed floor is at y=0)
    if (camera.position.y < 1.6) {
        velocity.y = 0;
        camera.position.y = 1.6;
        canJump = true;
    }
};

// Initialize once script loads
initPlayerControls();

