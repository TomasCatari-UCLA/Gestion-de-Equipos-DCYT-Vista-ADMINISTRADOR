import Cl_controlador from "./Cl_controlador.js";
import Cl_mEquipo, { iEquipo, LISTA_ESTADOS, LISTA_LABORATORIOS } from "./Cl_mEquipo.js";
import Cl_vEquipo from "./Cl_vEquipo.js";
import Cl_vGeneral, { tHTMLElement } from "./tools/Cl_vGeneral.js";
import { opcionFicha } from "./tools/core.tools.js";

export default class Cl_vDCYT extends Cl_vGeneral {
  private vEquipo: Cl_vEquipo;
  
  // Botones Superiores
  private btAgregar: HTMLButtonElement;
  private btBuscar: HTMLButtonElement;
  private btQuitarFiltro: HTMLButtonElement; 

  private divTabla: HTMLDivElement;
  
  private lblTotal: HTMLElement; private lblOperativos: HTMLElement; 
  private lblReparacion: HTMLElement; private lblDañado: HTMLElement;

  private modalEliminar: HTMLElement; private btConfirmarSi: HTMLButtonElement; private btConfirmarNo: HTMLButtonElement; private serialPendiente: string | null = null;

  // --- ELEMENTOS DE BÚSQUEDA ---
  private modalBuscar: HTMLElement;
  private inBusSerial: HTMLInputElement; 
  private divBusLab: HTMLDivElement; 
  private divBusEstado: HTMLDivElement;
  private inBusCpu: HTMLInputElement;
  private inBusRam: HTMLInputElement;
  private inBusFila: HTMLInputElement;
  private inBusPuesto: HTMLInputElement;
  
  private btBuscarCancelar: HTMLButtonElement; 
  private btBuscarAceptar: HTMLButtonElement;

  constructor() {
    super({ formName: "dcyt" });
    this.vEquipo = new Cl_vEquipo();
    this.vEquipo.show({ ver: false });

    this.btAgregar = this.crearHTMLButtonElement("btAgregar", { onclick: () => this.addEquipo(), });
    this.btBuscar = this.crearHTMLButtonElement("btBuscar", { onclick: () => this.abrirBusqueda(), });
    
    this.btQuitarFiltro = this.crearHTMLButtonElement("btQuitarFiltro", { 
        onclick: () => this.limpiarFiltro(), 
    });
    this.btQuitarFiltro.innerText = "* Quitar Filtro";

    this.divTabla = this.crearHTMLElement("divTabla", { type: tHTMLElement.CONTAINER, refresh: () => this.mostrarEquipos(), }) as HTMLDivElement;
    
    this.lblTotal = document.getElementById("lblTotal") as HTMLElement;
    this.lblOperativos = document.getElementById("lblOperativos") as HTMLElement;
    this.lblReparacion = document.getElementById("lblReparacion") as HTMLElement;
    this.lblDañado = document.getElementById("lblDañado") as HTMLElement;

    this.modalEliminar = document.getElementById("modalEliminar") as HTMLElement;
    this.btConfirmarSi = document.getElementById("btConfirmarSi") as HTMLButtonElement;
    this.btConfirmarSi.onclick = () => this.ejecutarBorrado();
    this.btConfirmarNo = document.getElementById("btConfirmarNo") as HTMLButtonElement;
    this.btConfirmarNo.onclick = () => this.ocultarModalBorrado();

    // --- CONEXIÓN BÚSQUEDA ---
    this.modalBuscar = document.getElementById("modalBuscar") as HTMLElement;
    this.inBusSerial = document.getElementById("bus_inSerial") as HTMLInputElement;
    this.inBusCpu = document.getElementById("bus_inCpu") as HTMLInputElement;
    this.inBusRam = document.getElementById("bus_inRam") as HTMLInputElement;
    this.inBusFila = document.getElementById("bus_inFila") as HTMLInputElement;
    this.inBusPuesto = document.getElementById("bus_inPuesto") as HTMLInputElement;

    this.divBusLab = document.getElementById("bus_divLab") as HTMLDivElement;
    this.divBusEstado = document.getElementById("bus_divEstado") as HTMLDivElement;

    this.llenarCheckboxes(this.divBusLab, LISTA_LABORATORIOS, "chk_lab");
    this.llenarCheckboxes(this.divBusEstado, LISTA_ESTADOS, "chk_est");

    this.btBuscarCancelar = document.getElementById("btBuscarCancelar") as HTMLButtonElement;
    this.btBuscarCancelar.onclick = () => this.ocultarBusqueda();
    this.btBuscarAceptar = document.getElementById("btBuscarAceptar") as HTMLButtonElement;
    this.btBuscarAceptar.onclick = () => this.ejecutarBusqueda();
  }

  set controlador(controlador: Cl_controlador) { super.controlador = controlador; this.vEquipo.controlador = controlador; }
  get controlador(): Cl_controlador | null { return super.controlador; }

