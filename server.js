// server.js - Le Serveur Pont Audio Transfr avec Gestion des Rôles
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
            client.send(countData);
        }
    });
}

wss.on('connection', (ws) => {
    console.log('👥 Un utilisateur s’est connecté à Transfr');
    broadcastUserCount();

    // Par défaut, chaque nouvelle connexion est un auditeur
    ws.isAnimateur = false;

    ws.on('message', (message) => {
        // 1. Si le message est du texte (JSON)
        if (typeof message === 'string') {
            try {
                const data = JSON.parse(message);
                if (data.type === 'setRole' && data.role === 'animateur') {
                    ws.isAnimateur = true;
                    console.log('🎙️ Un utilisateur a pris le contrôle du Micro Animateur !');
                }
            } catch (e) {
                // Pas du JSON valide, on ignore
            }
            return;
        }

        // 2. Si c'est du son binaire, et que ça vient bien de l'animateur
        if (ws.isAnimateur) {
            wss.clients.forEach((client) => {
                // On envoie le son UNIQUEMENT aux auditeurs (pas à l'animateur lui-même)
                if (client !== ws && client.readyState === WebSocket.OPEN && !client.isAnimateur) {
                    client.send(message);
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('🏃 Un utilisateur a quitté la page');
        broadcastUserCount();
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 SERVEUR TRANSFR PRÊT SUR LE PORT ${PORT} 🚀`);
    console.log(`🔊 ROUTAGE AUDIO INNÉ : DU MICRO VERS LES AUDITEURS`);
    console.log(`======================================================\n`);
});
