const express = require('express');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = Number(process.env.PORT) || 3000;
const model = process.env.OPENROUTER_MODEL || 'openrouter/free';
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || 'null,http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use(express.json({ limit: '1mb' }));
app.use((request, response, next) => {
  const origin = request.get('Origin');

  if (!origin) return next();
  if (!allowedOrigins.has(origin)) {
    return response.status(403).json({ error: 'Origin tidak diizinkan.' });
  }

  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') return response.sendStatus(204);
  return next();
});

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/chat.js', (request, response) => {
  response.sendFile(path.join(__dirname, 'chat.js'));
});

app.get('/styles.css', (request, response) => {
  response.sendFile(path.join(__dirname, 'styles.css'));
});

app.post('/api/chat', async (request, response) => {
  const { messages } = request.body || {};
  const validMessages = Array.isArray(messages)
    && messages.length > 0
    && messages.length <= 50
    && messages.every((message) => (
      message
      && ['user', 'assistant'].includes(message.role)
      && typeof message.content === 'string'
      && message.content.trim().length > 0
      && message.content.length <= 4000
    ));

  if (!validMessages) {
    return response.status(400).json({ error: 'Format pesan tidak valid.' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return response.status(503).json({ error: 'API key OpenRouter belum dikonfigurasi.' });
  }

  try {
    const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || `http://localhost:${port}`,
        'X-Title': process.env.OPENROUTER_APP_NAME || 'Trevio AI Chatbot',
      },
      body: JSON.stringify({ model, messages }),
    });
    const responseText = await apiResponse.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('OpenRouter returned a non-JSON response with status:', apiResponse.status);
      return response.status(502).json({
        error: `OpenRouter mengirim respons tidak valid (HTTP ${apiResponse.status}).`,
      });
    }

    if (!apiResponse.ok) {
      console.error('OpenRouter returned status:', apiResponse.status);
      return response.status(502).json({
        error: `OpenRouter menolak permintaan (HTTP ${apiResponse.status}). Periksa model, API key, dan akses akun.`,
      });
    }

    const reply = result.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) {
      return response.status(502).json({ error: 'OpenRouter tidak mengirim jawaban yang valid.' });
    }

    return response.json({ reply });
  } catch (error) {
    console.error('OpenRouter request failed:', error.message);
    return response.status(502).json({ error: 'Tidak dapat terhubung ke OpenRouter.' });
  }
});

app.use((request, response) => {
  response.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

app.use((error, request, response, next) => {
  if (error instanceof SyntaxError || error.status === 413) {
    return response.status(error.status === 413 ? 413 : 400)
      .json({ error: 'Request tidak valid atau terlalu besar.' });
  }

  console.error('Server error:', error.message);
  return response.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

app.listen(port, () => {
  console.log(`Trevio berjalan di http://localhost:${port}`);
});