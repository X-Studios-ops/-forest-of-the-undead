// ==========================================
// enemyAI.js - GOD LEVEL AI (SWARM, STATES & ANIMATIONS)
// ==========================================

window.zombies = [];
window.zombieMeshes = [];
window.bossActive = false;
window.bossEntity = null;

class Zombie {
    constructor(x, z, isBoss = false) {
        this.isBoss = isBoss;
        this.health = isBoss ? 2500 : 100;
        this.maxHealth = this.health;
        this.baseSpeed = isBoss ? 2.5 : 1.2 + (Math.random() * 0.8);
        this.currentSpeed = this.baseSpeed;
        this.attackDamage = isBoss ? 35 : 15;
        this.attackRange = this.isBoss ? 3.5 : 2.0;
        
        // AI States
        this.state = 'idle'; // idle, chase, attack, stun, dead
        this.stunTimer = 0;
        this.attackCooldown = 0;
        this.isEnraged = false; // Boss only
        
        // Animation
        this.mixer = null;
        this.animations = {};
        this.currentAction = null;

        this.createMesh(x, z);
    }

    createMesh(x, z) {
        // Fallback Hitbox
        const geo = new THREE.CylinderGeometry(this.isBoss ? 1.5 : 0.6, this.isBoss ? 1.5 : 0.6, this.isBoss ? 3.5 : 1.8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: this.isBoss ? 0xff0000 : 0x2d4c1e, wireframe: true, visible: false });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(x, this.isBoss ? 1.75 : 0.9, z);
        
        // Store reference for raycaster
        this.mesh.userData = { parent: this, takeDamage: (amt, direction) => this.takeDamage(amt, direction) };
        window.scene.add(this.mesh);
        window.zombieMeshes.push(this.mesh);

