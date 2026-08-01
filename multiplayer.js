setTimeout(() => {
    const squad = document.getElementById('squad-list');
    if(squad) {
        setTimeout(() => {
            squad.innerHTML += `<li class="text-green-400">🟢 GhostReaper</li>`;
            const chat = document.getElementById('chat-messages');
            if(chat) chat.innerHTML += `<p class="text-yellow-400">[GhostReaper] Watch out for zombies!</p>`;
        }, 4000);
    }
}, 1000);
