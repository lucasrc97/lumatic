import axios, { AxiosError } from "axios";

import i18n, { isTranslatedErrorCode } from "@/shared/i18n";

const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL) {
  throw new Error("VITE_API_URL is not set. Copy frontend/.env.example to frontend/.env.");
}

export const apiClient = axios.create({ baseURL });

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

/**
 * User-facing message for a failed request. Known backend error codes are translated;
 * unknown codes fall back to the message from the backend's {error: {code, message}} envelope.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    const code = body?.error?.code;
    if (isTranslatedErrorCode(code)) return i18n.t(`errors.${code}`);
    if (body?.error?.message) return body.error.message;
    if (!error.response) return i18n.t("errors.network");
  }
  return i18n.t("errors.generic");
}
