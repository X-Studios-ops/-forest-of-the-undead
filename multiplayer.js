// ==========================================
// multiplayer.js - WEBSOCKET & SQUAD SYNC
// ==========================================

window.otherPlayers = {}; // Dusre players ke 3D models store karne ke liye
let mockServerActive = true; // Set to false when you connect a real WebSocket

function initMultiplayer() {
    console.log("🌐 Multiplayer System Initializing...");
    
    // Yahan tu apna real WebSocket URL daalega future mein
    // const socket = new WebSocket('wss://tera-server.com');
    
    if (mockServerActive) {
        startMockMultiplayer();
    }
}

// ==========================================
// MOCK MULTIPLAYER (For testing without backend)
// ==========================================
function startMockMultiplayer() {
    const fakeNames = ["ShadowNinja", "GhostReaper", "ToxicSniper", "AlphaWolf"];
    
    // Simulate player joining every 5 seconds (Max 3 extra players)
    let joinCount = 0;
    const joinInterval = setInterval(() => {
        if (joinCount >= 3 || !window.gameActive) return;
        
        const newPlayerId = "p_" + Math.floor(Math.random() * 1000);
        const name = fakeNames[joinCount];
        
        spawnOtherPlayer(newPlayerId, name, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
        updateSquadUI(name, true);
        receiveChat("System", `${name} has joined the forest.`, "text-blue-400");
        
        joinCount++;
    }, 5000);

    // Simulate random chat messages
    setInterval(() => {
        if (joinCount > 0 && window.gameActive && Math.random() > 0.6) {
            const randomMsg = ["Where is the castle?", "Watch out for zombies!", "I need ammo.", "Follow me!"][Math.floor(Math.random() * 4)];
            const randomPlayer = fakeNames[Math.floor(Math.random() * joinCount)];
            receiveChat(randomPlayer, randomMsg, "text-yellow-400");
        }
    }, 8000);
}

// ==========================================
// 3D MODEL FOR OTHER PLAYERS
// ==========================================
function spawnOtherPlayer(id, name, startX, startZ) {
    // Dusre players ke liye ek blue box model
    const geo = new THREE.BoxGeometry(1, 1.8, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5 });
    const playerMesh = new THREE.Mesh(geo, mat);
    
    playerMesh.position.set(startX, 0.9, startZ);
    playerMesh.castShadow = true;
    
    // Add floating name tag logic here if needed in future
    
    window.scene.add(playerMesh);
    window.otherPlayers[id] = playerMesh;
}

// ==========================================
// UI SYNC & CHAT FUNCTIONS
// ==========================================
function updateSquadUI(playerName, isOnline) {
    const squadList = document.getElementById('squad-list');
    if (!squadList) return;

    // Check if waiting text is there, remove it
    if (squadList.innerHTML.includes("Waiting for players")) {
        squadList.innerHTML = `<li class="flex items-center justify-between"><span class="text-green-400 text-sm">🟢 ${document.getElementById('hud-name').innerText} (You)</span><div class="w-20 bar-container h-1.5 rounded"><div class="health-fill h-full w-[100%]"></div></div></li>`;
    }

    const li = document.createElement('li');
    li.className = `flex items-center justify-between ${!isOnline ? 'opacity-50' : ''}`;
    
    const statusIcon = isOnline ? '🟢' : '🔴';
    const textColor = isOnline ? 'text-green-400' : 'text-red-500';
    
    li.innerHTML = `
        <span class="${textColor} text-sm">${statusIcon} ${playerName}</span>
        <div class="w-20 bar-container h-1.5 rounded"><div class="health-fill h-full ${isOnline ? 'w-[100%]' : 'w-[0%]'}"></div></div>
    `;
    
    squadList.appendChild(li);
}

// Global chat function so UI can trigger it
window.receiveChat = function(sender, message, colorClass = "text-white") {
    const chatBox = document.getElementById('chat-messages');
    if (chatBox) {
        chatBox.innerHTML += `<p><span class="${colorClass}">[${sender}]</span> ${message}</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// ==========================================
// INITIALIZE ON START
// ==========================================
setTimeout(() => {
    // Hook into the game start
    const originalStart = window.startGame;
    window.startGame = function() {
        if (originalStart) originalStart();
        initMultiplayer();
    };
}, 1000);

