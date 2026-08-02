// ==========================================
// playerControls.js - MOBILE STUCK FIX
// ==========================================

window.playerStats = { health: 100, maxHealth: 100, ammo: 30, maxAmmo: 120, speed: 6.0, jumpPower: 4.5, isDead: false };

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);

let moveF = false, moveB = false, moveL = false, moveR = false, canJump = true;
let isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);

function initPlayerControls() {
    if (isMobile) setupMobileControls();
    else setupPCControls();
}

function setupMobileControls() {
    const bind = (id, downAction, upAction) => {
        const el = document.getElementById(id);
        if(!el) return;
        el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); downAction(); }, {passive:false});
        el.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); upAction(); }, {passive:false});
    };

    bind('btn-up', () => moveF = true, () => moveF = false);
    bind('btn-down', () => moveB = true, () => moveB = false);
    bind('btn-left', () => moveL = true, () => moveL = false);
    bind('btn-right', () => moveR = true, () => moveR = false);
    bind('btn-jump', () => { if(canJump){ velocity.y = playerStats.jumpPower; canJump=false; } }, () => {});
    bind('btn-shoot', () => shootWeapon(), () => {});

    let lastX = 0, lastY = 0;
    const lookArea = document.getElementById('touch-look-area');
    if(lookArea) {
        lookArea.addEventListener('touchstart', (e) => { lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }, {passive:false});
        lookArea.addEventListener('touchmove', (e) => {
            if (playerStats.isDead) return;
            let dx = e.touches[0].clientX - lastX;
            let dy = e.touches[0].clientY - lastY;
            lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
            
            euler.setFromQuaternion(camera.quaternion);
            euler.y -= dx * 0.0035;
            euler.x -= dy * 0.0035;
            euler.x = Math.max(-1.5, Math.min(1.5, euler.x));
            camera.quaternion.setFromEuler(euler);
        }, {passive:false});
    }
}

function setupPCControls() {
    document.addEventListener('keydown', (e) => {
        switch(e.code) { case 'KeyW': moveF=true; break; case 'KeyS': moveB=true; break; case 'KeyA': moveL=true; break; case 'KeyD': moveR=true; break; case 'Space': if(canJump){velocity.y=playerStats.jumpPower;canJump=false;} break; }
    });
    document.addEventListener('keyup', (e) => {
        switch(e.code) { case 'KeyW': moveF=false; break; case 'KeyS': moveB=false; break; case 'KeyA': moveL=false; break; case 'KeyD': moveR=false; break; }
    });
    document.addEventListener('mousemove', (e) => {
        if (!window.gameActive) return;
        euler.setFromQuaternion(camera.quaternion);
        euler.y -= e.movementX * 0.002;
        euler.x -= e.movementY * 0.002;
        euler.x = Math.max(-1.5, Math.min(1.5, euler.x));
        camera.quaternion.setFromEuler(euler);
    });
    document.addEventListener('mousedown', (e) => { if (e.button === 0) shootWeapon(); });
}

function shootWeapon() {
    if (playerStats.ammo <= 0) return;
    playerStats.ammo--;
    document.querySelector('.font-mono').innerHTML = `${playerStats.ammo} <span class="text-xs text-gray-500">/ ${playerStats.maxAmmo}</span>`;
    
    raycaster.setFromCamera(screenCenter, camera);
    const intersects = raycaster.intersectObjects(window.zombieMeshes || [], true);
    if (intersects.length > 0) {
        let hit = intersects[0].object;
        while(hit.parent && !hit.userData.takeDamage) hit = hit.parent;
        if (hit.userData && hit.userData.takeDamage) hit.userData.takeDamage(35);
    }
}

window.takeDamage = function(amt) {
    if (playerStats.isDead) return;
    playerStats.health -= amt;
    document.getElementById('hud-health').style.width = Math.max(0, (playerStats.health / playerStats.maxHealth * 100)) + '%';
    
    const flash = document.getElementById('damage-flash');
    if(flash) { flash.classList.add('damage-active'); setTimeout(() => flash.classList.remove('damage-active'), 200); }
    if(playerStats.health <= 0) playerStats.isDead = true;
};

window.updatePlayer = function(delta) {
    if (!camera || playerStats.isDead || !window.gameActive) return;

    velocity.y -= 12.0 * delta;
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveF) - Number(moveB);
    direction.x = Number(moveR) - Number(moveL);
    direction.normalize();

    if (moveF || moveB) velocity.z -= direction.z * 50.0 * delta;
    if (moveL || moveR) velocity.x -= direction.x * 50.0 * delta;

    camera.translateX(-velocity.x * delta * playerStats.speed);
    camera.translateZ(velocity.z * delta * playerStats.speed);
    camera.position.y += velocity.y * delta;

    if (camera.position.y < 1.6) { 
        velocity.y = 0; 
        camera.position.y = 1.6; 
        canJump = true; 
    }
};

initPlayerControls();
