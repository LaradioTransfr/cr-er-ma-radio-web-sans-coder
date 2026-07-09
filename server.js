const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

// Base de données en mémoire pour stocker toutes les radios actives
let radios = {}; 
let userCount = 0;

wss.on('connection', (ws) => {
    userCount++;
    
    // On envoie la liste de toutes les radios existantes et le nombre d'utilisateurs au nouvel arrivant
    ws.send(JSON.stringify({ type: 'init', userCount: userCount, radios: radios }));
    broadcast(JSON.stringify({ type: 'count', value: userCount }));

    ws.on('message', (message, isBinary) => {
        if (isBinary) {
            // TRANSMISSION DU SON PROPRE : 
            // On renvoie le flux audio à TOUS les autres navigateurs (écouteurs/téléphones)
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message, { binary: true });
                }
            });
        } else {
            // GESTION DU TEXTE (Changements de configuration en direct)
            try {
                const data = JSON.parse(message);
                
                // Un animateur met à jour ou crée sa radio
                if (data.type === 'updateRadio') {
                    radios[data.username] = {
                        name: data.name,
                        logo: data.logo || null,
                        isLive: data.isLive || false
                    };
                    console.log(`📢 Radio mise à jour : [${data.username}] - ${data.name}`);
                    // On synchronise TOUS les appareils instantanément
                    broadcast(JSON.stringify({ type: 'radiosSync', radios: radios }));
                }
            } catch (e) {
                console.error("Erreur traitement texte reçu :", e);
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
    console.log(`🚀 Serveur Transfr branché avec succès sur http://localhost:${PORT}`);
});
