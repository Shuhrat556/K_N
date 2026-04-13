import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

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
