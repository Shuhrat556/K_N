import axios from "axios";

const specialtiesBaseURL = import.meta.env.VITE_SPECIALTIES_API_URL?.replace(/\/$/, "") || "http://localhost:4001";

export const specialtiesApi = axios.create({
  baseURL: specialtiesBaseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

specialtiesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[Specialties API Error]", error.response?.data || error.message);
    return Promise.reject(error);
  },
);