// ==========================================
// playerControls.js - GOD LEVEL (PRO AAA MECHANICS)
// ==========================================

window.playerStats = { 
    health: 100, maxHealth: 100, 
    ammo: 30, maxAmmo: 120, 
    baseSpeed: 4.5, sprintMultiplier: 1.8, 
    jumpPower: 4.5, isDead: false 
};

// --- OPTIMIZED VECTORS (To prevent memory leaks & Lag) ---
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);

// --- MOVEMENT STATE ---
let moveF = false, moveB = false, moveL = false, moveR = false;
let isRunning = false, canJump = true;
let isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);

// --- ADVANCED AAA MECHANICS STATE ---
let headBobTimer = 0;
let recoilAmount = 0;
const BASE_FOV = 75;
const SPRINT_FOV = 85;

function initPlayerControls() {
    if (!isMobile) {
        setupPCControls();
    } else {
        setupMobileControls();
    }
}

// ==========================================
// PC CONTROLS (MOUSE & KEYBOARD)
// ==========================================
function setupPCControls() {
    document.addEventListener('keydown', (e) => handleKey(e, true));
    document.addEventListener('keyup', (e) => handleKey(e, false));
    
    document.addEventListener('mousemove', (e) => {
        if (!window.gameActive || playerStats.isDead) return;
        euler.setFromQuaternion(camera.quaternion);
        euler.y -= e.movementX * 0.002;
        euler.x -= e.movementY * 0.002;
        // Lock looking too far up/down
        euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x));
        camera.quaternion.setFromEuler(euler);
    });

    document.addEventListener('mousedown', (e) => { 
        if (e.button === 0) shootWeapon(); 
    });
}

function handleKey(e, isDown) {
    switch (e.code) {
        case 'KeyW': case 'ArrowUp': moveF = isDown; break;
        case 'KeyS': case 'ArrowDown': moveB = isDown; break;
        case 'KeyA': case 'ArrowLeft': moveL = isDown; break;
        case 'KeyD': case 'ArrowRight': moveR = isDown; break;
        case 'ShiftLeft': isRunning = isDown; break;
        case 'Space': 
            if(isDown && canJump) { 
                velocity.y = playerStats.jumpPower; 
                canJump = false; 
            } 
            break;
    }
}

// ==========================================
// MOBILE TOUCH CONTROLS (MULTI-TOUCH OPTIMIZED)
// ==========================================
function setupMobileControls() {
    window.gameActive = true;
    
    // Smooth Button Binds
    const bind = (id, downAction, upAction) => {
        const el = document.getElementById(id);
        if(!el) return;
        el.addEventListener('touchstart', (e) => { e.preventDefault(); downAction(); }, {passive:false});
        el.addEventListener('touchend', (e) => { e.preventDefault(); upAction(); }, {passive:false});
    };

    bind('btn-up', () => { moveF = true; isRunning = true; }, () => { moveF = false; isRunning = false; }); // Auto-sprint on mobile forward
    bind('btn-down', () => moveB = true, () => moveB = false);
    bind('btn-left', () => moveL = true, () => moveL = false);
    bind('btn-right', () => moveR = true, () => moveR = false);
    bind('btn-jump', () => { if(canJump){ velocity.y = playerStats.jumpPower; canJump=false; } }, () => {});
    bind('btn-shoot', () => shootWeapon(), () => {});

    // Ultra-Smooth Camera Swipe
    let lastX = 0, lastY = 0;
    const lookArea = document.getElementById('touch-look-area');
    if(lookArea) {
        lookArea.addEventListener('touchstart', (e) => { 
            lastX = e.touches[0].clientX; 
            lastY = e.touches[0].clientY; 
        }, {passive:false});
        
        lookArea.addEventListener('touchmove', (e) => {
            if (playerStats.isDead) return;
            let dx = e.touches[0].clientX - lastX;
            let dy = e.touches[0].clientY - lastY;
            lastX = e.touches[0].clientX; 
            lastY = e.touches[0].clientY;
            
            euler.setFromQuaternion(camera.quaternion);
            euler.y -= dx * 0.0035; // Fine-tuned mobile sensitivity
            euler.x -= dy * 0.0035;
            euler.x = Math.max(-1.5, Math.min(1.5, euler.x));
            camera.quaternion.setFromEuler(euler);
        }, {passive:false});
    }
}

