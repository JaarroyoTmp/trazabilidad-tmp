// Complete inventory loading for dashboard counters and lists.
// Exact count and stable order prevent accepting an API-limited first page as a total.
export async function loadAllInstruments(client, columns, pageSize = 500) {
  try {
    const data = [];
    const seen = new Set();
    let expected = null;
    for (;;) {
      const result = await client.from("instrumentos")
        .select("id," + columns, { count: "exact" })
        .order("id", { ascending: true }).range(data.length, data.length + pageSize - 1);
      if (result.error) throw result.error;
      if (!Array.isArray(result.data) || !Number.isSafeInteger(result.count) || result.count < 0)
        throw new Error("No se pudo confirmar el inventario completo.");
      if (expected !== null && expected !== result.count)
        throw new Error("El inventario cambió durante la carga. Actualiza la pantalla.");
      expected = result.count;
      for (const row of result.data) {
        if (!row.id || seen.has(row.id)) throw new Error("El inventario cambió durante la carga. Actualiza la pantalla.");
        seen.add(row.id);
        data.push(row);
      }
      if (data.length === expected) return { data, error: null };
      if (!result.data.length || data.length > expected)
        throw new Error("La carga del inventario está incompleta. Actualiza la pantalla.");
    }
  } catch (error) {
    return { data: null, error };
  }
}