        // Load Real 3D Model
        if (window.gltfLoader) {
            const file = this.isBoss ? 'boss.glb' : 'zombie.glb';
            window.gltfLoader.load(file, (gltf) => {
                const model = gltf.scene;
                model.scale.setScalar(this.isBoss ? 2.2 : 1.0);
                
                // Fix orientation if model faces wrong way
                model.position.y = this.isBoss ? -1.75 : -0.9; 
                
                // Shadows
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                this.mesh.add(model);

                // Animations Setup
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(model);
                    // Assume index 0: Walk/Run, Index 1: Attack, Index 2: Death (fallback to index 0 if not exist)
                    this.animations.walk = this.mixer.clipAction(gltf.animations[0]);
                    this.animations.attack = this.mixer.clipAction(gltf.animations[1] || gltf.animations[0]);
                    this.animations.death = this.mixer.clipAction(gltf.animations[2] || gltf.animations[0]);
                    
                    this.animations.death.clampWhenFinished = true;
                    this.animations.death.loop = THREE.LoopOnce;
                    
                    this.playAnimation('walk');
                }
            }, undefined, (err) => console.warn("Model missing, using invisible hitbox", err));
        }
    }

    playAnimation(name) {
        if (!this.mixer || !this.animations[name]) return;
        
        const action = this.animations[name];
        if (this.currentAction === action) return; // Already playing
        
        if (this.currentAction) {
            this.currentAction.fadeOut(0.3); // Crossfade for AAA smooth transition
        }
        
        action.reset();
        action.fadeIn(0.3);
        action.play();
        this.currentAction = action;
    }

    takeDamage(amt, hitDirection = new THREE.Vector3(0,0,0)) {
        if (this.state === 'dead') return;

        this.health -= amt;
        
        // Visual Hit Flash
        if (this.mesh.children.length > 0) {
            this.mesh.children[0].traverse((child) => {
                if (child.isMesh && child.material) {
                    const origColor = child.material.color.getHex();
                    child.material.color.setHex(0xffffff);
                    setTimeout(() => { if(this.state !== 'dead') child.material.color.setHex(origColor); }, 100);
                }
            });
        }

        if (this.health <= 0) {
            this.die();
            return;
        }

        // Boss Enrage Mechanic
        if (this.isBoss && this.health < this.maxHealth * 0.5 && !this.isEnraged) {
            this.enrage();
        }

        // Stun & Knockback Mechanics (Only for normal zombies to make them feel meaty)
        if (!this.isBoss && Math.random() > 0.3) {
            this.state = 'stun';
            this.stunTimer = 0.5; // Stunned for half a second
            this.playAnimation('idle'); // Pause walk animation
            
            // Push back slightly opposite to camera view
            if (window.camera) {
                const pushDir = new THREE.Vector3(0,0,-1).applyQuaternion(window.camera.quaternion).normalize();
                this.mesh.position.addScaledVector(pushDir, -0.5);
            }
        }

        // Update Boss UI
        if (this.isBoss) {
            document.getElementById('boss-ui').classList.remove('hidden');
            document.getElementById('boss-health').style.width = Math.max(0, (this.health / this.maxHealth) * 100) + '%';
        }
    }

    enrage() {
        this.isEnraged = true;
        this.currentSpeed = this.baseSpeed * 1.8;
        this.attackDamage = 50;
        
        if (window.logAction) window.logAction("QUEEN IS ENRAGED!", "text-red-500 font-black");
        
        // Add a red glow to boss
        const glow = new THREE.PointLight(0xff0000, 2, 10);
        this.mesh.add(glow);

        // Spawn minions
        spawnHorde(4, this.mesh.position.x, this.mesh.position.z + 5);
    }

    die() {
        this.state = 'dead';
        this.health = 0;
        this.playAnimation('death');
        
        // Remove from targetable arrays immediately
        const idx = window.zombieMeshes.indexOf(this.mesh);
        if (idx > -1) window.zombieMeshes.splice(idx, 1);
        
        if (this.isBoss) {
            document.getElementById('boss-ui').classList.add('hidden');
            if (window.logAction) window.logAction("BOSS DEFEATED! YOU SURVIVED.", "text-yellow-400 font-bold");
        } else {
            if (window.logAction) window.logAction("Kill confirmed.", "text-gray-500");
        }

        // Fallback visual if no animation
        if (!this.mixer) {
            this.mesh.rotation.x = -Math.PI / 2;
            this.mesh.position.y = 0.1;
        }

        // Sink into ground & remove after 5 seconds
        setTimeout(() => {
            const sinkInterval = setInterval(() => {
                this.mesh.position.y -= 0.05;
                if (this.mesh.position.y < -3) {
                    clearInterval(sinkInterval);
                    window.scene.remove(this.mesh);
                }
            }, 50);
        }, 5000);
    }

    update(delta, playerPos) {
        if (this.state === 'dead') {
            if (this.mixer) this.mixer.update(delta);
            return;
        }

        // Handle Stun State
        if (this.state === 'stun') {
            this.stunTimer -= delta;
            if (this.stunTimer <= 0) {
                this.state = 'chase';
                this.playAnimation('walk');
            }
            if (this.mixer) this.mixer.update(delta);
            return;
        }

        // Calculate Distance to Player
        const dx = playerPos.x - this.mesh.position.x;
        const dz = playerPos.z - this.mesh.position.z;
        const distanceToPlayer = Math.sqrt(dx*dx + dz*dz);
        
        // Face Player (Smooth rotation)
        const targetRot = Math.atan2(dx, dz);
        // Simple smoothing for rotation
        let angleDiff = targetRot - this.mesh.rotation.y;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        this.mesh.rotation.y += angleDiff * 5 * delta;

        // FSM Logic
        if (distanceToPlayer > this.attackRange) {
            this.state = 'chase';
            this.playAnimation('walk');

            // --- SWARM INTELLIGENCE (SEPARATION) ---
            let separationX = 0, separationZ = 0;
            let neighbors = 0;
            
            // Loop through other zombies to push away if too close
            for (let i = 0; i < window.zombies.length; i++) {
                const other = window.zombies[i];
                if (other === this || other.state === 'dead') continue;
                
                const ox = this.mesh.position.x - other.mesh.position.x;
                const oz = this.mesh.position.z - other.mesh.position.z;
                const distSq = ox*ox + oz*oz;
                
                if (distSq < 4.0) { // If closer than 2 meters
                    separationX += ox;
                    separationZ += oz;
                    neighbors++;
                }
            }
            
            // Apply Movement (Chase + Separation)
            let moveDirX = (dx / distanceToPlayer);
            let moveDirZ = (dz / distanceToPlayer);

            if (neighbors > 0) {
                moveDirX += (separationX / neighbors) * 1.5;
                moveDirZ += (separationZ / neighbors) * 1.5;
                // Normalize combined vector
                const mag = Math.sqrt(moveDirX*moveDirX + moveDirZ*moveDirZ);
                moveDirX /= mag;
                moveDirZ /= mag;
            }

            this.mesh.position.x += moveDirX * this.currentSpeed * delta;
            this.mesh.position.z += moveDirZ * this.currentSpeed * delta;

        } else {
            this.state = 'attack';
            this.playAnimation('attack');
            
            if (this.attackCooldown <= 0) {
                if (window.takeDamage) window.takeDamage(this.attackDamage);
                this.attackCooldown = this.isEnraged ? 0.8 : 1.5; // Faster attack when enraged
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.mixer) this.mixer.update(delta);
    }
}

// ==========================================
// SPAWN & UPDATE LOGIC
// ==========================================
function spawnHorde(count = 15, cx = 0, cz = -40) {
    for(let i=0; i<count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let radius = 10 + Math.random() * 20;
        window.zombies.push(new Zombie(cx + Math.cos(angle)*radius, cz + Math.sin(angle)*radius, false));
    }
}

window.updateEnemies = function(delta) {
    if (!window.camera || !window.gameActive) return;
    
    const pPos = window.camera.position;
    
    // Trigger Boss Fight when approaching the castle
    if (!window.bossActive && pPos.z < -80 && Math.abs(pPos.x) < 30) {
        window.bossActive = true;
        window.bossEntity = new Zombie(0, -120, true);
        window.zombies.push(window.bossEntity);
        if (window.logAction) window.logAction("THE ZOMBIE QUEEN APPROACHES!", "text-red-500 font-bold text-lg");
    }

    // Update all living zombies, cleanup dead ones out of logic array
    for (let i = window.zombies.length - 1; i >= 0; i--) {
        const z = window.zombies[i];
        z.update(delta, pPos);
        
        if (z.state === 'dead' && !z.mesh.parent) {
            window.zombies.splice(i, 1);
        }
    }
};

// Spawn initial wave after a short delay
