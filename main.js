
import { initRenderer, resizeRenderer } from './engine/renderer.js';
import { initScene } from './engine/scene.js';
import { initLighting } from './engine/lighting.js';
// import { initPlayer, updatePlayer } from './player/player.js'; // Aage add karenge
import * as THREE from 'three';

let scene, camera, renderer, clock;
let gameActive = false;

function init() {
    console.log("Initializing Project: NIGHTFALL Architecture...");
    
    clock = new THREE.Clock();
    scene = initScene();
    renderer = initRenderer();
    
    // Temporary camera setup (Will move to player/camera.js later)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0);
    
    initLighting(scene, camera);

    window.addEventListener('resize', () => resizeRenderer(camera), false);
}

function animate() {
    requestAnimationFrame(animate);

    if (gameActive) {
        const delta = Math.min(clock.getDelta(), 0.1);
        
        // updatePlayer(delta);
        // updateEnemies(delta); // Jab enemy folder banega
    } else {
        if(clock) clock.getDelta(); // Keep time stable while paused
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// UI Triggers (Connected to index.html Deploy Button)
window.addEventListener('gameStart', () => {
    if (!scene) {
        init();
        animate();
    }
    gameActive = true;
});

// Auto-pause when escaping PC pointer lock
document.addEventListener('pointerlockchange', () => {
    const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (!isMobile) gameActive = (document.pointerLockElement === document.body);
});
