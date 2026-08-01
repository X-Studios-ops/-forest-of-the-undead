// ==========================================
// playerControls.js - HYBRID (PC + MOBILE) MOVEMENT
// ==========================================

window.playerStats = {
    health: 100, maxHealth: 100, stamina: 100,
    ammo: 30, maxAmmo: 120, speed: 5.0, runSpeedMultiplier: 1.5,
    jumpPower: 4.0, isDead: false
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let isRunning = false, canJump = false;
const mass = 100.0;

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const PI_2 = Math.PI / 2;
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);

// --- MOBILE TOUCH VARIABLES ---
let isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
let lastTouchX = 0, lastTouchY = 0;

function initPlayerControls() {
    // PC Events
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);

    // Mobile Events Setup
    if (isMobile) {
        setupMobileControls();
    }
    updateHUD();
}

// ==========================================
// MOBILE TOUCH LOGIC
// ==========================================
function setupMobileControls() {
    console.log("📱 Mobile Controls Activated");

    // Movement D-PAD
    const bindTouch = (id, actionDown, actionUp) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); actionDown(); }, { passive: false });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); actionUp(); }, { passive: false });
    };

    bindTouch('btn-up', () => moveForward = true, () => moveForward = false);
    bindTouch('btn-down', () => moveBackward = true, () => moveBackward = false);
    bindTouch('btn-left', () => moveLeft = true, () => moveLeft = false);
    bindTouch('btn-right', () => moveRight = true, () => moveRight = false);
    
    // Jump & Shoot
    bindTouch('btn-jump', () => { if (canJump) { velocity.y += playerStats.jumpPower; canJump = false; } }, () => {});
    bindTouch('btn-shoot', () => shootWeapon(), () => {});

    // Look Around (Swipe on right side of screen)
    const lookArea = document.getElementById('touch-look-area');
    if (lookArea) {
        lookArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
        }, { passive: false });

        lookArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!window.gameActive || playerStats.isDead) return;

            const touch = e.touches[0];
            const movementX = touch.clientX - lastTouchX;
            const movementY = touch.clientY - lastTouchY;
            
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;

            euler.setFromQuaternion(camera.quaternion);
            euler.y -= movementX * 0.003; // Touch sensitivity
            euler.x -= movementY * 0.003;
            euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
            camera.quaternion.setFromEuler(euler);
        }, { passive: false });
    }

    // Bypass Pointer Lock for Mobile on Game Start
    const origStart = window.startGame;
    window.startGame = function() {
        origStart();
        if (isMobile) {
            window.gameActive = true; // Force activate on mobile without pointer lock
            document.getElementById('mobile-controls').classList.remove('hidden');
        }
    };
}

// ==========================================
// PC LOGIC
// ==========================================
function onMouseMove(event) {
    if (!window.gameActive || playerStats.isDead || isMobile) return;
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    euler.setFromQuaternion(camera.quaternion);
    euler.y -= movementX * 0.002; 
    euler.x -= movementY * 0.002;
    euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
    camera.quaternion.setFromEuler(euler);
}

function onKeyDown(event) {
    if (!window.gameActive || playerStats.isDead) return;
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward = true; break;
        case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
        case 'ArrowDown': case 'KeyS': moveBackward = true; break;
        case 'ArrowRight': case 'KeyD': moveRight = true; break;
        case 'Space': if (canJump) { velocity.y += playerStats.jumpPower; canJump = false; } break;
        case 'ShiftLeft': isRunning = true; break;
    }
}
function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward = false; break;
        case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
        case 'ArrowDown': case 'KeyS': moveBackward = false; break;
        case 'ArrowRight': case 'KeyD': moveRight = false; break;
        case 'ShiftLeft': isRunning = false; break;
    }
}
function onMouseDown(event) {
    if (!window.gameActive || playerStats.isDead || isMobile) return;
    if (event.button === 0) shootWeapon();
}

// ==========================================
// SHOOTING & HEALTH
// ==========================================
function shootWeapon() {
    if (playerStats.ammo <= 0) {
        logAction("Out of ammo!", "text-red-500");
        return;
    }
    playerStats.ammo--;
    updateHUD();

    euler.setFromQuaternion(camera.quaternion);
    euler.x += 0.02; // Recoil
    camera.quaternion.setFromEuler(euler);

    if (window.playerLight) {
        window.playerLight.intensity = 5;
        setTimeout(() => { window.playerLight.intensity = 1; }, 50);
    }

    raycaster.setFromCamera(screenCenter, camera);
    const enemies = window.zombieMeshes || []; 
    const intersects = raycaster.intersectObjects(enemies, true);

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        logAction("Hit Target!", "text-green-400");
        if (hitObject.userData && hitObject.userData.takeDamage) hitObject.userData.takeDamage(25); 
    }
}

window.takeDamage = function(amount) {
    if (playerStats.isDead) return;
    playerStats.health -= amount;
    
    const flash = document.getElementById('damage-flash');
    if (flash) {
        flash.classList.add('damage-active');
        setTimeout(() => flash.classList.remove('damage-active'), 200);
    }
    if (playerStats.health <= 0) {
        playerStats.health = 0;
        playerStats.isDead = true;
        if (!isMobile) document.exitPointerLock();
        logAction("YOU DIED", "text-red-600 font-bold text-xl");
    }
    updateHUD();
};

function updateHUD() {
    const healthBar = document.getElementById('hud-health');
    if (healthBar) healthBar.style.width = (playerStats.health / playerStats.maxHealth) * 100 + '%';
    const ammoDisplays = document.querySelectorAll('.font-mono');
    ammoDisplays.forEach(el => {
        if(el.innerHTML.includes('/')) el.innerHTML = `${playerStats.ammo} <span class="text-lg text-gray-500">/ ${playerStats.maxAmmo}</span>`;
    });
}

function logAction(msg, colorClass = "text-gray-400") {
    const feed = document.getElementById('kill-feed');
    if (feed) {
        const p = document.createElement('p');
        p.className = colorClass;
        p.innerText = msg;
        feed.appendChild(p);
        if (feed.children.length > 4) feed.removeChild(feed.firstChild);
    }
}

// ==========================================
// UPDATE LOOP
// ==========================================
window.updatePlayer = function(delta) {
    if (!camera || playerStats.isDead) return;

    velocity.y -= 9.8 * mass * delta; 
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); 

    const currentSpeed = isRunning ? playerStats.speed * playerStats.runSpeedMultiplier : playerStats.speed;

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    camera.translateX(-velocity.x * delta * currentSpeed);
    camera.translateZ(velocity.z * delta * currentSpeed);
    camera.position.y += (velocity.y * delta);

    if (camera.position.y < 1.6) {
        velocity.y = 0;
        camera.position.y = 1.6;
        canJump = true;
    }
};

initPlayerControls();
