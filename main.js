// ==========================================
// main.js - CORE GAME ENGINE (Three.js)
// ==========================================

// Global Variables (Taaki dusri files inko use kar sakein)
window.scene = null;
window.camera = null;
window.renderer = null;
window.clock = new THREE.Clock(); // Time tracking ke liye (animations/physics)
window.gameActive = false; // Check if game is running

// Initialize Core Engine
function initEngine() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020302); // Pitch dark scary background
    
    // Spooky Fog (Door ka view hide karne ke liye - horror feel)
    scene.fog = new THREE.FogExp2(0x020302, 0.04);

    // 2. Camera Setup (First Person View)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0); // Eye level (1.6 meters)

    // 3. Renderer Setup (Graphics Quality)
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance optimize for low-end PCs
    renderer.shadowMap.enabled = true; // Shadows enable kar rahe hain horror ke liye
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Attach to HTML Canvas Container
    document.getElementById('game-canvas').appendChild(renderer.domElement);

    // 4. Lighting (Horror Atmosphere)
    setupLighting();

    // 5. Temporary Floor (Jab tak environment.js nahi banta)
    setupTempEnvironment();

    // 6. Handle Window Resize
    window.addEventListener('resize', onWindowResize, false);
}

// Horror Lighting Setup
function setupLighting() {
    // Ambient Light (Ekdum halki roshni)
    const ambientLight = new THREE.AmbientLight(0x1a261a, 0.4); 
    scene.add(ambientLight);

    // Moonlight (Directional Light with Shadows)
    const moonLight = new THREE.DirectionalLight(0x445588, 0.6);
    moonLight.position.set(50, 100, 50);
    moonLight.castShadow = true;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 150;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    scene.add(moonLight);

    // Player Flashlight/Aura (Attached to camera later in playerControls.js)
    window.playerLight = new THREE.PointLight(0xffddaa, 1, 15);
    playerLight.position.set(0, 1.6, 0);
    scene.add(playerLight);
}

// Temporary Floor (Jab tak environment.js nahi banate)
function setupTempEnvironment() {
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x0c120c, 
        roughness: 0.9,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2; // Flat on ground
    floor.receiveShadow = true;
    scene.add(floor);
}

// Resize Canvas on Window Resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ==========================================
// MAIN GAME LOOP (Physics & Rendering)
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    if (window.gameActive) {
        const delta = clock.getDelta(); // Time between frames

        // Baaki modules ke update functions yahan call honge:
        // if (window.updatePlayer) window.updatePlayer(delta);
        // if (window.updateEnemies) window.updateEnemies(delta);

        // Flashlight follows camera
        playerLight.position.copy(camera.position);
    }

    // Render Scene
    renderer.render(scene, camera);
}

// ==========================================
// POINTER LOCK & START LOGIC
// ==========================================

// Override HTML's startGame function
window.startGame = function() {
    const name = document.getElementById('player-name-input').value || 'Hero';
    document.getElementById('hud-name').innerText = name;
    
    // Hide UI
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('ui-layer').classList.remove('hidden');
    document.getElementById('ui-layer').classList.add('flex');
    
    // Initialize Engine if not done yet
    if (!scene) {
        initEngine();
        animate(); // Start the loop
    }

    // Lock Mouse Pointer (FPS Style)
    document.body.requestPointerLock();
};

// Handle ESC key (Pause Game)
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === document.body) {
        window.gameActive = true;
        document.getElementById('ui-layer').classList.remove('opacity-50');
    } else {
        window.gameActive = false; // Paused
        document.getElementById('ui-layer').classList.add('opacity-50');
        // Tu chahe toh yahan ek "PAUSED" UI dikha sakta hai
    }
});

