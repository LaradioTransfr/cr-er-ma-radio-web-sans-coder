// server.js - Le Serveur Pont Audio Transfr avec Vrai Compteur
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '')));

// Fonction pour envoyer le vrai nombre d'auditeurs connectés à tout le monde
function broadcastUserCount() {
    const countData = JSON.stringify({ type: 'count', value: wss.clients.size });
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(countData); // Envoie le chiffre en texte
        }
    });
}

wss.on('connection', (ws) => {
    console.log('👥 Un utilisateur vient de se connecter à Transfr');
    broadcastUserCount(); // Quelqu'un se connecte -> On recalcule et met à jour

    ws.on('message', (message) => {
        // Transmettre les données (son du micro) à TOUS les autres connectés
        wss.clients.forEach((client) => {
            // On vérifie que c'est bien du son binaire et pas du texte JSON
            if (client !== ws && client.readyState === WebSocket.OPEN && !(typeof message === 'string')) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('🏃 Un utilisateur a quitté la page');
        broadcastUserCount(); // Quelqu'un quitte -> On recalcule et met à jour
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 LE SERVEUR TRANSFR TRANSPORTE LE SON SUR LE PORT ${PORT} 🚀`);
    console.log(`👥 COMPTEUR D'AUDITEURS EN DIRECT ACTIF SANS CODAGE`);
    console.log(`======================================================\n`);
});
