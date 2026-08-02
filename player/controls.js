import * as THREE from 'three';

// Player Stats & State
export const playerStats = {
    health: 100,
    maxHealth: 100,
    ammo: 30,
    maxAmmo: 120,
    isDead: false
};

const state = {
    moveF: false, moveB: false, moveL: false, moveR: false,
    canJump: true,
    isSprinting: false,
    isCrouching: false,
    isADS: false
};

// Physics Variables
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const baseHeight = 1.6;
const crouchHeight = 1.0;
let currentHeight = baseHeight;

// Settings
const speedWalk = 5.0;
const speedSprint = 8.0;
const speedCrouch = 2.5;
const jumpPower = 4.5;
const gravity = 15.0;

// Head Bobbing Variables
let bobTimer = 0;

// Mobile Tracking
let leftTouchId = null;
let rightTouchId = null;
let lastTouchX = 0;
let lastTouchY = 0;
let joyStartX = 0;
let joyStartY = 0;

export function initControls(camera) {
    const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    if (isMobile) {
        setupMobileControls(camera);
    } else {
        setupPCControls(camera);
    }
    
    // Weapon Firing (Will hook up to enemy raycasting later)
    const shootAction = () => {
        if (playerStats.ammo > 0 && !playerStats.isDead) {
            playerStats.ammo--;
            updateHUD();
            triggerShootEffect(camera);
            // Dispatch event so main.js/enemyAI can handle hit detection
            window.dispatchEvent(new Event('playerFired')); 
        }
    };
    
    document.addEventListener('mousedown', (e) => {
        if (e.button === 0 && document.pointerLockElement === document.body) shootAction();
    });
    
    const btnShoot = document.getElementById('btn-shoot');
    if (btnShoot) btnShoot.addEventListener('touchstart', (e) => { e.preventDefault(); shootAction(); });
}

function setupPCControls(camera) {
    document.addEventListener('keydown', (e) => {
        if (playerStats.isDead) return;
        switch(e.code) {
            case 'KeyW': state.moveF = true; break;
            case 'KeyS': state.moveB = true; break;
            case 'KeyA': state.moveL = true; break;
            case 'KeyD': state.moveR = true; break;
            case 'ShiftLeft': state.isSprinting = true; state.isCrouching = false; break;
            case 'KeyC': state.isCrouching = !state.isCrouching; state.isSprinting = false; break;
            case 'Space': 
                if (state.canJump && !state.isCrouching) {
                    velocity.y = jumpPower; 
                    state.canJump = false;
                }
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.code) {
            case 'KeyW': state.moveF = false; break;
            case 'KeyS': state.moveB = false; break;
            case 'KeyA': state.moveL = false; break;
            case 'KeyD': state.moveR = false; break;
            case 'ShiftLeft': state.isSprinting = false; break;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body && !playerStats.isDead) {
            euler.setFromQuaternion(camera.quaternion);
            // Dynamic sensitivity: Lower if ADS (Aim Down Sights)
            const sens = state.isADS ? 0.001 : 0.002;
            euler.y -= e.movementX * sens;
            euler.x -= e.movementY * sens;
            // Clamp vertical look to 90 degrees straight up/down
            euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x));
            camera.quaternion.setFromEuler(euler);
        }
    });
    
    // Right click to ADS
    document.addEventListener('mousedown', (e) => { if(e.button === 2) state.isADS = true; });
    document.addEventListener('mouseup', (e) => { if(e.button === 2) state.isADS = false; });
}

