import axios from "axios";

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
const REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
const CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET;
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
  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("client_id", CLIENT_ID!);
  params.append("client_secret", CLIENT_SECRET!);
  params.append("username", credentials.username);
  params.append("password", credentials.password);

  const response = await axios.post<KeycloakTokenResponse>(
    `${KEYCLOAK_URL}realms/${REALM}/protocol/openid-connect/token`,
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return response.data;
}

export async function validateToken(bearerToken: string): Promise<{ usuario: { email: string } }> {
  const response = await axios.get(`${BASE_API_URL}validate-token`, {
    headers: { Authorization: bearerToken },
  });
  return response.data;
}