  llenarCheckboxes(container: HTMLDivElement, datos: string[], nameGroup: string) {
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

  obtenerSeleccionados(container: HTMLDivElement): string[] {
      const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
      return Array.from(checkboxes).map((cb: any) => cb.value);
  }

  // --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE ---
  mostrarEquipos(listaFiltrada?: iEquipo[]) {
    this.divTabla.innerHTML = ""; 
    
    // 'equipos' tendrá la lista filtrada O la lista total si no hay filtro
    let equipos = listaFiltrada ? listaFiltrada : this.controlador?.dtEquipos;
    if (!equipos) return;

    // Manejo de botones (Mostrar "Quitar Filtro" si es una búsqueda)
    if (listaFiltrada) {
        this.btQuitarFiltro.style.display = "flex"; 
        this.btBuscar.style.display = "flex";      
        this.btAgregar.style.display = "none";      
    } else {
        this.btQuitarFiltro.style.display = "none"; 
        this.btBuscar.style.display = "flex";       
        this.btAgregar.style.display = "flex";      
    }

    // --- CORRECCIÓN DE ESTADÍSTICAS ---
    // Antes usábamos 'totalReal', ahora usamos 'equipos' (que es lo que se ve en pantalla)
    let total = equipos.length;
    let operativos = equipos.filter(e => e.estado === "Operativo").length;
    let reparacion = equipos.filter(e => e.estado === "En Mantenimiento").length;
    let danado = equipos.filter(e => e.estado === "Dañado").length;

    if(this.lblTotal) this.lblTotal.innerHTML = total.toString();
    if(this.lblOperativos) this.lblOperativos.innerHTML = operativos.toString();
    if(this.lblReparacion) this.lblReparacion.innerHTML = reparacion.toString();
    if(this.lblDañado) this.lblDañado.innerHTML = danado.toString();
    
    // Renderizado de tarjetas (Igual que antes)
    let html = "";
    if (equipos.length === 0) html = `<div style="text-align:center; padding:20px; color:#666;">No se encontraron resultados 🔍</div>`;

    equipos.forEach((equipo: iEquipo, index: number) => {
      let claseColor = "";
      if(equipo.estado === "Operativo") claseColor = "txt-green";
      if(equipo.estado === "En Mantenimiento") claseColor = "txt-yellow";
      if(equipo.estado === "Dañado") claseColor = "txt-red";
      
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
    
    equipos.forEach((equipo: iEquipo, index: number) => {
      let btnC = document.getElementById(`dcyt_btConsultar_${index}`); if(btnC) btnC.onclick = () => this.consultarEquipo(equipo.serial);
      let btnE = document.getElementById(`dcyt_btEditar_${index}`); if(btnE) btnE.onclick = () => this.editarEquipo(equipo.serial);
      let btnD = document.getElementById(`dcyt_btEliminar_${index}`); if(btnD) btnD.onclick = () => this.pedirConfirmacion(equipo.serial);
    });
  }

  abrirBusqueda() { 
      this.inBusSerial.value = ""; 
      this.inBusCpu.value = ""; 
      this.inBusRam.value = "";
      this.inBusFila.value = ""; 
      this.inBusPuesto.value = "";
      
      const checks = this.modalBuscar.querySelectorAll('input[type="checkbox"]');
      checks.forEach((c: any) => c.checked = false);
      
      this.modalBuscar.style.display = "flex"; 
  }
  
  ocultarBusqueda() { 
      this.modalBuscar.style.display = "none"; 
  }
  
  limpiarFiltro() {
      this.mostrarEquipos(); 
  }

  ejecutarBusqueda() {
      let sSerial = this.inBusSerial.value.trim().toLowerCase();
      let sCpu = this.inBusCpu.value.trim().toLowerCase();
      let sRam = this.inBusRam.value.trim();
      let sFila = this.inBusFila.value.trim().toLowerCase();
      let sPuesto = this.inBusPuesto.value.trim().toLowerCase();

      let sLabs = this.obtenerSeleccionados(this.divBusLab);
      let sEstados = this.obtenerSeleccionados(this.divBusEstado);

      let todos = this.controlador?.dtEquipos || [];
      
      let filtrados = todos.filter((e: iEquipo) => {
          let coincide = true;

          if (sSerial && !e.serial.toLowerCase().includes(sSerial)) coincide = false;
          if (sCpu && !e.cpu.toLowerCase().includes(sCpu)) coincide = false;
          if (sRam && String(e.ram) !== sRam) coincide = false;
          if (sFila && e.fila.toLowerCase() !== sFila) coincide = false;
          if (sPuesto && e.puesto.toLowerCase() !== sPuesto) coincide = false;

          if (sLabs.length > 0 && !sLabs.includes(e.lab)) coincide = false;
          if (sEstados.length > 0 && !sEstados.includes(e.estado)) coincide = false;

          return coincide;
      });

      this.ocultarBusqueda();
      this.mostrarEquipos(filtrados);
  }

  addEquipo() { this.controlador?.activarVista({ vista: "equipo", opcion: opcionFicha.add, }); }
  consultarEquipo(serial: string) { let equipo = this.controlador?.equipo(serial); if (equipo) this.controlador?.activarVista({ vista: "equipo", opcion: opcionFicha.read, objeto: equipo, }); }
  editarEquipo(serial: string) { let equipo = this.controlador?.equipo(serial); if (equipo) this.controlador?.activarVista({ vista: "equipo", opcion: opcionFicha.edit, objeto: equipo, }); }
  pedirConfirmacion(serial: string) { this.serialPendiente = serial; this.modalEliminar.style.display = "flex"; }
  ocultarModalBorrado() { this.serialPendiente = null; this.modalEliminar.style.display = "none"; }
  ejecutarBorrado() { if (this.serialPendiente !== null) { this.controlador?.deleteEquipo({ serial: this.serialPendiente, callback: (error) => { this.ocultarModalBorrado(); if (error) alert("Error: " + error); else this.mostrarEquipos(); }, }); } }

  activarVista({ vista, opcion, objeto }: { vista: string; opcion?: opcionFicha; objeto?: Cl_mEquipo; }): void {
    if (vista === "dcyt") { this.show({ ver: true }); this.mostrarEquipos(); this.vEquipo.show({ ver: false }); } 
    else { this.show({ ver: false }); this.vEquipo.show({ ver: true, equipo: objeto, opcion }); }
  }
}