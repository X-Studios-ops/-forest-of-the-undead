import * as THREE from 'three';

// ==========================================
// 1. ENGINE IMPORTS
// ==========================================
import { initRenderer, resizeRenderer } from './engine/renderer.js';
import { initScene } from './engine/scene.js';
import { initLighting, updateLighting } from './engine/lighting.js';

// ==========================================
// 2. PLAYER IMPORTS
// ==========================================
import { initCamera } from './player/camera.js';
import { initControls, updatePlayer } from './player/controls.js';

// ==========================================
// 3. ENVIRONMENT & ENEMY IMPORTS
// ==========================================
import { initMap } from './environment/map.js';
import { initEnemies, updateEnemies } from './enemy/enemyAI.js';

// Global Variables
let scene, camera, renderer, clock;
let gameActive = false;

function initEngine() {
    console.log("Initializing Project: NIGHTFALL Engine...");

    clock = new THREE.Clock();

    // --- A. Core Engine Setup ---
    scene = initScene();
    camera = initCamera();
    renderer = initRenderer();
    initLighting(scene);

    // --- B. World, Player & Enemy Setup ---
    initMap(scene);
    initControls(camera);
    initEnemies(scene); // Zombies yahan load honge

    // --- C. Window Events ---
    window.addEventListener('resize', () => resizeRenderer(camera, renderer), false);
}

// ==========================================
// GAME LOOP (Physics & Rendering)
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    if (gameActive) {
        // Delta time clamped to 0.1s to prevent physics bugs during lag
        const delta = Math.min(clock.getDelta(), 0.1); 

        // Update all modules
        updatePlayer(delta, camera);
        updateLighting(camera); // Ensures tactical flashlight follows camera
        updateEnemies(delta, camera.position); // Zombies ko player ki taraf move karega
        
    } else {
        // Keep clock ticking when paused so time doesn't jump massively
        if (clock) clock.getDelta(); 
    }

    // Render Scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// ==========================================
// GAME STATE TRIGGERS (Connected to index.html)
// ==========================================
window.addEventListener('gameStart', () => {
    if (!scene) {
        initEngine();
        animate();
    }
    gameActive = true;
});

// Auto-Pause when PC player presses ESC
document.addEventListener('pointerlockchange', () => {
    const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (!isMobile) {
        gameActive = (document.pointerLockElement === document.body);
    }
});
