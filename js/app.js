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

const mesasConfiguracion = [
  { id: 1, numero: 1, capacidad: 2, tipo: "mesa-redonda", claseExtra: "pos-1" },
  { id: 2, numero: 2, capacidad: 4, tipo: "mesa-redonda", claseExtra: "pos-2" },
  { id: 3, numero: 3, capacidad: 4, tipo: "mesa-redonda", claseExtra: "pos-3" },
  { id: 4, numero: 4, capacidad: 6, tipo: "mesa-rectangular", claseExtra: "pos-4" },
  { id: 5, numero: 5, capacidad: 6, tipo: "mesa-rectangular", claseExtra: "pos-5" },
  { id: 6, numero: 6, capacidad: 8, tipo: "mesa-rectangular-larga", claseExtra: "pos-6" },
  { id: 7, numero: 7, capacidad: 8, tipo: "mesa-rectangular-larga", claseExtra: "pos-7" },
  { id: 8, numero: 8, capacidad: 8, tipo: "mesa-cuadrada", claseExtra: "pos-8" }
];

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

function obtenerConfiguracionMesa(numeroMesa) {
  return mesasConfiguracion.find(mesa => mesa.id === Number(numeroMesa));
}

function cargarPedidoExistente() {
  const listaPedido = document.getElementById("listaPedido");
  if (!listaPedido) return;

  const pedidosGuardados = obtenerPedidosGuardados();
  const pedidoExistente = pedidosGuardados.find(
    p => Number(p.mesa) === Number(mesaActual)
  );

  const inputPersonas = document.getElementById("personasMesa");
  const configMesa = obtenerConfiguracionMesa(mesaActual);

  if (pedidoExistente) {
    pedido = pedidoExistente.productos.map(producto => ({
      nombre: producto.nombre,
      precio: Number(producto.precio),
      cantidad: Number(producto.cantidad)
    }));

    if (inputPersonas) {
      inputPersonas.value = Number(pedidoExistente.personas || configMesa?.capacidad || 1);
    }
  } else if (inputPersonas) {
    inputPersonas.value = Number(configMesa?.capacidad || 1);
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

  const inputPersonas = document.getElementById("personasMesa");
  const configMesa = obtenerConfiguracionMesa(mesaActual);

  let personasMesa = Number(inputPersonas?.value || configMesa?.capacidad || 1);

  if (personasMesa < 1) {
    personasMesa = 1;
  }

  const pedidosGuardados = obtenerPedidosGuardados();
  const historial = obtenerHistorialPedidos();

  const total = pedido.reduce((acum, item) => {
    return acum + item.precio * item.cantidad;
  }, 0);

  const nuevoPedido = {
    id: `mesa-${mesaActual}-${Date.now()}`,
    mesa: Number(mesaActual),
    personas: personasMesa,
    capacidad: Number(configMesa?.capacidad || personasMesa),
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
    nuevoPedido.id = pedidosGuardados[indiceExistente].id;
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
      <p><strong>Personas:</strong> ${pedidoCocina.personas || 0}</p>
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

function obtenerClaseEstadoMesa(estado) {
  if (estado === "Listo") return "estado-libre-listo";
  if (estado === "En preparación") return "estado-libre-preparacion";
  if (estado === "Ocupada") return "estado-libre-ocupada";
  return "estado-libre-disponible";
}

function obtenerTextoEstadoMesa(pedidoMesa) {
  if (!pedidoMesa) return "Disponible";
  return pedidoMesa.estado || "Ocupada";
}

function renderizarMesas() {
  const gridMesas = document.getElementById("gridMesas");
  if (!gridMesas) return;

  const pedidosGuardados = obtenerPedidosGuardados();
  gridMesas.innerHTML = "";

  mesasConfiguracion.forEach(mesa => {
    const pedidoMesa = pedidosGuardados.find(p => Number(p.mesa) === Number(mesa.id));
    const estadoTexto = obtenerTextoEstadoMesa(pedidoMesa);
    const claseEstado = obtenerClaseEstadoMesa(estadoTexto);
    const personas = pedidoMesa ? Number(pedidoMesa.personas || 0) : 0;
    const accionTexto = pedidoMesa ? "Editar pedido" : "Tomar pedido";

    const card = document.createElement("a");
    card.href = `pedido.html?mesa=${mesa.id}`;
    card.className = `mesa-plano ${mesa.tipo} ${claseEstado} ${mesa.claseExtra}`;
    card.innerHTML = `
      <div class="mesa-forma">
        <span class="silla silla-1"></span>
        <span class="silla silla-2"></span>
        <span class="silla silla-3"></span>
        <span class="silla silla-4"></span>
        <span class="silla silla-5"></span>
        <span class="silla silla-6"></span>
        <span class="silla silla-7"></span>
        <span class="silla silla-8"></span>

        <div class="mesa-centro">
          <div class="mesa-numero">${mesa.numero}</div>
        </div>
      </div>

      <div class="mesa-info">
        <span class="badge-estado ${claseEstado}">${estadoTexto}</span>
        <span class="badge-personas">👥 ${personas}</span>
        <span class="badge-capacidad">Capacidad: ${mesa.capacidad}</span>
        <span class="mesa-accion">${accionTexto}</span>
      </div>
    `;

    gridMesas.appendChild(card);
  });
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
