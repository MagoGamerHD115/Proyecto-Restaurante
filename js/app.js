function iniciarSesion() {
  const usuario = document.getElementById("usuario");
  const password = document.getElementById("password");

  if (!usuario || !password) return;

  if (usuario.value === "admin" && password.value === "admin") {
    window.location.href = "mesas.html";
  } else {
    alert("Usuario o contraseña incorrectos");
  }
}

let pedido = [];
let mesaActual = 1;

document.addEventListener("DOMContentLoaded", () => {
  obtenerMesaDesdeURL();
  mostrarMesaActual();
  cargarPedidoExistente();
  renderizarPedido();
  renderizarPedidosCocina();
  renderizarMesas();
  renderizarReportes();
});

function obtenerMesaDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  const mesa = params.get("mesa");

  if (mesa) {
    mesaActual = Number(mesa);
    localStorage.setItem("mesaActual", mesaActual);
  } else {
    const mesaGuardada = localStorage.getItem("mesaActual");
    if (mesaGuardada) {
      mesaActual = Number(mesaGuardada);
    }
  }
}

function mostrarMesaActual() {
  const mesaTexto = document.getElementById("mesaActualTexto");
  if (mesaTexto) {
    mesaTexto.textContent = `Mesa ${mesaActual}`;
  }
}

function obtenerPedidosGuardados() {
  return JSON.parse(localStorage.getItem("pedidosCocina")) || [];
}

function guardarPedidos(pedidos) {
  localStorage.setItem("pedidosCocina", JSON.stringify(pedidos));
}

function obtenerHistorialPedidos() {
  return JSON.parse(localStorage.getItem("historialPedidos")) || [];
}

function guardarHistorialPedidos(historial) {
  localStorage.setItem("historialPedidos", JSON.stringify(historial));
}

function cargarPedidoExistente() {
  const listaPedido = document.getElementById("listaPedido");
  if (!listaPedido) return;

  const pedidosGuardados = obtenerPedidosGuardados();
  const pedidoExistente = pedidosGuardados.find(
    p => Number(p.mesa) === Number(mesaActual)
  );

  if (pedidoExistente) {
    pedido = pedidoExistente.productos.map(producto => ({
      nombre: producto.nombre,
      precio: Number(producto.precio),
      cantidad: Number(producto.cantidad)
    }));
  }
}

function agregarProducto(nombre, precio) {
  const productoExistente = pedido.find(item => item.nombre === nombre);

  if (productoExistente) {
    productoExistente.cantidad += 1;
  } else {
    pedido.push({
      nombre,
      precio,
      cantidad: 1
    });
  }

  renderizarPedido();
}

function renderizarPedido() {
  const listaPedido = document.getElementById("listaPedido");
  const totalPedido = document.getElementById("totalPedido");

  if (!listaPedido || !totalPedido) return;

  listaPedido.innerHTML = "";

  if (pedido.length === 0) {
    listaPedido.innerHTML = "<p style='color:#aaa;'>No hay productos agregados.</p>";
    totalPedido.textContent = "$0.00";
    return;
  }

  let total = 0;

  pedido.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const div = document.createElement("div");
    div.className = "item-pedido";
    div.innerHTML = `
      <div style="flex:1;">
        <strong>${item.nombre}</strong><br>
        <small>$${item.precio.toFixed(2)} x ${item.cantidad}</small>
      </div>
      <div style="display:flex; gap:6px; align-items:center;">
        <button onclick="cambiarCantidad(${index}, -1)" class="btn-cantidad">-</button>
        <span>${item.cantidad}</span>
        <button onclick="cambiarCantidad(${index}, 1)" class="btn-cantidad">+</button>
        <button onclick="eliminarProducto(${index})" class="btn-eliminar">🗑</button>
      </div>
    `;
    listaPedido.appendChild(div);
  });

  totalPedido.textContent = `$${total.toFixed(2)}`;
}

function cambiarCantidad(index, cambio) {
  pedido[index].cantidad += cambio;

  if (pedido[index].cantidad <= 0) {
    pedido.splice(index, 1);
  }

  renderizarPedido();
}

function eliminarProducto(index) {
  pedido.splice(index, 1);
  renderizarPedido();
}

function filtrarProductos(categoria, boton) {
  const productos = document.querySelectorAll(".producto");
  const botones = document.querySelectorAll(".categoria");

  botones.forEach(btn => btn.classList.remove("activa"));
  boton.classList.add("activa");

  productos.forEach(producto => {
    const categoriaProducto = producto.getAttribute("data-categoria");

    if (categoria === "todos" || categoriaProducto === categoria) {
      producto.style.display = "block";
    } else {
      producto.style.display = "none";
    }
  });
}

