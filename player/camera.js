import * as THREE from 'three';

export function initCamera() {
    // Default FOV 75 for tactical shooters
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Set to average player height
    camera.position.set(0, 1.6, 0); 
    
    return camera;
}

