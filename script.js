// Referencias a las dos partes principales definidas en el boceto
const zoaDeChat = document.getElementById("zoa-de-chat");
const zonaRespuesta = document.getElementById("respuesta");

// Variables de estado en memoria (sin almacenamiento externo)
let arbolDecision = null;
let historialElecciones = []; // Guarda hasta 3 elecciones del usuario

// Inicia la carga del árbol de conversación al abrir la página
document.addEventListener("DOMContentLoaded", iniciarChatbot);

async function iniciarChatbot() {
    try {
        // Carga del archivo JSON externo
        const respuestaFetch = await fetch("arbol_decision.json");
        
        if (!respuestaFetch.ok) {
            throw new Error("Error HTTP al cargar el JSON");
        }

        arbolDecision = await respuestaFetch.json();
        reiniciarConversacion();
    } catch (error) {
        // Mensaje exacto requerido si falla la carga (ej. abrir con doble clic sin servidor local)
        mostrarMensaje(
            "Abrí el proyecto con Live Server o un servidor local para que pueda leer arbol_decision.json",
            "bot"
        );
    }
}

// Limpia el chat, vacía la memoria de elecciones y arranca desde el nodo inicial
function reiniciarConversacion() {
    zoaDeChat.innerHTML = "";
    historialElecciones = [];
    navegarANodo("inicio");
}

// Busca un nodo por su ID dentro del JSON y lo renderiza
function navegarANodo(idNodo) {
    if (!arbolDecision || !arbolDecision.nodos) return;

    const nodoActual = arbolDecision.nodos.find(nodo => nodo.id === idNodo);
    if (!nodoActual) return;

    // Si es el nodo de resumen, muestra las últimas elecciones recordadas
    if (idNodo === "ver_resumen" && historialElecciones.length > 0) {
        const listaRecuerdos = historialElecciones.map((item, i) => `${i + 1}. ${item}`).join("\n");
        mostrarMensaje(`${nodoActual.texto}\n${listaRecuerdos}`, "memoria");
    } else {
        mostrarMensaje(nodoActual.texto, "bot");
    }

    renderizarOpciones(nodoActual.opciones);
}

// Agrega un globo de texto en la "zoa de chat"
function mostrarMensaje(texto, tipo) {
    const divMensaje = document.createElement("div");
    divMensaje.classList.add("mensaje");

    if (tipo === "usuario") {
        divMensaje.classList.add("mensaje-usuario");
    } else if (tipo === "memoria") {
        divMensaje.classList.add("mensaje-memoria");
    } else {
        divMensaje.classList.add("mensaje-bot");
    }

    divMensaje.textContent = texto;
    zoaDeChat.appendChild(divMensaje);

    // Desplaza el scroll automáticamente hacia el último mensaje
    zoaDeChat.scrollTop = zoaDeChat.scrollHeight;
}

// Genera los botones cliqueables en la sección "respuesta"
function renderizarOpciones(opciones) {
    zonaRespuesta.innerHTML = "";

    opciones.forEach(opcion => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.classList.add("btn-opcion");
        boton.textContent = opcion.texto;

        // Estiliza botones de control (reiniciar o finalizar) para diferenciarlos
        if (opcion.siguiente === "inicio" || opcion.siguiente === "fin") {
            boton.classList.add("btn-secundario");
        }

        boton.addEventListener("click", () => {
            manejarSeleccion(opcion);
        });

        zonaRespuesta.appendChild(boton);
    });
}

// Procesa el clic del usuario, guarda la elección en memoria y avanza al siguiente nodo
function manejarSeleccion(opcion) {
    // Si el usuario elige volver a empezar desde el estado finalizado
    if (opcion.accion === "reiniciar") {
        reiniciarConversacion();
        return;
    }

    // Muestra la elección del usuario en la zoa de chat
    mostrarMensaje(opcion.texto, "usuario");

    // Registra las consultas temáticas (excluyendo botones de navegación general)
    const nodosNavegacion = ["inicio", "menu_retorno", "fin", "ver_resumen"];
    if (!nodosNavegacion.includes(opcion.siguiente)) {
        registrarEleccion(opcion.texto);
    }

    // Avanza al nodo indicado por "siguiente"
    navegarANodo(opcion.siguiente);
}

// Mantiene un registro máximo de las últimas 3 elecciones del usuario
function registrarEleccion(textoEleccion) {
    historialElecciones.push(textoEleccion);
    if (historialElecciones.length > 3) {
        historialElecciones.shift();
    }
}
