const API = process.env.NEXT_PUBLIC_API_URL!;

export async function createWithLegajoTwo(data: {
  file: string;
  type: string;
  cuilBoss: string;
}): Promise<any> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token-for-exit-order-logout")
      : null;

  const res = await fetch(
    `${API}workflow/webservice/personal/exit-order/requestDepartureOrderWithFile`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) throw new Error("No se pudo crear la orden");
  return res.json();
}
