const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ASTUCE : On dit au serveur de chercher index.html directement à la racine, sans dossier public !
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let radios = {}; 
let userCount = 0;

wss.on('connection', (ws) => {
    userCount++;
    
    ws.send(JSON.stringify({ type: 'init', userCount: userCount, radios: radios }));
    broadcast(JSON.stringify({ type: 'count', value: userCount }));

    ws.on('message', (message, isBinary) => {
        if (isBinary) {
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message, { binary: true });
                }
            });
        } else {
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Transfr branché en direct !`);
});
