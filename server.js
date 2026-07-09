const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Sert les fichiers statiques (comme index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Compteur d'utilisateurs connectés
let userCount = 0;

wss.on('connection', (ws) => {
    userCount++;
    console.log(`➕ Un utilisateur s'est connecté. Total : ${userCount}`);
    
    // On envoie le nouveau compte à tout le monde
    broadcast(JSON.stringify({ type: 'count', value: userCount }));

    // Quand le serveur reçoit un message
    ws.on('message', (message, isBinary) => {
        
        if (isBinary) {
            // C'EST DU SON ! 
            // On le renvoie immédiatement à TOUS les autres utilisateurs connectés
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message, { binary: true });
                }
            });
        } else {
            // C'est du texte (par exemple un message de configuration ou autre)
            try {
                const data = JSON.parse(message);
                // Tu pourras ajouter d'autres gestions de données texte ici si besoin
            } catch (e) {
                console.log("Texte reçu inconnu :", message);
            }
        }
    });

    ws.on('close', () => {
        userCount--;
        console.log(`❌ Un utilisateur s'est déconnecté. Total : ${userCount}`);
        broadcast(JSON.stringify({ type: 'count', value: userCount }));
    });
});

// Fonction pratique pour envoyer un message texte à tout le monde
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Lancement du serveur sur le port 3000 (ou celui de ton choix)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur Transfr en ligne sur http://localhost:${PORT}`);
});
