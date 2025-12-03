declare module "https://gtplus.net/forms2/dcytDb/api/Cl_dcytDb.php?v251110-2150" {
  class Cl_dcytDb {
    constructor({ aliasCuenta } = { aliasCuenta: "" }) {}

    addRecord({
      tabla,
      registroAlias = null,
      object,
      callback,
    }: {
      tabla: string;
      registroAlias?: string | null;
      object: {};
      callback: ({ id, objects, error }: iResultAddObject) => void;
    }) {}

    editRecord({
      tabla,
      object,
      callback,
    }: {
      tabla: string;
      object: { id: number | null };
      callback: ({ objects, error }: iResultEditObject) => void;
    }) {}

    deleteRecord({
      tabla,
      object,
      callback,
    }: {
      tabla: string;
      object: { id: number | null };
      callback: ({ objects, error }: iResultEditObject) => void;
    }) {}

    listRecords({
      tabla,
      callback,
    }: {
      tabla: string;
      callback: ({ objects, error }: iResultObjects) => void;
    }) {}
  }

  // 2. Exporta esa clase como el valor 'default' del módulo.
  export default Cl_dcytDb;
}