// ==========================================
// SHOOTING & COMBAT SYSTEM
// ==========================================
function shootWeapon() {
    if (!window.gameActive || playerStats.isDead || playerStats.ammo <= 0) return;
    
    playerStats.ammo--;
    updateHUD();

    // Add Recoil Force
    recoilAmount += 0.05;

    // Muzzle Flash Effect
    if (window.playerLight) {
        window.playerLight.intensity = 8;
        setTimeout(() => { window.playerLight.intensity = 1; }, 50);
    }

    // Raycast for Hit Detection
    raycaster.setFromCamera(screenCenter, camera);
    const intersects = raycaster.intersectObjects(window.zombieMeshes || [], true);
    
    if (intersects.length > 0) {
        let hit = intersects[0].object;
        // Trace back to parent if we hit a sub-mesh (GLTF model parts)
        while(hit.parent && !hit.userData.takeDamage) {
            hit = hit.parent;
        }
        if (hit.userData && hit.userData.takeDamage) {
            hit.userData.takeDamage(35); // 3-shot kill for normal zombies
            logAction("Hit!", "text-yellow-400");
        }
    }
}

window.takeDamage = function(amt) {
    if (playerStats.isDead) return;
    playerStats.health -= amt;
    
    // Screen Blood Flash
    const flash = document.getElementById('damage-flash');
    if(flash) { 
        flash.classList.add('damage-active'); 
        setTimeout(() => flash.classList.remove('damage-active'), 200); 
    }
    
    if(playerStats.health <= 0) {
        playerStats.health = 0;
        playerStats.isDead = true;
        if (!isMobile) document.exitPointerLock();
        logAction("YOU DIED", "text-red-600 font-black");
    }
    updateHUD();
};

function updateHUD() {
    const hpBar = document.getElementById('hud-health');
    if(hpBar) hpBar.style.width = (playerStats.health / playerStats.maxHealth * 100) + '%';
    
    const ammoDisplays = document.querySelectorAll('.font-mono');
    ammoDisplays.forEach(el => {
        if(el.innerHTML.includes('/')) el.innerHTML = `${playerStats.ammo} <span class="text-xs md:text-lg text-gray-500">/ ${playerStats.maxAmmo}</span>`;
    });
}

function logAction(msg, colorClass) {
    const feed = document.getElementById('kill-feed');
    if (feed) {
        const p = document.createElement('p');
        p.className = colorClass;
        p.innerText = msg;
        feed.appendChild(p);
        if (feed.children.length > 3) feed.removeChild(feed.firstChild);
    }
}

// ==========================================
// MASTER UPDATE LOOP (Runs at 60+ FPS)
// ==========================================
window.updatePlayer = function(delta) {
    if (!camera || playerStats.isDead) {
        // Death camera fall effect
        if (camera && camera.position.y > 0.2) camera.position.y -= delta * 5;
        return;
    }

    // 1. Gravity & Friction (Delta-time optimized)
    velocity.y -= 12.0 * delta; // Slightly heavier gravity for realistic falling
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveF) - Number(moveB);
    direction.x = Number(moveR) - Number(moveL);
    direction.normalize(); // Prevent fast diagonal movement

    // 2. Sprinting & Dynamic FOV
    const speed = isRunning ? playerStats.baseSpeed * playerStats.sprintMultiplier : playerStats.baseSpeed;
    const targetFOV = (isRunning && moveF) ? SPRINT_FOV : BASE_FOV;
    camera.fov += (targetFOV - camera.fov) * 10 * delta; // Smooth zoom in/out
    camera.updateProjectionMatrix();

    if (moveF || moveB) velocity.z -= direction.z * 50.0 * delta;
    if (moveL || moveR) velocity.x -= direction.x * 50.0 * delta;

    // 3. Apply Velocity to Camera
    camera.translateX(-velocity.x * delta * speed);
    camera.translateZ(velocity.z * delta * speed);
    camera.position.y += velocity.y * delta;

    // 4. Floor Collision & Head Bobbing
    if (camera.position.y < 1.6) { 
        velocity.y = 0; 
        camera.position.y = 1.6; 
        canJump = true; 
        
        // Head Bobbing Logic (Only when touching the ground and moving)
        if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.z) > 0.1) {
            headBobTimer += delta * (isRunning ? 12 : 8);
            camera.position.y = 1.6 + Math.sin(headBobTimer) * 0.08;
        } else {
            headBobTimer = 0;
        }
    }

    // 5. Smooth Recoil Recovery
    if (recoilAmount > 0) {
        euler.setFromQuaternion(camera.quaternion);
        euler.x += recoilAmount * delta * 10; // Kick camera up
        camera.quaternion.setFromEuler(euler);
        recoilAmount -= delta * 1.5; // Recover slowly
        if(recoilAmount < 0) recoilAmount = 0;
    }
};

initPlayerControls();

