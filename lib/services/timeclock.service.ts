const API = process.env.NEXT_PUBLIC_API_URL!;

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("token") || localStorage.getItem("token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface TimeclockPeopleRef {
  id?: number;
  cuil?: string;
  file?: number | string;
  lastname_name?: string;
}

export interface TimeclockRecord {
  id: number;
  user_id?: number;
  date: string;
  hours: string;
  card?: string;
  group?: string;
  type_timeclock?: "entry" | "exit";
  type_exit_order_id: number;
  host: "RF_IN" | "RF_OUT" | null | string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  people?: TimeclockPeopleRef;
  cuil?: string;
  file?: number | string;
  /** Fallback fields seen on some backend variants; prefer the typed fields above when present. */
  datetime?: string;
  time?: string;
  type?: number | string;
  event_type?: number | string;
}

export interface TimeclockPaginatedResponse {
  data: TimeclockRecord[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  [key: string]: unknown;
}

export interface LoadTimeclockParams {
  date: string;
  limit?: number;
  page?: number;
  lastname_name?: string;
  type_exit_order_id?: number;
}

export async function loadTimeclockRecords(params: LoadTimeclockParams): Promise<TimeclockPaginatedResponse> {
  const res = await fetch(`${API}people/timeclock/get/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("No se pudieron cargar las fichadas");
  return res.json();
}
