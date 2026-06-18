import axios from "axios";

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export async function login(credentials: LoginCredentials): Promise<KeycloakTokenResponse> {
  const response = await axios.post<KeycloakTokenResponse>(
    `${BASE_API_URL}auth`,
    { username: credentials.username, password: credentials.password },
    { headers: { "Content-Type": "application/json" } }
  );

  return response.data;
}

export async function validateToken(bearerToken: string): Promise<{ usuario: { email: string } }> {
  const response = await axios.get(`${BASE_API_URL}auth`, {
    headers: { Authorization: bearerToken },
  });
  return response.data;
}
