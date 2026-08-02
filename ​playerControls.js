import * as THREE from 'three';

export const playerStats = { health: 100, maxHealth: 100, ammo: 30, maxAmmo: 120, isDead: false };

const state = { moveF: false, moveB: false, moveL: false, moveR: false, canJump: true, isReloading: false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
let leftTouchId = null, rightTouchId = null, lastTouchX = 0, lastTouchY = 0, joyStartX = 0, joyStartY = 0;

export function initControls(camera) {
    setupMobileControls(camera);

    // Shooting
    const shootAction = () => {
        if (playerStats.ammo > 0 && !state.isReloading && !playerStats.isDead) {
            playerStats.ammo--;
            updateHUD();
            // Recoil
            euler.setFromQuaternion(camera.quaternion);
            euler.x += 0.015;
            camera.quaternion.setFromEuler(euler);
            window.dispatchEvent(new Event('playerFired')); 
        }
    };
    
    // Reloading
    const reloadAction = () => {
        if (state.isReloading || playerStats.ammo === 30 || playerStats.maxAmmo <= 0) return;
        state.isReloading = true;
        
        const ammoCurrentEl = document.getElementById('ammo-current');
        if (ammoCurrentEl) ammoCurrentEl.innerText = "RLD"; // Show reloading text
        
        setTimeout(() => {
            const needed = 30 - playerStats.ammo;
            const toTake = Math.min(needed, playerStats.maxAmmo);
            playerStats.ammo += toTake;
            playerStats.maxAmmo -= toTake;
            state.isReloading = false;
            updateHUD();
        }, 1500); // 1.5 seconds reload time
    };

    document.getElementById('btn-shoot')?.addEventListener('touchstart', (e) => { e.preventDefault(); shootAction(); });
    document.getElementById('btn-reload')?.addEventListener('touchstart', (e) => { e.preventDefault(); reloadAction(); });
}

function setupMobileControls(camera) {
    const leftZone = document.getElementById('left-joystick-zone');
    const rightZone = document.getElementById('right-aim-zone');

    // Movement (Left Stick)
    leftZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        leftTouchId = touch.identifier;
        joyStartX = touch.clientX;
        joyStartY = touch.clientY;
    });

    leftZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === leftTouchId) {
                const touch = e.changedTouches[i];
                const dx = touch.clientX - joyStartX;
                const dy = touch.clientY - joyStartY;
                
                state.moveF = dy < -10;
                state.moveB = dy > 10;
                state.moveL = dx < -10;
                state.moveR = dx > 10;
            }
        }
    });

    const resetLeftJoy = () => { state.moveF = state.moveB = state.moveL = state.moveR = false; leftTouchId = null; };
    leftZone.addEventListener('touchend', resetLeftJoy);
    leftZone.addEventListener('touchcancel', resetLeftJoy);

    // Aiming (Right Stick)
    rightZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        rightTouchId = touch.identifier;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
    });

    rightZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === rightTouchId) {
                const touch = e.changedTouches[i];
                const dx = touch.clientX - lastTouchX;
                const dy = touch.clientY - lastTouchY;
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
                
                euler.setFromQuaternion(camera.quaternion);
                euler.y -= dx * 0.0035;
                euler.x -= dy * 0.0035;
                euler.x = Math.max(-1.5, Math.min(1.5, euler.x));
                camera.quaternion.setFromEuler(euler);
            }
        }
    });

    const resetRightJoy = () => { rightTouchId = null; };
    rightZone.addEventListener('touchend', resetRightJoy);
}

export function updatePlayer(delta, camera) {
    if (!camera || playerStats.isDead) return;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 15.0 * delta; // Gravity

    direction.z = Number(state.moveF) - Number(state.moveB);
    direction.x = Number(state.moveR) - Number(state.moveL);
    direction.normalize();

    const speed = 6.0;
    if (state.moveF || state.moveB) velocity.z -= direction.z * 50.0 * delta;
    if (state.moveL || state.moveR) velocity.x -= direction.x * 50.0 * delta;

    camera.translateX(-velocity.x * delta * speed);
    camera.translateZ(velocity.z * delta * speed);
    camera.position.y += velocity.y * delta;

    // Floor collision
    if (camera.position.y < 1.6) {
        velocity.y = 0;
        camera.position.y = 1.6;
    }
}

function updateHUD() {
    const current = document.getElementById('ammo-current');
    const reserve = document.getElementById('ammo-reserve');
    if(current) current.innerText = playerStats.ammo;
    if(reserve) reserve.innerText = playerStats.maxAmmo;
}
