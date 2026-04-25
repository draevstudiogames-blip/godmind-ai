# Godmind AI Chat UI

Godmind AI Chat UI adalah antarmuka chat modern bergaya ChatGPT dengan branding khusus Godmind AI. Proyek ini dibuat menggunakan HTML, CSS, dan JavaScript murni tanpa framework sehingga ringan dan mudah di-deploy ke Netlify.

## Teknologi Utama

- HTML5
- CSS3 (custom properties, responsive layout, dark mode)
- Vanilla JavaScript (DOM API, localStorage, Web Speech API)

## Fitur

- Sidebar kiri dengan logo Godmind AI, tombol New Chat, dan riwayat chat
- Chat layout seperti ChatGPT (user kanan, AI kiri)
- Input area dengan textarea, tombol kirim, upload gambar, dan mic
- Typing/loading indicator saat AI merespons
- Typing animation untuk jawaban AI
- Tombol copy di setiap bubble chat
- Clear chat
- Simulasi analisis gambar dengan preview
- Voice input (Speech-to-Text)
- Voice output AI (Text-to-Speech)
- Persistensi chat di localStorage
- Responsive mobile dengan sidebar collapse

## Menjalankan Lokal

1. Pastikan Node.js sudah terpasang (opsional, hanya jika ingin jalankan via server lokal).
2. Jalankan server statis sederhana dari root proyek, contoh:
   - `npx serve .`
3. Buka alamat lokal yang diberikan server (misalnya `http://localhost:3000`).

Atau deploy langsung ke Netlify sebagai static site tanpa konfigurasi tambahan.