function enviarACocina() {
  if (pedido.length === 0) {
    alert("Debes agregar al menos un producto al pedido.");
    return;
  }

  const pedidosGuardados = obtenerPedidosGuardados();
  const historial = obtenerHistorialPedidos();

  const total = pedido.reduce((acum, item) => {
    return acum + item.precio * item.cantidad;
  }, 0);

  const nuevoPedido = {
    id: `mesa-${mesaActual}-${Date.now()}`,
    mesa: Number(mesaActual),
    productos: pedido.map(item => ({
      nombre: item.nombre,
      precio: Number(item.precio),
      cantidad: Number(item.cantidad)
    })),
    total: Number(total.toFixed(2)),
    estado: "En preparación",
    fecha: new Date().toISOString()
  };

  const indiceExistente = pedidosGuardados.findIndex(
    p => Number(p.mesa) === Number(mesaActual)
  );

  if (indiceExistente !== -1) {
    pedidosGuardados[indiceExistente] = nuevoPedido;
  } else {
    pedidosGuardados.push(nuevoPedido);
  }

  const indiceHistorial = historial.findIndex(
    h => Number(h.mesa) === Number(mesaActual) && h.entregado !== true
  );

  if (indiceHistorial !== -1) {
    historial[indiceHistorial] = {
      ...nuevoPedido,
      entregado: false
    };
  } else {
    historial.push({
      ...nuevoPedido,
      entregado: false
    });
  }

  guardarPedidos(pedidosGuardados);
  guardarHistorialPedidos(historial);

  pedido = [];
  renderizarPedido();

  alert(`Pedido de Mesa ${mesaActual} enviado a cocina.`);
  window.location.href = "cocina.html";
}

function renderizarPedidosCocina() {
  const contenedor = document.getElementById("listaPedidosCocina");
  if (!contenedor) return;

  const pedidosGuardados = obtenerPedidosGuardados();

  if (pedidosGuardados.length === 0) {
    contenedor.innerHTML = "<p style='color:#aaa;'>No hay pedidos en cocina.</p>";
    return;
  }

  contenedor.innerHTML = "";

  pedidosGuardados.forEach((pedidoCocina, index) => {
    let productosHTML = "";

    pedidoCocina.productos.forEach(producto => {
      productosHTML += `<p>${producto.cantidad}x ${producto.nombre}</p>`;
    });

    const claseEstado =
      pedidoCocina.estado === "En preparación"
        ? "estado-preparacion"
        : "estado-listo";

    const card = document.createElement("article");
    card.className = "orden-card";
    card.innerHTML = `
      <div class="orden-header">
        <h3>Mesa ${pedidoCocina.mesa}</h3>
        <span class="estado ${claseEstado}">${pedidoCocina.estado}</span>
      </div>
      <div class="productos-cocina">
        ${productosHTML}
      </div>
      <h4>Total: $${pedidoCocina.total.toFixed(2)}</h4>
      <div class="acciones-cocina">
        ${
          pedidoCocina.estado !== "Listo"
            ? `<button class="btn-azul" onclick="marcarListo(${index})">Marcar listo</button>`
            : ""
        }
        <button class="btn-eliminar-pedido" onclick="entregarPedido(${index})">Entregar</button>
      </div>
    `;

    contenedor.appendChild(card);
  });
}

function marcarListo(index) {
  const pedidosGuardados = obtenerPedidosGuardados();
  const historial = obtenerHistorialPedidos();

  if (!pedidosGuardados[index]) return;

  const idPedido = pedidosGuardados[index].id;
  pedidosGuardados[index].estado = "Listo";

  const historialIndex = historial.findIndex(h => h.id === idPedido);
  if (historialIndex !== -1) {
    historial[historialIndex].estado = "Listo";
  }

  guardarPedidos(pedidosGuardados);
  guardarHistorialPedidos(historial);

  renderizarPedidosCocina();
  renderizarMesas();
  renderizarReportes();
}

function entregarPedido(index) {
  const pedidosGuardados = obtenerPedidosGuardados();
  const historial = obtenerHistorialPedidos();

  if (!pedidosGuardados[index]) return;

  const pedidoEntregado = pedidosGuardados[index];

  const historialIndex = historial.findIndex(h => h.id === pedidoEntregado.id);
  if (historialIndex !== -1) {
    historial[historialIndex].estado = "Entregado";
    historial[historialIndex].entregado = true;
    historial[historialIndex].fechaEntrega = new Date().toISOString();
  }

  pedidosGuardados.splice(index, 1);

  guardarPedidos(pedidosGuardados);
  guardarHistorialPedidos(historial);

  renderizarPedidosCocina();
  renderizarMesas();
  renderizarReportes();
}

