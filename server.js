const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Sert les fichiers de ton site (index.html, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

let userCount = 0;

wss.on('connection', (ws) => {
    userCount++;
    console.log(`➕ Un auditeur est là ! Total : ${userCount}`);
    
    // On met à jour les compteurs de tout le monde
    broadcast(JSON.stringify({ type: 'count', value: userCount }));

    ws.on('message', (message, isBinary) => {
        if (isBinary) {
            // C'est ta voix ! On l'envoie à tous les autres connectés (comme ton téléphone)
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message, { binary: true });
                }
            });
        }
    });

    ws.on('close', () => {
        userCount--;
        console.log(`❌ Un auditeur est parti. Total : ${userCount}`);
        broadcast(JSON.stringify({ type: 'count', value: userCount }));
    });

    // Sécurité : évite que le serveur ne coupe s'il y a une micro-erreur de réseau
    ws.on('error', (err) => {
        console.error("Petite erreur de connexion (sans gravité) :", err.message);
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
    console.log(`🚀 Serveur Transfr en ligne sur http://localhost:${PORT}`);
});
