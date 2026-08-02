// ==========================================
// main.js - CORE GAME ENGINE (Three.js)
// ==========================================

// Global Variables
window.scene = null;
window.camera = null;
window.renderer = null;
window.gltfLoader = null;
window.clock = new THREE.Clock();
window.gameActive = false;
window.playerLight = null;

// Initialize Core Engine
function initEngine() {
    console.log("Initializing Game Engine...");
    
    // Global 3D Model Loader setup
    window.gltfLoader = new THREE.GLTFLoader();
    
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020302); // Pitch dark scary background
    scene.fog = new THREE.FogExp2(0x020302, 0.035); // Horror fog

    // 2. Camera Setup (First Person View)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0);

    // 3. Renderer Setup (Graphics Quality & Mobile Optimization)
    const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // PERFORMANCE FIX: Pixel ratio 1 for mobile to remove lag
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2)); 
    renderer.shadowMap.enabled = !isMobile; // Shadows off on mobile for smooth 60 FPS
    if (!isMobile) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Attach to HTML Canvas Container
    document.getElementById('game-canvas').appendChild(renderer.domElement);

    // 4. Lighting Setup (With Black Screen Fix)
    setupLighting();

    // 5. Handle Window Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ==========================================
    // 6. FIX FOR BLACK SCREEN (LOAD ASSETS INSTANTLY)
    // ==========================================
    if (typeof buildEnvironment === "function") {
        buildEnvironment();
    }
    if (typeof spawnHorde === "function") {
        // Spawn initial horde (10 zombies, safely away from player spawn point)
        spawnHorde(10, 0, -30); 
    }
}

// Horror Lighting Setup (FAILSAFE BRIGHT LIGHTING)
function setupLighting() {
    // Thoda sa grey fog taaki pitch black na ho
    scene.background = new THREE.Color(0x050505); 
    scene.fog = new THREE.FogExp2(0x050505, 0.02);

    // HemisphereLight: Asmaan se safed aur zameen se dark roshni aayegi (100% visible)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2.0);
    scene.add(hemiLight);

    // Player Flashlight
    window.playerLight = new THREE.PointLight(0xffeedd, 2.0, 35);
    playerLight.position.set(0, 1.6, 0);
    scene.add(playerLight);
}
// ==========================================
// MAIN GAME LOOP (Physics & Rendering)
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    if (window.gameActive) {
        const delta = clock.getDelta(); // Time between frames

        // Call module update functions safely
        if (window.updatePlayer) window.updatePlayer(delta);
        if (window.updateEnemies) window.updateEnemies(delta);
        if (window.updateEnvironment) window.updateEnvironment();

        // Flashlight follows camera
        if (window.playerLight && window.camera) {
            window.playerLight.position.copy(camera.position);
        }
    } else {
        // Even if paused, keep tracking time so delta doesn't jump massively when unpaused
        clock.getDelta(); 
    }

    // Render Scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Attach to global window object so index.html can call it
window.initEngine = initEngine;
window.animate = animate;

// ==========================================
// PAUSE / POINTER LOCK LOGIC (For PC)
// ==========================================
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === document.body) {
        window.gameActive = true;
    } else {
        // Only pause on PC when ESC is pressed. Mobile doesn't use pointer lock.
        const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        if (!isMobile) {
            window.gameActive = false; 
        }
    }
});
