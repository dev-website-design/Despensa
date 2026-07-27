// Carga inicial
render();
const manifest = {
  name: "Mi Despensa",
  short_name: "Despensa",
  start_url: "/index.html",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#2d6a4f",
  icons: [
    {
      src: "assets/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png"
    },
    {
      src: "assets/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png"
    }
  ]
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(reg => console.log("Service Worker registrado:", reg))
      .catch(err => console.error("Error al registrar el Service Worker:", err));
  });
}

// Inventario inicial almacenado en el navegador
let inventario = JSON.parse(localStorage.getItem('despensa')) || [
  { id: 1, nombre: 'Leche', stock: 3, icono: '🥛', alertaMin: 2 },
  { id: 2, nombre: 'Agua', stock: 1, icono: '🍾', alertaMin: 2 },
  { id: 3, nombre: 'Huevos', stock: 6, icono: '🥚', alertaMin: 4 },
  { id: 4, nombre: 'Mermelada', stock: 1, icono: '🫙', alertaMin: 1 }
];

// Solicitar permiso para Notificaciones Push / Locales
function solicitarNotificaciones() {
  if ('Notification' in window) {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        alert('¡Notificaciones activadas correctamente!');
      }
    });
  }
}

// Enviar notificación cuando un producto esté bajo en stock
function notificarStockBajo(producto) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('⚠️ ¡Stock bajo en tu despensa!', {
      body: `El producto "${producto.nombre}" está a punto de agotarse (${producto.stock} rest.). ¡Añádelo a la compra!`,
      icon: 'icon.png'
    });
  }
}

// Renderizar las tarjetas con estilo de la plantilla
function render() {
  const container = document.getElementById('grid-productos');
  container.innerHTML = '';

  inventario.forEach(prod => {
    const esBajo = prod.stock <= prod.alertaMin;
    
    const card = document.createElement('div');
    card.className = `card ${esBajo ? 'low-stock' : ''}`;
    card.innerHTML = `
      <div class="card-img">${prod.icono}</div>
      <div class="card-title">${prod.nombre}</div>
      <div class="stock-tag">${esBajo ? '⚠️ Quedan pocos' : 'En stock'}</div>
      <div class="quantity-controls">
        <button class="btn-qty" onclick="cambiarCantidad(${prod.id}, -1)">-</button>
        <span class="qty-val">${prod.stock}</span>
        <button class="btn-qty" onclick="cambiarCantidad(${prod.id}, 1)">+</button>
      </div>
    `;
    container.appendChild(card);
  });

  localStorage.setItem('despensa', JSON.stringify(inventario));
}

// Cambiar la cantidad (+ o -)
function cambiarCantidad(id, cambio) {
  const producto = inventario.find(p => p.id === id);
  if (producto) {
    const stockAnterior = producto.stock;
    producto.stock = Math.max(0, producto.stock + cambio);
    
    // Si cruza el umbral de alerta hacia abajo, notifica
    if (producto.stock <= producto.alertaMin && stockAnterior > producto.alertaMin) {
      notificarStockBajo(producto);
    }
    render();
  }
}

// Añadir un nuevo producto a la despensa
function agregarProducto() {
  const nombre = prompt('Nombre del producto:');
  if (!nombre) return;
  const icono = prompt('Emoji o Ícono (ej. 🧀, 🍞):', '📦');
  const stock = parseInt(prompt('Cantidad inicial:', '1')) || 1;
  const alertaMin = parseInt(prompt('Avisar cuando queden menos de:', '2')) || 2;

  const nuevo = {
    id: Date.now(),
    nombre,
    icono,
    stock,
    alertaMin
  };

  inventario.push(nuevo);
  render();
}
