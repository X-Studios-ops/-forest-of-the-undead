import * as THREE from 'three';

export function initScene() {
    const scene = new THREE.Scene();
    
    // Pitch dark aesthetic
    scene.background = new THREE.Color(0x020202);
    
    // Thick fog to hide unrendered objects and build tension
    scene.fog = new THREE.FogExp2(0x020202, 0.04);
    
    return scene;
}
