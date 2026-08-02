import * as THREE from 'three';

export function initRenderer() {
    const renderer = new THREE.WebGLRenderer({ 
        antialias: false, 
        powerPreference: "high-performance" 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Cap pixel ratio to 1.5 to save mid-range GPUs from lagging
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    
    const canvasContainer = document.getElementById('game-canvas');
    if (canvasContainer) {
        canvasContainer.appendChild(renderer.domElement);
    }
    
    return renderer;
}

export function resizeRenderer(camera, renderer) {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
