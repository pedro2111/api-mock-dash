// httpClient.js
const axios = require('axios');
const https = require('https');
const fs = require('fs');

// Lê o certificado raiz ou cadeia
const ca = fs.readFileSync('acicptestesraiz.cer'); // ou raiz.crt

// Cria agente HTTPS com a CA confiável
const agent = new https.Agent({
  ca,
  rejectUnauthorized: true
});

// Cria instância do axios com httpsAgent embutido
const httpClient = axios.create({
  httpsAgent: agent
});

module.exports = httpClient;