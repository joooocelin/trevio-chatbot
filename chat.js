const form = document.querySelector('#chat-form');
const input = document.querySelector('#pesan');
const sendButton = document.querySelector('#send-button');
const conversation = document.querySelector('#conversation');
const loading = document.querySelector('#loading');
const errorMessage = document.querySelector('#error-message');
const suggestionGrid = document.querySelector('#suggestion-grid');
const newChatButton = document.querySelector('#new-chat');
const configuredBackendUrl = document.querySelector('meta[name="trevio-backend-url"]')?.content.trim() || '';

const messages = [
  { role: 'assistant', content: 'Halo, Petualang! Mau ke mana hari ini?' },
];

function createTaviAvatar() {
  const avatar = document.createElement('span');
  const illustration = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');

  avatar.className = 'tavi-avatar';
  illustration.setAttribute('viewBox', '0 0 220 180');
  illustration.setAttribute('aria-hidden', 'true');
  use.setAttribute('href', '#tavi-mark');
  illustration.append(use);
  avatar.append(illustration);
  return avatar;
}

function addMessage(role, content) {
  const message = document.createElement('article');
  const bubble = document.createElement('div');
  const author = document.createElement('span');
  const text = document.createElement('p');

  message.className = `chat-message ${role}`;
  bubble.className = 'message-bubble';
  author.className = 'message-author';
  author.textContent = role === 'user' ? 'Kamu' : 'Tavi';
  text.className = 'message-text';
  text.textContent = content;
  bubble.append(author, text);

  if (role === 'assistant') {
    message.append(createTaviAvatar());
  }
  message.append(bubble);
  conversation.append(message);
  conversation.scrollTo({ top: conversation.scrollHeight, behavior: 'smooth' });
}

function setBusy(isBusy) {
  input.disabled = isBusy;
  sendButton.disabled = isBusy;
  newChatButton.disabled = isBusy;
  suggestionGrid.querySelectorAll('button').forEach((button) => {
    button.disabled = isBusy;
  });
}

async function sendMessage(rawContent) {
  const content = rawContent.trim();
  if (!content || sendButton.disabled) return;

  messages.push({ role: 'user', content });
  addMessage('user', content);
  input.value = '';
  suggestionGrid.hidden = true;
  setBusy(true);
  loading.hidden = false;
  conversation.append(loading);
  errorMessage.hidden = true;
  errorMessage.textContent = '';

  try {
    const isLocalFile = window.location.protocol === 'file:';
    const backendUrl = isLocalFile ? configuredBackendUrl : window.location.origin;

    if (!backendUrl) {
      throw new Error('Backend online belum dikonfigurasi. Isi URL HTTPS backend pada pengaturan trevio-backend-url di index.html.');
    }

    if (isLocalFile && !backendUrl.startsWith('https://')) {
      throw new Error('Backend untuk file lokal harus menggunakan URL HTTPS.');
    }

    const apiUrl = `${backendUrl.replace(/\/+$/, '')}/api/chat`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.slice(-50) }),
    });
    const responseText = await response.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(response.ok
        ? 'Server mengirim respons yang tidak dapat dibaca.'
        : `Backend merespons HTTP ${response.status} tanpa format JSON.`);
    }

    if (!response.ok) {
      throw new Error(result.error || 'Trevio tidak dapat menjawab saat ini.');
    }
    if (typeof result.reply !== 'string' || !result.reply.trim()) {
      throw new Error('Trevio belum dapat memberikan jawaban. Coba lagi sebentar.');
    }

    messages.push({ role: 'assistant', content: result.reply });
    addMessage('assistant', result.reply);
  } catch (error) {
    errorMessage.textContent = error.message || 'Terjadi kesalahan saat menghubungi Trevio.';
    errorMessage.hidden = false;
    conversation.append(errorMessage);
    conversation.scrollTo({ top: conversation.scrollHeight, behavior: 'smooth' });
  } finally {
    loading.hidden = true;
    setBusy(false);
    input.focus();
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

suggestionGrid.addEventListener('click', (event) => {
  const promptButton = event.target.closest('[data-prompt]');
  if (promptButton) sendMessage(promptButton.dataset.prompt);
});

newChatButton.addEventListener('click', () => {
  messages.splice(0, messages.length, {
    role: 'assistant',
    content: 'Halo, Petualang! Mau ke mana hari ini?',
  });
  conversation.querySelectorAll('.chat-message').forEach((message) => message.remove());
  loading.hidden = true;
  errorMessage.hidden = true;
  errorMessage.textContent = '';
  suggestionGrid.hidden = false;
  input.value = '';
  input.focus();
});