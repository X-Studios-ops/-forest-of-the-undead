import * as THREE from 'three';

export function initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    
    // Horror FogExp2 - objects gradually fade into darkness
    scene.fog = new THREE.FogExp2(0x020202, 0.04);
    
    return scene;
}

