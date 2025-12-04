import { LISTA_ESTADOS, LISTA_LABORATORIOS, } from "./Cl_mEquipo.js";
import Cl_vEquipo from "./Cl_vEquipo.js";
import Cl_vGeneral, { tHTMLElement } from "./tools/Cl_vGeneral.js";
import { opcionFicha } from "./tools/core.tools.js";
export default class Cl_vDCYT extends Cl_vGeneral {
    constructor() {
        super({ formName: "dcyt" });
        this.serialPendiente = null;
        this.vEquipo = new Cl_vEquipo();
        this.vEquipo.show({ ver: false });
        this.btAgregar = this.crearHTMLButtonElement("btAgregar", {
            onclick: () => this.addEquipo(),
        });
        this.btBuscar = this.crearHTMLButtonElement("btBuscar", {
            onclick: () => this.abrirBusqueda(),
        });
        this.btQuitarFiltro = this.crearHTMLButtonElement("btQuitarFiltro", {
            onclick: () => this.limpiarFiltro(),
        });
        this.btQuitarFiltro.innerText = "* Quitar Filtro";
        this.divTabla = this.crearHTMLElement("divTabla", {
            type: tHTMLElement.CONTAINER,
            refresh: () => this.mostrarEquipos(),
        });
        this.lblTotal = document.getElementById("lblTotal");
        this.lblOperativos = document.getElementById("lblOperativos");
        this.lblReparacion = document.getElementById("lblReparacion");
        this.lblDañado = document.getElementById("lblDañado");
        this.modalEliminar = document.getElementById("modalEliminar");
        this.btConfirmarSi = document.getElementById("btConfirmarSi");
        this.btConfirmarSi.onclick = () => this.ejecutarBorrado();
        this.btConfirmarNo = document.getElementById("btConfirmarNo");
        this.btConfirmarNo.onclick = () => this.ocultarModalBorrado();
        // --- CONEXIÓN BÚSQUEDA ---
        this.modalBuscar = document.getElementById("modalBuscar");
        this.inBusSerial = document.getElementById("bus_inSerial");
        this.inBusCpu = document.getElementById("bus_inCpu");
        this.inBusRam = document.getElementById("bus_inRam");
        this.inBusFila = document.getElementById("bus_inFila");
        this.inBusPuesto = document.getElementById("bus_inPuesto");
        // CAMBIO: Conectamos los DIVS contenedores de checkboxes en lugar de selects
        this.divBusLab = document.getElementById("bus_divLab");
        this.divBusEstado = document.getElementById("bus_divEstado");
        // CAMBIO: Llenamos los checkboxes dinámicamente usando las listas importadas
        this.llenarCheckboxes(this.divBusLab, LISTA_LABORATORIOS, "chk_lab");
        this.llenarCheckboxes(this.divBusEstado, LISTA_ESTADOS, "chk_est");
        this.btBuscarCancelar = document.getElementById("btBuscarCancelar");
        this.btBuscarCancelar.onclick = () => this.ocultarBusqueda();
        this.btBuscarAceptar = document.getElementById("btBuscarAceptar");
        this.btBuscarAceptar.onclick = () => this.ejecutarBusqueda();
    }
    set controlador(controlador) {
        super.controlador = controlador;
        this.vEquipo.controlador = controlador;
    }
    get controlador() {
        return super.controlador;
    }
    // --- NUEVO MÉTODO AUXILIAR PARA CREAR CHECKBOXES ---
    llenarCheckboxes(container, datos, nameGroup) {
        container.innerHTML = "";
        datos.forEach((dato, index) => {
            let wrapper = document.createElement("div");
            wrapper.className = "checkbox-item";
            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = dato;
            checkbox.id = `${nameGroup}_${index}`;
            checkbox.name = nameGroup;
            let label = document.createElement("label");
            label.htmlFor = `${nameGroup}_${index}`;
            label.innerText = dato;
            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
        });
    }
    // --- NUEVO MÉTODO AUXILIAR PARA LEER SELECCIONADOS ---
    obtenerSeleccionados(container) {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
        // Convertimos NodeList a Array de strings (los valores seleccionados)
        return Array.from(checkboxes).map((cb) => cb.value);
    }
    mostrarEquipos(listaFiltrada) {
        var _a, _b;
        this.divTabla.innerHTML = "";
        let equipos = listaFiltrada ? listaFiltrada : (_a = this.controlador) === null || _a === void 0 ? void 0 : _a.dtEquipos;
        if (!equipos)
            return;
        if (listaFiltrada) {
            this.btQuitarFiltro.style.display = "flex";
            this.btBuscar.style.display = "flex";
            this.btAgregar.style.display = "none";
        }
        else {
            this.btQuitarFiltro.style.display = "none";
            this.btBuscar.style.display = "flex";
            this.btAgregar.style.display = "flex";
        }
        // Stats globales (siempre sobre el total real)
        let totalReal = ((_b = this.controlador) === null || _b === void 0 ? void 0 : _b.dtEquipos) || [];
        let total = totalReal.length;
        let operativos = totalReal.filter((e) => e.estado === "Operativo").length;
        let reparacion = totalReal.filter((e) => e.estado === "En Mantenimiento").length;
        let danado = totalReal.filter((e) => e.estado === "Dañado").length;
        if (this.lblTotal)
            this.lblTotal.innerHTML = total.toString();
        if (this.lblOperativos)
            this.lblOperativos.innerHTML = operativos.toString();
        if (this.lblReparacion)
            this.lblReparacion.innerHTML = reparacion.toString();
        if (this.lblDañado)
            this.lblDañado.innerHTML = danado.toString();
        let html = "";
        if (equipos.length === 0)
            html = `<div style="text-align:center; padding:20px; color:#666;">No se encontraron resultados 🔍</div>`;
        equipos.forEach((equipo, index) => {
            let claseColor = "";
            if (equipo.estado === "Operativo")
                claseColor = "txt-green";
            if (equipo.estado === "En Mantenimiento")
                claseColor = "txt-yellow";
            if (equipo.estado === "Dañado")
                claseColor = "txt-red";
            html += `<div class="card">
                <div class="card-content">
                    <div class="card-title">${equipo.lab} Fila:${equipo.fila} Puesto:${equipo.puesto}</div>
                    <div class="card-detail"> <b>Serial:</b> ${equipo.serial || "N/A"} | <b> Equipo:</b> ${equipo.cpu} - <b> RAM:</b> ${equipo.ram}GB</div>
                    <div class="card-status ${claseColor}"><span class="status-dot">●</span> ${equipo.estado}</div>
                </div>
                <div class="card-actions">
                    <button class="action-link link-blue" id="dcyt_btConsultar_${index}"><span>👁️</span> Consultar</button>
                    <button class="action-link link-blue" id="dcyt_btEditar_${index}"><span>✏️</span> Editar</button>
                    <button class="action-link link-red" id="dcyt_btEliminar_${index}"><span>🗑️</span> Eliminar</button>
                </div>
               </div>`;
        });
        this.divTabla.innerHTML = html;
        equipos.forEach((equipo, index) => {
            let btnC = document.getElementById(`dcyt_btConsultar_${index}`);
            if (btnC)
                btnC.onclick = () => this.consultarEquipo(equipo.serial);
            let btnE = document.getElementById(`dcyt_btEditar_${index}`);
            if (btnE)
                btnE.onclick = () => this.editarEquipo(equipo.serial);
            let btnD = document.getElementById(`dcyt_btEliminar_${index}`);
            if (btnD)
                btnD.onclick = () => this.pedirConfirmacion(equipo.serial);
        });
    }
    abrirBusqueda() {
        // Limpiamos Inputs de texto
        this.inBusSerial.value = "";
        this.inBusCpu.value = "";
        this.inBusRam.value = "";
        this.inBusFila.value = "";
        this.inBusPuesto.value = "";
        // CAMBIO: Limpiar checkboxes (desmarcarlos todos al abrir)
        const checks = this.modalBuscar.querySelectorAll('input[type="checkbox"]');
        checks.forEach((c) => (c.checked = false));
        this.modalBuscar.style.display = "flex";
    }
    ocultarBusqueda() {
        this.modalBuscar.style.display = "none";
    }
    limpiarFiltro() {
        this.mostrarEquipos(); // Muestra todos (pasando undefined)
    }
    ejecutarBusqueda() {
        var _a;
        // 1. Obtener valores inputs texto
        let sSerial = this.inBusSerial.value.trim().toLowerCase();
        let sCpu = this.inBusCpu.value.trim().toLowerCase();
        let sRam = this.inBusRam.value.trim();
        let sFila = this.inBusFila.value.trim().toLowerCase();
        let sPuesto = this.inBusPuesto.value.trim().toLowerCase();
        // 2. CAMBIO: Obtener Arrays de Checkboxes seleccionados
        let sLabs = this.obtenerSeleccionados(this.divBusLab); // Ej: ["Lab-01", "Lab-03"]
        let sEstados = this.obtenerSeleccionados(this.divBusEstado); // Ej: ["Dañado"]
        let todos = ((_a = this.controlador) === null || _a === void 0 ? void 0 : _a.dtEquipos) || [];
        // 3. LOGICA DE FILTRO ACTUALIZADA
        let filtrados = todos.filter((e) => {
            let coincide = true;
            // Filtros de texto (igual que antes)
            if (sSerial && !e.serial.toLowerCase().includes(sSerial))
                coincide = false;
            if (sCpu && !e.cpu.toLowerCase().includes(sCpu))
                coincide = false;
            if (sRam && String(e.ram) !== sRam)
                coincide = false;
            if (sFila && e.fila.toLowerCase() !== sFila)
                coincide = false;
            if (sPuesto && e.puesto.toLowerCase() !== sPuesto)
                coincide = false;
            // CAMBIO: Lógica Checkbox para Laboratorio
            // Si el usuario seleccionó AL MENOS UN laboratorio, el equipo debe pertenecer a uno de ellos.
            // Si no seleccionó ninguno (sLabs.length === 0), ignoramos el filtro (trae todos).
            if (sLabs.length > 0 && !sLabs.includes(e.lab))
                coincide = false;
            // CAMBIO: Lógica Checkbox para Estado
            if (sEstados.length > 0 && !sEstados.includes(e.estado))
                coincide = false;
            return coincide;
        });
        this.ocultarBusqueda();
        // 4. Mostrar resultados filtrados
        this.mostrarEquipos(filtrados);
    }
    addEquipo() {
        var _a;
        (_a = this.controlador) === null || _a === void 0 ? void 0 : _a.activarVista({
            vista: "equipo",
            opcion: opcionFicha.add,
        });
    }
    consultarEquipo(serial) {
        var _a, _b;
        let equipo = (_a = this.controlador) === null || _a === void 0 ? void 0 : _a.equipo(serial);
        if (equipo)
            (_b = this.controlador) === null || _b === void 0 ? void 0 : _b.activarVista({
                vista: "equipo",
                opcion: opcionFicha.read,
                objeto: equipo,
            });
    }
    editarEquipo(serial) {
        var _a, _b;
        let equipo = (_a = this.controlador) === null || _a === void 0 ? void 0 : _a.equipo(serial);
        if (equipo)
            (_b = this.controlador) === null || _b === void 0 ? void 0 : _b.activarVista({
                vista: "equipo",
                opcion: opcionFicha.edit,
                objeto: equipo,
            });
    }
    pedirConfirmacion(serial) {
        this.serialPendiente = serial;
        this.modalEliminar.style.display = "flex";
    }
    ocultarModalBorrado() {
        this.serialPendiente = null;
        this.modalEliminar.style.display = "none";
    }
    ejecutarBorrado() {
        var _a;
        if (this.serialPendiente !== null) {
            (_a = this.controlador) === null || _a === void 0 ? void 0 : _a.deleteEquipo({
                serial: this.serialPendiente,
                callback: (error) => {
                    this.ocultarModalBorrado();
                    if (error)
                        alert("Error: " + error);
                    else
                        this.mostrarEquipos();
                },
            });
        }
    }
    activarVista({ vista, opcion, objeto, }) {
        if (vista === "dcyt") {
            this.show({ ver: true });
            this.mostrarEquipos();
            this.vEquipo.show({ ver: false });
        }
        else {
            this.show({ ver: false });
            this.vEquipo.show({ ver: true, equipo: objeto, opcion });
        }
    }
}
