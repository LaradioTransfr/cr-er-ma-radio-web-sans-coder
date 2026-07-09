const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Distribue les fichiers du dossier public (ton index.html)
app.use(express.static(path.join(__dirname, 'public')));

let radios = {}; 
let userCount = 0;

wss.on('connection', (ws) => {
    userCount++;
    
    // Envoie la liste des radios et le nombre de connectés dès qu'un appareil arrive
    ws.send(JSON.stringify({ type: 'init', userCount: userCount, radios: radios }));
    broadcast(JSON.stringify({ type: 'count', value: userCount }));

    ws.on('message', (message, isBinary) => {
        if (isBinary) {
            // TRANSMISSION AUDIO : Envoie le son à tout le monde
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message, { binary: true });
                }
            });
        } else {
            // TRANSMISSION TEXTE : Gestion du nom et du logo
            try {
                const data = JSON.parse(message);
                if (data.type === 'updateRadio') {
                    radios[data.username] = {
                        name: data.name,
                        logo: data.logo || null,
                        isLive: data.isLive || false
                    };
                    console.log(`📢 Radio synchronisée : [${data.username}] - ${data.name}`);
                    broadcast(JSON.stringify({ type: 'radiosSync', radios: radios }));
                }
            } catch (e) {
                console.error("Erreur texte :", e);
            }
        }
    });

    ws.on('close', () => {
        userCount--;
        broadcast(JSON.stringify({ type: 'count', value: userCount }));
    });
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Le port s'adapte tout seul à Internet (process.env.PORT) ou utilise 3000 en local
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Transfr en ligne !`);
});
