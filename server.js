// server.js - Le Serveur Pont Audio Transfr
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '')));

wss.on('connection', (ws) => {
    console.log('👥 Un utilisateur vient de se connecter à Transfr');

    // Quand le serveur reçoit des données audio (en binaire)
    ws.on('message', (message) => {
        // Renvoyer le son à TOUS les autres utilisateurs connectés
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message); // Transmet le flux audio en direct !
            }
        });
    });

    ws.on('close', () => {
        console.log('🏃 Un utilisateur a quitté la page');
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 LE SERVEUR TRANSFR TRANSPORTE LE SON SUR LE PORT ${PORT} 🚀`);
    console.log(`======================================================\n`);
});