function setupMobileControls(camera) {
    const leftZone = document.getElementById('left-joystick-zone');
    const rightZone = document.getElementById('right-aim-zone');

    // Virtual Joystick Logic
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
                
                // Convert raw touch distance to forward/strafe inputs
                state.moveF = dy < -20;
                state.moveB = dy > 20;
                state.moveL = dx < -20;
                state.moveR = dx > 20;
                
                // Auto-sprint if pushing stick far up
                state.isSprinting = dy < -60 && !state.isCrouching;
            }
        }
    });

    const resetLeftJoy = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === leftTouchId) {
                leftTouchId = null;
                state.moveF = state.moveB = state.moveL = state.moveR = state.isSprinting = false;
            }
        }
    };
    leftZone.addEventListener('touchend', resetLeftJoy);
    leftZone.addEventListener('touchcancel', resetLeftJoy);

    // Aiming Logic
    rightZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        rightTouchId = touch.identifier;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
    });

    rightZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (playerStats.isDead) return;
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === rightTouchId) {
                const touch = e.changedTouches[i];
                const dx = touch.clientX - lastTouchX;
                const dy = touch.clientY - lastTouchY;
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
                
                euler.setFromQuaternion(camera.quaternion);
                const sens = state.isADS ? 0.0015 : 0.0035;
                euler.y -= dx * sens;
                euler.x -= dy * sens;
                euler.x = Math.max(-1.5, Math.min(1.5, euler.x));
                camera.quaternion.setFromEuler(euler);
            }
        }
    });

    const resetRightJoy = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === rightTouchId) rightTouchId = null;
        }
    };
    rightZone.addEventListener('touchend', resetRightJoy);
    rightZone.addEventListener('touchcancel', resetRightJoy);

    // Mobile Action Buttons
    const bindBtn = (id, action) => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('touchstart', (e) => { e.preventDefault(); action(); });
    };
    
    bindBtn('btn-jump', () => { if(state.canJump && !state.isCrouching) { velocity.y = jumpPower; state.canJump = false; }});
    bindBtn('btn-crouch', () => { state.isCrouching = !state.isCrouching; state.isSprinting = false; });
    
    // Hold to ADS on mobile
    const adsBtn = document.getElementById('btn-ads');
    if(adsBtn) {
        adsBtn.addEventListener('touchstart', (e) => { e.preventDefault(); state.isADS = true; });
        adsBtn.addEventListener('touchend', (e) => { e.preventDefault(); state.isADS = false; });
    }
}

export function updatePlayer(delta, camera) {
    if (!camera || playerStats.isDead) return;

    // Apply Friction and Gravity
    velocity.y -= gravity * delta;
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    // Determine current speed based on stance
    let activeSpeed = state.isCrouching ? speedCrouch : (state.isSprinting ? speedSprint : speedWalk);
    if (state.isADS) activeSpeed = speedCrouch; // Slow down while aiming

    direction.z = Number(state.moveF) - Number(state.moveB);
    direction.x = Number(state.moveR) - Number(state.moveL);
    direction.normalize(); // Ensure diagonal movement isn't faster

    if (state.moveF || state.moveB) velocity.z -= direction.z * 50.0 * delta;
    if (state.moveL || state.moveR) velocity.x -= direction.x * 50.0 * delta;

    // Tactical Camera FOV shifting (Zoom in for ADS, Pull back for Sprint)
    let targetFOV = 75;
    if (state.isADS) targetFOV = 50;
    else if (state.isSprinting && (state.moveF || state.moveL || state.moveR)) targetFOV = 85;
    camera.fov += (targetFOV - camera.fov) * 10 * delta;
    camera.updateProjectionMatrix();

    // Smooth Crouch Transition
    const targetHeight = state.isCrouching ? crouchHeight : baseHeight;
    currentHeight += (targetHeight - currentHeight) * 10 * delta;

    // Apply Movement
    camera.translateX(-velocity.x * delta * activeSpeed);
    camera.translateZ(velocity.z * delta * activeSpeed);
    camera.position.y += velocity.y * delta;

    // Floor Collision / Jump Reset
    if (camera.position.y < currentHeight) { 
        velocity.y = 0; 
        camera.position.y = currentHeight; 
        state.canJump = true; 
    }

    // Head Bobbing Effect (Resident Evil Atmosphere)
    if ((state.moveF || state.moveB || state.moveL || state.moveR) && state.canJump) {
        bobTimer += delta * (state.isSprinting ? 12 : 8);
        const bobAmplitude = state.isSprinting ? 0.08 : 0.04;
        camera.position.y = currentHeight + Math.sin(bobTimer) * bobAmplitude;
    } else {
        bobTimer = 0;
    }
}

// Visual Effects & UI
function triggerShootEffect(camera) {
    // Slight upward recoil
    euler.setFromQuaternion(camera.quaternion);
    euler.x += (Math.random() * 0.02 + 0.01);
    camera.quaternion.setFromEuler(euler);
}

function updateHUD() {
    const ammoEl = document.getElementById('ammo-current');
    if (ammoEl) ammoEl.innerText = playerStats.ammo;
}

