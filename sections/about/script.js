// sections/about/script.js
// Gunakan module agar scope terisolasi
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('about-back-home');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.location.href = '../../index.html';
  });
});
