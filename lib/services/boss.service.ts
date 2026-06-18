const API = process.env.NEXT_PUBLIC_API_URL!;

export async function getAllBossesForLegajo(legajo: string): Promise<any> {
  const res = await fetch(`${API}people/bosses/getBosses/${legajo}`);
  if (!res.ok) throw new Error("No se pudieron cargar los jefes");
  return res.json();
}
