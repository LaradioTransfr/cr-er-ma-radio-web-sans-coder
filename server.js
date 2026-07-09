// server.js - Le moteur principal de ta radio Transfr
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Base de données temporaire pour les comptes utilisateurs
const users = [];
// Variable pour stocker le nombre réel d'auditeurs connectés
let realListenerCount = 0;

app.use(express.json());
// Servir les fichiers statiques (notre page index.html)
app.use(express.static(path.join(__dirname, '')));

// --- ROUTE POUR L'INSCRIPTION DES COMPTES ---
app.post('/api/register', (req, { body }) => {
    const { username, password } = body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Champs incomplets." });
    }
    
    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Ce pseudo existe déjà." });
    }

    users.push({ username, password });
    res.json({ success: true, message: "Compte créé avec succès !" });
});

// --- ROUTE POUR LA CONNEXION ---
app.post('/api/login', (req, { body }) => {
    const { username, password } = body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return res.status(400).json({ success: false, message: "Pseudo ou mot de passe incorrect." });
    }
    res.json({ success: true, message: "Connexion réussie !" });
});

// --- GESTION DU VRAI COMPTEUR EN TEMPS RÉEL (WEBSOCKET) ---
wss.on('connection', (ws) => {
    // Un nouvel auditeur vient de se connecter !
    realListenerCount++;
    broadcastListenerCount();

    // Quand un auditeur ferme la page ou se déconnecte
    ws.on('close', () => {
        realListenerCount--;
        if (realListenerCount < 0) realListenerCount = 0;
        broadcastListenerCount();
    });
});

// Fonction pour envoyer le vrai chiffre à tout le monde en même temps
function broadcastListenerCount() {
    const data = JSON.stringify({ type: 'COUNTER_UPDATE', count: realListenerCount });
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Lancement du serveur
server.listen(PORT, () => {
    console.log(`=== SERVEUR TRANSFR LANCÉ SUR LE PORT ${PORT} ===`);
});
