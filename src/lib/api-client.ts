import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api";

const ACCESS_TOKEN_KEY = "psm_access_token";
const REFRESH_TOKEN_KEY = "psm_refresh_token";

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (Array.isArray(body?.message)) return body.message.join(", ");
    if (typeof body?.message === "string") return body.message;
  } catch {
    // réponse non-JSON, on retombe sur le statut
  }
  return `Erreur ${res.status}`;
}

async function rawFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = await getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res = await rawFetch(path, options);

  if (res.status === 401 && path !== "/auth/refresh") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawFetch(path, options);
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;
  try {
    const tokens = await refreshTokens(refreshToken);
    await setTokens(tokens.accessToken, tokens.refreshToken);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPatientPayload {
  telephone: string;
  idCmu?: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: "M" | "F";
  pin: string;
}

export function registerPatient(payload: RegisterPatientPayload): Promise<AuthTokens> {
  return apiFetch("/auth/register/patient", { method: "POST", body: JSON.stringify(payload) });
}

export function requestPatientOtp(telephone: string, pin: string): Promise<{ success: boolean }> {
  return apiFetch("/auth/patient/request-otp", {
    method: "POST",
    body: JSON.stringify({ telephone, pin }),
  });
}

export function verifyPatientOtp(telephone: string, pin: string): Promise<AuthTokens> {
  return apiFetch("/auth/patient/verify-otp", {
    method: "POST",
    body: JSON.stringify({ telephone, pin }),
  });
}

export function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  return apiFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function logoutRequest(refreshToken: string): Promise<{ success: boolean }> {
  return apiFetch("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) });
}

export function fetchMe(): Promise<Record<string, unknown>> {
  return apiFetch("/auth/me");
}

export type GenericOtpPurpose = "share" | "confirm_action";

export function requestGenericOtp(
  destinataire: string,
  purpose: GenericOtpPurpose,
): Promise<{ success: boolean; error?: string }> {
  return apiFetch("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ destinataire, purpose }),
  });
}

export function verifyGenericOtp(
  destinataire: string,
  purpose: GenericOtpPurpose,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  return apiFetch("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ destinataire, purpose, code }),
  });
}