function renderizarMesas() {
  const gridMesas = document.getElementById("gridMesas");
  if (!gridMesas) return;

  const pedidosGuardados = obtenerPedidosGuardados();
  gridMesas.innerHTML = "";

  for (let i = 1; i <= 8; i++) {
    const pedidoMesa = pedidosGuardados.find(p => Number(p.mesa) === i);

    let claseMesa = "mesa-disponible";
    let estadoTexto = "Disponible";
    let resumenHTML = "";
    let botonHTML = `<a href="pedido.html?mesa=${i}" class="btn-principal">Tomar pedido</a>`;

    if (pedidoMesa) {
      claseMesa = "mesa-ocupada";
      estadoTexto = pedidoMesa.estado;

      resumenHTML = `
        <div class="mesa-detalle">
          ${pedidoMesa.productos
            .map(prod => `<p>${prod.cantidad}x ${prod.nombre}</p>`)
            .join("")}
        </div>
      `;

      botonHTML = `<a href="pedido.html?mesa=${i}" class="btn-principal">Editar pedido</a>`;
    }

    const claseEstadoMesa =
      estadoTexto === "Disponible"
        ? "badge-disponible"
        : estadoTexto === "Listo"
        ? "badge-listo"
        : "badge-preparacion";

    const card = document.createElement("article");
    card.className = `mesa-card ${claseMesa}`;
    card.innerHTML = `
      <div class="icono-mesa">🪑</div>
      <h3>Mesa ${i}</h3>
      <span class="badge-mesa ${claseEstadoMesa}">${estadoTexto}</span>
      ${resumenHTML}
      ${botonHTML}
    `;

    gridMesas.appendChild(card);
  }
}

function renderizarReportes() {
  const totalPedidosEl = document.getElementById("reporteTotalPedidos");
  const ventasDiaEl = document.getElementById("reporteVentasDia");
  const ticketPromedioEl = document.getElementById("reporteTicketPromedio");
  const enPreparacionEl = document.getElementById("reporteEnPreparacion");
  const pendientesEl = document.getElementById("reportePendientes");
  const preparacionEl = document.getElementById("reportePreparacion");
  const listosEl = document.getElementById("reporteListos");
  const productosMasVendidosEl = document.getElementById("reporteProductosMasVendidos");

  if (
    !totalPedidosEl ||
    !ventasDiaEl ||
    !ticketPromedioEl ||
    !enPreparacionEl ||
    !pendientesEl ||
    !preparacionEl ||
    !listosEl ||
    !productosMasVendidosEl
  ) {
    return;
  }

  const historial = obtenerHistorialPedidos();

  const totalPedidos = historial.length;
  const ventasDia = historial.reduce((acc, pedidoHistorial) => acc + Number(pedidoHistorial.total || 0), 0);
  const ticketPromedio = totalPedidos > 0 ? ventasDia / totalPedidos : 0;

  let pendientes = 0;
  let enPreparacion = 0;
  let listos = 0;

  const contadorProductos = {};

  historial.forEach(pedidoHistorial => {
    if (pedidoHistorial.estado === "Pendiente") pendientes++;
    if (pedidoHistorial.estado === "En preparación") enPreparacion++;
    if (pedidoHistorial.estado === "Listo") listos++;

    pedidoHistorial.productos.forEach(producto => {
      if (!contadorProductos[producto.nombre]) {
        contadorProductos[producto.nombre] = 0;
      }
      contadorProductos[producto.nombre] += Number(producto.cantidad);
    });
  });

  totalPedidosEl.textContent = totalPedidos;
  ventasDiaEl.textContent = `$${ventasDia.toFixed(2)}`;
  ticketPromedioEl.textContent = `$${ticketPromedio.toFixed(2)}`;
  enPreparacionEl.textContent = enPreparacion;
  pendientesEl.textContent = pendientes;
  preparacionEl.textContent = enPreparacion;
  listosEl.textContent = listos;

  const productosOrdenados = Object.entries(contadorProductos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  productosMasVendidosEl.innerHTML = "";

  if (productosOrdenados.length === 0) {
    productosMasVendidosEl.innerHTML = "<p>No hay productos vendidos todavía.</p>";
    return;
  }

  productosOrdenados.forEach(([nombre, cantidad]) => {
    const p = document.createElement("p");
    p.textContent = `${nombre} (${cantidad})`;
    productosMasVendidosEl.appendChild(p);
  });
}