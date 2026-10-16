'use strict';

const form = document.getElementById('loginForm');
const error = document.getElementById('loginError');
const button = document.getElementById('loginBtn');
const card = document.getElementById('loginCard');

// Only follow ?next= to a path on this site, never to another host.
function nextUrl() {
  const next = new URLSearchParams(location.search).get('next') || '/';
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/';
}

function showError(message) {
  error.textContent = message;
  error.hidden = false;
  card.classList.remove('shake');
  void card.offsetWidth; // restart the animation
  card.classList.add('shake');
}

document.getElementById('pwToggle').addEventListener('click', (e) => {
  const input = form.password;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  e.currentTarget.setAttribute('aria-label', show ? 'Wachtwoord verbergen' : 'Wachtwoord tonen');
  e.currentTarget.title = e.currentTarget.getAttribute('aria-label');
  input.focus();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = form.username.value.trim();
  const password = form.password.value;
  if (!username || !password) return showError('Vul je gebruikersnaam en wachtwoord in.');
  error.hidden = true;
  button.disabled = true;
  button.textContent = 'Bezig…';
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, remember: form.remember.checked }),
    });
    if (res.ok) return location.replace(nextUrl());
    let message = 'Inloggen is mislukt.';
    try { message = (await res.json()).error || message; } catch {}
    showError(message);
    form.password.value = '';
    form.password.focus();
  } catch {
    showError('Kan de server niet bereiken.');
  } finally {
    button.disabled = false;
    button.textContent = 'Inloggen';
  }
});
