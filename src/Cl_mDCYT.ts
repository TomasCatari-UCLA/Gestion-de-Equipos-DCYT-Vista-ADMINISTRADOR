import Cl_dcytDb from "https://gtplus.net/forms2/dcytDb/api/Cl_dcytDb.php?v251110-2150";
import Cl_mEquipo, { iEquipo } from "./Cl_mEquipo.js";

interface iResultEquipos { objects: [iEquipo] | null; error: string | false; }

export default class Cl_mDCYT {
  private db: Cl_dcytDb;
  private equipos: Cl_mEquipo[]; 
  
  // CAMBIO: Tabla nueva para limpiar errores de tipos anteriores
  readonly tbEquipo: string = "tb_GestionEq"; 

  constructor() {
    this.db = new Cl_dcytDb({ aliasCuenta: "THE CODE RANGERS" });
    this.equipos = [];
  }

  cargar(callback: (error: string | false) => void): void {
    this.db.listRecords({
      tabla: this.tbEquipo,
      callback: ({ objects, error }: iResultEquipos) => {
        if (error) callback(`Error cargando: ${error}`);
        else {
          this.llenarEquipos(objects ?? []);
          callback(false);
        }
      },
    });
  }

  llenarEquipos(datos: iEquipo[]): void {
    this.equipos = [];
    datos.forEach((d) => this.equipos.push(new Cl_mEquipo(d)));
  }

  dtEquipos(): iEquipo[] { return this.equipos.map((d) => d.toJSON()); }

  buscarEquipo(serial: string): Cl_mEquipo | null {
    return this.equipos.find((d) => d.serial === serial) || null;
  }

  addEquipo({ dtEquipo, callback }: { dtEquipo: iEquipo; callback: (error: string | false) => void; }): void {
    let nuevoEquipo = new Cl_mEquipo(dtEquipo);
    
    // Validación de Duplicados
    if (this.equipos.find((d) => d.serial === dtEquipo.serial)) {
      callback(`El serial ${dtEquipo.serial} ya existe.`);
      return;
    }
    
    // Validación de Campos Vacíos
    if (nuevoEquipo.equipoOk !== true) {
        callback(nuevoEquipo.equipoOk as string);
        return;
    }
    
    this.db.addRecord({
      tabla: this.tbEquipo,
      registroAlias: dtEquipo.serial, 
      object: nuevoEquipo.toJSON(), 
      callback: ({ objects: data, error }: any) => {
        if (!error) this.llenarEquipos(data);
        callback?.(error);
      },
    });
  }

  // --- EDICIÓN CORREGIDA Y ROBUSTA ---
  editEquipo({ dtEquipo, callback }: { dtEquipo: iEquipo; callback: (error: string | boolean) => void; }): void {
    
    // 1. Buscar equipo original por ID (Prioridad)
    let equipoOriginal = this.equipos.find(e => e.id === dtEquipo.id);
    
    if (!equipoOriginal) {
        equipoOriginal = this.equipos.find(e => e.serial === dtEquipo.serial);
    }

    if (!equipoOriginal) {
        callback("Error: No se encuentra el equipo para editar.");
        return;
    }

    // 2. Validar datos nuevos antes de actualizar
    let tempValidador = new Cl_mEquipo(dtEquipo);
    if (tempValidador.equipoOk !== true) {
        callback(tempValidador.equipoOk as string);
        return;
    }

    // 3. Actualizar memoria local
    equipoOriginal.lab = dtEquipo.lab;
    equipoOriginal.cpu = dtEquipo.cpu;
    equipoOriginal.ram = dtEquipo.ram;
    equipoOriginal.estado = dtEquipo.estado;
    equipoOriginal.fila = dtEquipo.fila;
    equipoOriginal.puesto = dtEquipo.puesto;

    // 4. Construir objeto limpio para la BD
    // Esto soluciona el problema de que "no guarda la edición"
    const datosParaEnviar = {
        id: equipoOriginal.id,         
        serial: equipoOriginal.serial, // Serial no cambia
        lab: equipoOriginal.lab,
        cpu: equipoOriginal.cpu,
        ram: equipoOriginal.ram,
        estado: equipoOriginal.estado,
        fila: equipoOriginal.fila,
        puesto: equipoOriginal.puesto,
        creadoEl: equipoOriginal.creadoEl,
        alias: equipoOriginal.alias
    };

    // 5. Enviar a la nube
 this.db.editRecord({
        tabla: this.tbEquipo,
        object: datosParaEnviar, 
        callback: ({ error }: any) => { // Simplificamos el callback, ya no necesitamos 'data' aquí
          if (!error) {
            // Éxito en la base de datos. Ahora recargamos la lista completa
            this.cargar((err) => {
                if (err) {
                    callback(`Edición OK, pero error al recargar la lista: ${err}`);
                } else {
                    callback(false); // Éxito total.
                }
            });
          } else {
            callback(error);
          }
        },
    });
  }

  deleteEquipo({ serial, callback }: { serial: string; callback: (error: string | boolean) => void; }): void {
    let equipo = this.buscarEquipo(serial);
    if (!equipo) equipo = this.equipos.find(e => e.serial === "") || null;

    if (!equipo) {
      callback(`No existe el equipo.`);
      return;
    }
    this.db.deleteRecord({
      tabla: this.tbEquipo,
      object: { id: equipo.id },
      callback: ({ objects: data, error }: any) => {
        if (!error) this.llenarEquipos(data);
        callback?.(error);
      },
    });
  }
}