import * as THREE from 'three';

// ==========================================
// MODULE IMPORTS (Naye folders se)
// ==========================================
import { initMap } from './environment/map.js';
import { initControls, updatePlayer } from './player/controls.js';
// import { initEnemies, updateEnemies } from './enemy/enemyAI.js'; // Ise aage add karenge

// Global Engine Variables
let scene, camera, renderer, clock, playerLight;
let gameActive = false;

function initEngine() {
    console.log("Initializing Project: NIGHTFALL Architecture...");
    
    // 1. Scene Setup (Resident Evil Dark Vibe)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    // Medium fog to keep performance high and hide far-away unrendered objects
    scene.fog = new THREE.FogExp2(0x020202, 0.04); 

    // 2. Camera Setup (Modern Warfare Base FOV)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0);

    // 3. Renderer Setup (Vercel/Browser Medium Graphics Optimization)
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Cap pixel ratio to 1.5 max so it doesn't fry mid-range GPUs
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
    document.getElementById('game-canvas').appendChild(renderer.domElement);

    // 4. Lighting (Dim ambient + Tactical Flashlight)
    const hemiLight = new THREE.HemisphereLight(0x444455, 0x111111, 0.5); 
    scene.add(hemiLight);

    playerLight = new THREE.PointLight(0xffeedd, 1.5, 25);
    scene.add(playerLight);

    // 5. Utilities
    clock = new THREE.Clock();

    // ==========================================
    // INITIALIZE YOUR MODULES HERE
    // ==========================================
    initMap(scene);          // Map, ped (trees), aur boss arena load karega
    initControls(camera);    // Player ki movement aur aiming load karega
    // initEnemies(scene);   // Zombies load karne ke liye aage aayega

    // 6. Handle Window Resize
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (gameActive) {
        // BUG FIX: Clamped delta time so physics don't break if frame drops
        const delta = Math.min(clock.getDelta(), 0.1); 

        // Tactical Flashlight strictly follows weapon/camera aim
        if (playerLight && camera) {
            playerLight.position.copy(camera.position);
            // Slight offset so it acts like a gun-barrel light, not a headlamp
            const lightOffset = new THREE.Vector3(0.3, -0.2, -0.5);
            lightOffset.applyQuaternion(camera.quaternion);
            playerLight.position.add(lightOffset);
        }

        // ==========================================
        // UPDATE YOUR MODULES HERE (Physics Loop)
        // ==========================================
        updatePlayer(delta, camera);  // Player sprinting, crouching, bobbing
        // updateEnemies(delta, camera.position); 

    } else {
        // Keep clock ticking when paused so time doesn't jump massively when unpaused
        if (clock) clock.getDelta(); 
    }

    // Render Final Scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// ==========================================
// EVENT LISTENERS (UI & Pointer Lock)
// ==========================================

// Connects to index.html Deploy Button
window.addEventListener('gameStart', () => {
    if (!scene) {
        initEngine();
        animate();
    }
    gameActive = true;
});

// Auto-Pause Logic (For PC Pointer Lock)
document.addEventListener('pointerlockchange', () => {
    const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (!isMobile) {
        // Agar Pointer Lock lag gaya toh true, nahi toh false (Pause)
        gameActive = (document.pointerLockElement === document.body); 
    }
});
