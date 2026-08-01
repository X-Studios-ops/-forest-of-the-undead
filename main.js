window.scene = null;
window.camera = null;
window.renderer = null;
window.gltfLoader = null;
window.clock = new THREE.Clock();
window.gameActive = false;

function initEngine() {
    window.gltfLoader = new THREE.GLTFLoader();
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020302);
    scene.fog = new THREE.FogExp2(0x020302, 0.035);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0);

    const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2)); // Fix lag on mobile
    renderer.shadowMap.enabled = !isMobile; // Turn off shadow on mobile for 60 FPS

    document.getElementById('game-canvas').appendChild(renderer.domElement);
    setupLighting();
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x1a261a, 0.5);
    scene.add(ambientLight);

    window.playerLight = new THREE.PointLight(0xffddaa, 1, 12);
    playerLight.position.set(0, 1.6, 0);
    scene.add(playerLight);
}

function animate() {
    requestAnimationFrame(animate);
    if (window.gameActive) {
        const delta = clock.getDelta();
        if (window.updatePlayer) window.updatePlayer(delta);
        if (window.updateEnemies) window.updateEnemies(delta);
        if (window.updateEnvironment) window.updateEnvironment();
        playerLight.position.copy(camera.position);
    }
    renderer.render(scene, camera);
}

window.animate = animate;
window.initEngine = initEngine;

document.addEventListener('pointerlockchange', () => {
    window.gameActive = (document.pointerLockElement === document.body);
});
