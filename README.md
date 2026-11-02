# Trevio AI Chatbot

## Menjalankan aplikasi

1. Pasang Node.js 18 atau lebih baru.
2. Jalankan `npm install` di folder proyek.
3. Salin `.env.example` menjadi `.env`, lalu isi `OPENROUTER_API_KEY` dengan API key OpenRouter Anda.
4. Jalankan `npm start` dan buka `http://localhost:3000`.

`OPENROUTER_MODEL` secara default menggunakan `openrouter/free`. Anda dapat menggantinya melalui environment variable backend `OPENROUTER_MODEL`. Jangan membagikan atau mengirimkan file `.env` ke repositori; API key hanya dibaca oleh backend dari `process.env.OPENROUTER_API_KEY`.

## Deploy backend untuk file://

Saat `index.html` dibuka langsung dari komputer, browser memberi origin `null`. Browser tidak dapat mengakses backend lokal lewat path relatif, jadi backend perlu dipublikasikan dengan HTTPS.

Contoh langkah menggunakan Render:

1. Pastikan proyek berada di repository GitHub. Jangan commit `.env` atau `node_modules`; keduanya sudah dikecualikan oleh `.gitignore`.
2. Di Render, buat **New Web Service** dan hubungkan repository tersebut.
3. Gunakan build command `npm ci` dan start command `npm start`. Proyek membutuhkan Node.js 18 atau lebih baru.
4. Tambahkan environment variables di dashboard Render: `OPENROUTER_API_KEY` sebagai secret yang baru/aktif, `OPENROUTER_MODEL` dengan nilai `openrouter/free`, dan `CORS_ORIGINS` dengan nilai `null`.
5. Deploy service, lalu salin URL HTTPS publik yang diberikan Render.
6. Isi URL tersebut pada atribut `content` meta `trevio-backend-url` di `index.html`, tanpa menambahkan `/api/chat`.
7. Buka `index.html` secara langsung dan kirim pesan untuk menguji koneksi.

Server membaca `CORS_ORIGINS` sebagai daftar origin yang dipisahkan koma. Nilai `null` mengizinkan browser yang membuka halaman dari `file://`; server juga menangani preflight `OPTIONS` yang dikirim browser untuk request JSON. Jika halaman di-host pada domain tertentu, tambahkan origin HTTPS domain tersebut ke daftar, misalnya `null,https://chat.example.com`.

Halaman yang dijalankan melalui `npm start` tetap menggunakan backend pada origin yang sama, sehingga mode localhost tidak bergantung pada URL Render. API key hanya disimpan sebagai environment variable backend; jangan memasukkannya ke `index.html`, `chat.js`, atau repository. CORS bukan autentikasi: backend tetap publik dan endpoint dapat dipanggil pihak lain, jadi pantau penggunaan dan batasi/rotasi key bila diperlukan.