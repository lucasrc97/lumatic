import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import i18n from "@/shared/i18n";

import { getErrorMessage } from "./apiClient";

function apiError(data: unknown): AxiosError {
  const response = { data, status: 404, headers: {}, config: { headers: new AxiosHeaders() } };
  return new AxiosError("failed", "ERR_BAD_REQUEST", undefined, undefined, response as AxiosResponse);
}

describe("getErrorMessage", () => {
  it("translates known backend error codes into the active language", async () => {
    const error = apiError({ error: { code: "habit_not_found", message: "Habit 9 was not found." } });

    expect(getErrorMessage(error)).toBe("Hábito não encontrado.");
    await i18n.changeLanguage("en");
    expect(getErrorMessage(error)).toBe("Habit not found.");
  });

  it("falls back to the backend message for unknown codes", () => {
    const error = apiError({ error: { code: "brand_new_code", message: "Server says no." } });

    expect(getErrorMessage(error)).toBe("Server says no.");
  });

  it("reports network failures and unexpected errors", () => {
    expect(getErrorMessage(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(
      "Não foi possível conectar ao servidor.",
    );
    expect(getErrorMessage(new Error("boom"))).toBe("Algo deu errado. Tente novamente.");
  });
});
