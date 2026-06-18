const MGMT_API = process.env.NEXT_PUBLIC_MANAGEMENT_API_URL!;

export async function whitenKey(data: { username: string; newpassword: string; token: string }): Promise<any> {
  const formData = new FormData();
  formData.append("newpassword", data.newpassword);
  formData.append("token", data.token);
  formData.append("username", data.username);

  const res = await fetch(MGMT_API, { method: "POST", body: formData });
  if (!res.ok) throw new Error("No se pudo blanquear la clave");
  return res.json();
}
