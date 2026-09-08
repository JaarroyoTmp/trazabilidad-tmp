export async function cargarPatronesDesdeSupabase(supabase) {
  if (!supabase) {
    return [
      {
        id: "1288",
        codigo: "1288",
        descripcion: "Banco TRIMOS TELMA 500 — Máquina de una coordenada horizontal",
        u_k2: 0.002,
        nota: "—"
      },
      {
        id: "180456",
        codigo: "180456",
        descripcion: "Juego de bloques patrón 0–100 mm",
        u_k2: 0.001,
        nota: "—"
      }
    ];
  }

  const { data, error } = await supabase
    .from("patrones")
    .select("*")
    .order("descripcion", { ascending: true });

  if (error) {
    console.warn("Error cargando patrones:", error);
    return [];
  }

  return data || [];
}