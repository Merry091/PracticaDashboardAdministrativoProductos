const API_URL = "https://dummyjson.com/products";
let skip = 0;
const limit = 10;
let totalProductos = 0;

const tablaBody = document.getElementById("tabla-body");
const infoPagina = document.getElementById("infoPagina");
const selectCategoria = document.getElementById("filtroCategoria");
const contenedorDetalle = document.getElementById("detalle-producto");

document.addEventListener("DOMContentLoaded", () => {
    if (tablaBody) {
        cargarCategorias();
        cargarProductos();
    } else if (contenedorDetalle) {
        cargarDetalleProducto();
    }
});

const cargarProductos = () => {
    const busqueda = document.getElementById("buscador").value;
    const categoria = selectCategoria ? selectCategoria.value : "";
    const orden = document.getElementById("ordenarPor").value;

    let url = `${API_URL}?limit=${limit}&skip=${skip}`;

    if (busqueda) {
        url = `${API_URL}/search?q=${busqueda}&limit=${limit}&skip=${skip}`;
    } else if (categoria) {
        url = `${API_URL}/category/${categoria}?limit=${limit}&skip=${skip}`;
    }

    if (orden) {
        const [campo, tipo] = orden.split("-");
        url += `&sortBy=${campo}&order=${tipo}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(data => {
            totalProductos = data.total;
            renderizarTabla(data.products);
            actualizarPaginacion();
        });
};

const renderizarTabla = (productos) => {
    tablaBody.innerHTML = "";
    
    if (productos.length === 0) {
        tablaBody.innerHTML = "<tr><td colspan='6' style='text-align:center'>No se encontraron productos.</td></tr>";
        return;
    }

    productos.forEach(prod => {
        const fila = `
            <tr id="fila-${prod.id}">
                <td>${prod.id}</td>
                <td><img src="${prod.thumbnail}" class="img-tabla" alt="img"></td>
                <td>${prod.title}</td>
                <td>${prod.category}</td>
                <td style="color:green; font-weight:bold;">$${prod.price}</td>
                <td>
                    <a href="detalles.html?id=${prod.id}" class="btn-ver">Ver</a>
                    <button class="btn-editar" onclick="prepararEdicion('${prod.id}', '${prod.title}', '${prod.price}')">Editar</button>
                    <button class="btn-borrar" onclick="borrarProducto(${prod.id})">X</button>
                </td>
            </tr>
        `;
        tablaBody.innerHTML += fila;
    });
};

const cambiarPagina = (direccion) => {
    const nuevoSkip = skip + (direccion * limit);
    if (nuevoSkip >= 0 && nuevoSkip < totalProductos) {
        skip = nuevoSkip;
        cargarProductos();
    }
};

const actualizarPaginacion = () => {
    const paginaActual = Math.floor(skip / limit) + 1;
    if(infoPagina) infoPagina.innerText = `Página ${paginaActual}`;
};

const cargarCategorias = () => {
    fetch('https://dummyjson.com/products/category-list')
        .then(res => res.json())
        .then(cats => {
            cats.forEach(c => {
                const nombreCat = typeof c === 'string' ? c : c.name;
                selectCategoria.innerHTML += `<option value="${nombreCat}">${nombreCat}</option>`;
            });
        });
};

window.buscarProductos = () => { skip = 0; cargarProductos(); };
window.filtrarPorCategoria = () => { skip = 0; document.getElementById("buscador").value = ""; cargarProductos(); };
window.ordenarProductos = () => { cargarProductos(); };
window.cambiarPagina = cambiarPagina;

window.borrarProducto = (id) => {
    if(confirm("¿Seguro que deseas eliminar el producto ID " + id + "?")) {
        fetch(`${API_URL}/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
            const fila = document.getElementById(`fila-${id}`);
            if(fila) fila.remove();
            alert("Producto eliminado");
        });
    }
};

const modal = document.getElementById("modalProducto");
const inputId = document.getElementById("inputId");
const inputTitulo = document.getElementById("inputTitulo");
const inputPrecio = document.getElementById("inputPrecio");

window.abrirModal = () => {
    inputId.value = "";
    inputTitulo.value = "";
    inputPrecio.value = "";
    document.getElementById("tituloModal").innerText = "Nuevo Producto";
    modal.style.display = "flex";
};

window.cerrarModal = () => { modal.style.display = "none"; };

window.prepararEdicion = (id, titulo, precio) => {
    inputId.value = id;
    inputTitulo.value = titulo;
    inputPrecio.value = precio;
    document.getElementById("tituloModal").innerText = "Editar Producto " + id;
    modal.style.display = "flex";
};

window.guardarProducto = () => {
    const id = inputId.value;
    const metodo = id ? 'PUT' : 'POST';
    const urlEndpoint = id ? `${API_URL}/${id}` : `${API_URL}/add`;

    const datos = {
        title: inputTitulo.value,
        price: inputPrecio.value
    };

    fetch(urlEndpoint, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
    .then(res => res.json())
    .then(() => {
        alert(`Operación ${metodo} exitosa`);
        cerrarModal();
    });
};

const cargarDetalleProducto = () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) return;

    fetch(`${API_URL}/${id}`)
        .then(res => res.json())
        .then(prod => {
            let htmlComentarios = "";
            if (prod.reviews) {
                prod.reviews.forEach(com => {
                    htmlComentarios += `
                        <div class="comentario-item">
                            <strong>${com.reviewerName}</strong>: ${com.comment} 
                            <br><small>Calificación: ${com.rating} ★</small>
                        </div>`;
                });
            } else {
                htmlComentarios = "<p>No hay comentarios.</p>";
            }

            contenedorDetalle.innerHTML = `
                <h1>${prod.title}</h1>
                <img src="${prod.thumbnail}" class="imagen-grande">
                <p>${prod.description}</p>
                <h2 class="precio">$${prod.price}</h2>
                <p class="categoria">Categoría: ${prod.category}</p>
                <div class="comentarios-seccion">
                    <h3>Comentarios</h3>
                    ${htmlComentarios}
                </div>
            `;
        });
};