import axios, { AxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL) {
  throw new Error("VITE_API_URL is not set. Copy frontend/.env.example to frontend/.env.");
}

export const apiClient = axios.create({ baseURL });

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

/** User-facing message for a failed request, using the backend's {error: {message}} envelope. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
    if (!error.response) return "Não foi possível conectar ao servidor.";
  }
  return "Algo deu errado. Tente novamente.";
}
