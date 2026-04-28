import axios from "axios";
import { AxiosHeaders } from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

export const ADMIN_AUTH_STORAGE_KEY = "kasbnoma_admin_key";

const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

export function getStoredAdminKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) ?? "";
}

export function setStoredAdminKey(value: string): void {
  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, value);
}

export function clearStoredAdminKey(): void {
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
}

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

const shouldDebugApi = import.meta.env.DEV || import.meta.env.VITE_API_DEBUG === "true";

type TimedConfig = InternalAxiosRequestConfig & {
  metadata?: {
    startedAt: number;
  };
};

api.interceptors.request.use(
  (config) => {
    const timed = config as TimedConfig;
    timed.metadata = { startedAt: Date.now() };

    if (config.url?.startsWith("/admin")) {
      const adminKey = getStoredAdminKey();
      if (adminKey) {
        const headers = AxiosHeaders.from(config.headers);
        headers.set("x-admin-key", adminKey);
        config.headers = headers;
      }
    }

    if (shouldDebugApi) {
      console.debug("[API Request]", {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL ?? ""}${config.url ?? ""}`,
        params: config.params,
        data: config.data,
        headers: config.headers,
      });
    }

    return config;
  },
  (error) => {
    if (shouldDebugApi) {
      console.error("[API Request Error]", error);
    }
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    if (shouldDebugApi) {
      const startedAt = (response.config as TimedConfig).metadata?.startedAt;
      console.debug("[API Response]", {
        method: response.config.method?.toUpperCase(),
        url: `${response.config.baseURL ?? ""}${response.config.url ?? ""}`,
        status: response.status,
        statusText: response.statusText,
        durationMs: startedAt ? Date.now() - startedAt : undefined,
        data: response.data,
        headers: response.headers,
      });
    }
    return response;
  },
  (error: AxiosError) => {
    if (shouldDebugApi) {
      const config = error.config as TimedConfig | undefined;
      const startedAt = config?.metadata?.startedAt;
      console.error("[API Response Error]", {
        method: config?.method?.toUpperCase(),
        url: config ? `${config.baseURL ?? ""}${config.url ?? ""}` : undefined,
        durationMs: startedAt ? Date.now() - startedAt : undefined,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    return Promise.reject(error);
  },
);
