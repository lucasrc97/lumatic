import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import EventQuickForm from "./EventQuickForm";

// Only the clock is faked, so user-event's timers keep working.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 24, 12));
});

afterEach(() => {
  vi.useRealTimers();
});

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(<EventQuickForm onSubmit={onSubmit} isSubmitting={false} />);
  return onSubmit;
}

describe("EventQuickForm", () => {
  it("creates an all-day event today by default and clears the title", async () => {
    const onSubmit = renderForm();

    await userEvent.type(screen.getByLabelText("Título do evento"), " Feriado {Enter}");

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Feriado",
      description: null,
      event_date: "2026-09-24",
      start_time: null,
      end_time: null,
    });
    expect(screen.getByLabelText("Título do evento")).toHaveValue("");
    expect(screen.getByLabelText("Data")).toHaveValue("2026-09-24");
  });

  it("sends the chosen date and times", async () => {
    const onSubmit = renderForm();

    await userEvent.type(screen.getByLabelText("Título do evento"), "Dentista");
    await userEvent.clear(screen.getByLabelText("Data"));
    await userEvent.type(screen.getByLabelText("Data"), "2026-10-02");
    await userEvent.type(screen.getByLabelText("Início"), "15:00");
    await userEvent.type(screen.getByLabelText("Fim"), "16:30");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ event_date: "2026-10-02", start_time: "15:00", end_time: "16:30" }),
    );
  });

  it("blocks an end time without a start or before the start", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText("Título do evento"), "Reunião");

    await userEvent.type(screen.getByLabelText("Fim"), "10:00");
    expect(screen.getByText("Informe o início para usar um horário de fim.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Início"), "11:00");
    expect(screen.getByText("O fim não pode ser antes do início.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeDisabled();
  });

  it("keeps the input when saving fails", async () => {
    renderForm(vi.fn().mockRejectedValue(new Error("offline")));

    await userEvent.type(screen.getByLabelText("Título do evento"), "Viagem{Enter}");

    expect(screen.getByLabelText("Título do evento")).toHaveValue("Viagem");
  });
});
