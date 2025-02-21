document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const showLogin = document.getElementById('show-login');
  const showSignup = document.getElementById('show-signup');
  const home = document.getElementById('home');
  const loginSection = document.getElementById('login');
  const signupSection = document.getElementById('signup');
  const welcomeSection = document.getElementById('welcome');
  const loadingOverlay = document.getElementById('loading-overlay');

  // Check if user is already logged in
  const username = localStorage.getItem('username');
  if (username) {
    welcomeSection.style.display = 'block';
    document.getElementById('welcome-user').textContent = `Welcome, ${username}!`;
  } else {
    home.style.display = 'block';
  }

  // Form validation functions
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePassword(password) {
    return password.length >= 8;
  }

  function showError(elementId, message) {
    const errorElement = document.getElementById(`${elementId}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('visible');
    }
  }

  function clearErrors() {
    document.querySelectorAll('.error-text').forEach(error => {
      error.textContent = '';
      error.classList.remove('visible');
    });
  }

  // Show/Hide forms with animation
  showLogin.addEventListener('click', () => {
    clearErrors();
    home.style.display = 'none';
    signupSection.style.display = 'none';
    welcomeSection.style.display = 'none';
    loginSection.style.display = 'block';
    loginSection.classList.add('visible');
    document.getElementById('email').focus();
  });

  showSignup.addEventListener('click', () => {
    clearErrors();
    home.style.display = 'none';
    loginSection.style.display = 'none';
    welcomeSection.style.display = 'none';
    signupSection.style.display = 'block';
    signupSection.classList.add('visible');
    document.getElementById('username').focus();
  });

  // Password visibility toggle
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
      const input = this.previousElementSibling;
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });
  });

  // Login form handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    let isValid = true;

    if (!validateEmail(email)) {
      showError('email', 'Please enter a valid email address');
      isValid = false;
    }

    if (!validatePassword(password)) {
      showError('password', 'Password must be at least 8 characters long');
      isValid = false;
    }

    if (!isValid) return;

    loadingOverlay.hidden = false;
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('username', result.message.replace('Welcome, ', ''));
        welcomeSection.style.display = 'block';
        welcomeSection.classList.add('visible');
        loginSection.style.display = 'none';
        document.getElementById('welcome-user').textContent = `Welcome, ${localStorage.getItem('username')}!`;
        loginForm.reset();
      } else {
        const messageElement = document.getElementById('login-message');
        messageElement.textContent = result.message;
        messageElement.className = 'message error-message visible';
      }
    } catch (error) {
      const messageElement = document.getElementById('login-message');
      messageElement.textContent = 'Connection error. Please try again later.';
      messageElement.className = 'message error-message visible';
    } finally {
      loadingOverlay.hidden = true;
    }
  });

  // Signup form handler
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const username = document.getElementById('username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    let isValid = true;

    if (username.length < 3) {
      showError('username', 'Username must be at least 3 characters long');
      isValid = false;
    }

    if (!validateEmail(email)) {
      showError('signup-email', 'Please enter a valid email address');
      isValid = false;
    }

    if (!validatePassword(password)) {
      showError('signup-password', 'Password must be at least 8 characters long');
      isValid = false;
    }

    if (!isValid) return;

    loadingOverlay.hidden = false;
    try {
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const result = await response.json();
      const messageElement = document.getElementById('signup-message');
      messageElement.textContent = result.message;
      
      if (response.ok) {
        messageElement.className = 'message success-message visible';
        signupForm.reset();
        setTimeout(() => showLogin.click(), 2000);
      } else {
        messageElement.className = 'message error-message visible';
      }
    } catch (error) {
      const messageElement = document.getElementById('signup-message');
      messageElement.textContent = 'Connection error. Please try again later.';
      messageElement.className = 'message error-message visible';
    } finally {
      loadingOverlay.hidden = true;
    }
  });

  // Logout handler
  document.querySelector('.logout-button').addEventListener('click', () => {
    localStorage.removeItem('username');
    welcomeSection.style.display = 'none';
    welcomeSection.classList.remove('visible');
    home.style.display = 'block';
    loginForm.reset();
    signupForm.reset();
  });
});