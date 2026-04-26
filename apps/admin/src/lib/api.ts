import axios, { type AxiosError } from "axios";
import { getToken, isTokenExpired, clearToken, setToken, setRefreshToken, getRefreshToken } from "./token";
import type { AuthResponse, LoginRequest, Ticket, SetupResponse, RegisterRequest, PaginatedResponse, TicketsFilters } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";
const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8080";
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? "master";
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "account";
const KEYCLOAK_REDIRECT_URI = import.meta.env.VITE_KEYCLOAK_REDIRECT_URI ?? `${window.location.origin}/login/callback`;

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let pendingRequests: Array<(token: string | null) => void> = [];

async function doRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearToken();
    return null;
  }

  if (isRefreshing) {
    return new Promise((resolve) => {
      pendingRequests.push(resolve);
    });
  }

  isRefreshing = true;

  try {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    const newToken = response.data.token;
    setToken(newToken, response.data.expiresIn || 300);
    setRefreshToken(response.data.refreshToken || newToken);
    
    const resolvers = pendingRequests;
    pendingRequests = [];
    resolvers.forEach((resolve) => resolve(newToken));
    
    isRefreshing = false;
    return newToken;
  } catch {
    clearToken();
    
    const resolvers = pendingRequests;
    pendingRequests = [];
    resolvers.forEach((resolve) => resolve(null));
    
    isRefreshing = false;
    return null;
  }
}

client.interceptors.request.use(async (config) => {
  const token = getToken();
  
  if (!token) {
    return config;
  }

  if (isTokenExpired()) {
    const newToken = await doRefreshToken();
    if (newToken) {
      config.headers.Authorization = `Bearer ${newToken}`;
    }
    return config;
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const api = {
  checkSetup: () =>
    client.get<SetupResponse>("/auth/setup").then((r) => r.data),

  register: (data: RegisterRequest) =>
    client.post<{ id: string; email: string; displayName: string | null }>("/auth/register", data).then((r) => r.data),

  login: (data: LoginRequest) =>
    client.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  loginWithKeycloak: (code: string) =>
    client.post<AuthResponse>("/auth/keycloak/callback", { code }).then((r) => {
      setToken(r.data.token, r.data.expiresIn || 300);
      setRefreshToken(r.data.refreshToken || r.data.token);
      return r.data;
    }),

  getMe: () =>
    client.get<{ user: AuthResponse["user"] }>("/auth/me").then((r) => r.data),

  getTickets: (filters?: TicketsFilters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.priority) params.set("priority", filters.priority);
    if (filters?.q) params.set("q", filters.q);
    if (filters?.sortBy) params.set("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit !== undefined) params.set("limit", String(filters.limit));
    
    const query = params.toString() ? `?${params.toString()}` : "";
    return client.get<PaginatedResponse<Ticket>>(`/admin/tickets${query}`).then((r) => r.data);
  },

  getTicket: (id: string) =>
    client.get<Ticket>(`/admin/tickets/${id}`).then((r) => r.data),

  updateTicketStatus: (id: string, status: string) =>
    client.patch<Ticket>(`/admin/tickets/${id}/status`, { status }).then((r) => r.data),
};

export function getKeycloakAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: KEYCLOAK_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
  });
  return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?${params}`;
}

export { API_BASE_URL };