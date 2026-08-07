// =====================================================
// app.js - RESPALDO SOLO PARA LOGIN (Diagnóstico)
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyDfIQXFFDGoBMvTIOT52nZGVUc-pFJGFs4",
  authDomain: "hogar-e266a.firebaseapp.com",
  projectId: "hogar-e266a",
  storageBucket: "hogar-e266a.firebasestorage.app",
  messagingSenderId: "534168977173",
  appId: "1:534168977173:web:f3900fae93c7dd520b331c"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// DOM ELEMENTS
const pageAuth = document.getElementById('page-auth');
const pageCategorias = document.getElementById('page-categorias');
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authTitle = document.getElementById('authTitle');
const authSwitchLink = document.getElementById('authSwitchLink');
const authSwitchText = document.getElementById('authSwitchText');
const authError = document.getElementById('authError');
const btnGoogle = document.getElementById('btnGoogle');
const btnLogout = document.getElementById('btnLogout');
const userNameSpan = document.getElementById('user-name');
const dock = document.getElementById('mainDock');

let isLogin = true;

// --- AUTENTICACIÓN ---
function toggleAuthMode() {
  isLogin = !isLogin;
  authTitle.textContent = isLogin ? 'Iniciar Sesión' : 'Crear Cuenta';
  authSubmitBtn.textContent = isLogin ? 'Iniciar sesión' : 'Registrarse';
  authSwitchText.textContent = isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? ';
  authSwitchLink.textContent = isLogin ? 'Regístrate' : 'Inicia sesión';
  authError.textContent = '';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();

  if (!email || !password) { 
    authError.textContent = 'Por favor, completa el correo y la contraseña.'; 
    return; 
  }

  authError.textContent = 'Cargando...';
  try {
    if (isLogin) { 
      await auth.signInWithEmailAndPassword(email, password); 
    } else { 
      await auth.createUserWithEmailAndPassword(email, password); 
    }
  } catch (error) {
    console.error("❌ Error en handleAuthSubmit:", error);
    if (error.code === 'auth/email-already-in-use') authError.textContent = 'Este correo ya está registrado.';
    else if (error.code === 'auth/user-not-found') authError.textContent = 'Usuario no encontrado.';
    else if (error.code === 'auth/wrong-password') authError.textContent = 'Contraseña incorrecta.';
    else authError.textContent = error.message || "Error al conectar con Firebase.";
  }
}

async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (error) {
    console.error("❌ Error en loginWithGoogle:", error);
    authError.textContent = error.message || "Error al iniciar con Google.";
  }
}

function logout() { auth.signOut(); }

// --- ESTADO DE SESIÓN ---
auth.onAuthStateChanged(user => {
  if (user) {
    pageAuth.classList.add('hidden-page');
    pageCategorias.classList.remove('hidden-page');
    userNameSpan.textContent = user.displayName || user.email || 'Usuario';
    if (dock) dock.classList.remove('hidden-page');
  } else {
    pageAuth.classList.remove('hidden-page');
    pageCategorias.classList.add('hidden-page');
    userNameSpan.textContent = 'Invitado';
    authError.textContent = '';
    if (dock) dock.classList.add('hidden-page');
  }
});

// --- EVENTOS UI ---
authForm.addEventListener('submit', handleAuthSubmit);
authSwitchLink.addEventListener('click', toggleAuthMode);
btnGoogle.addEventListener('click', loginWithGoogle);
btnLogout.addEventListener('click', logout);

console.log('✅ Modo diagnóstico de Login activado.');