import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CalendarEvent } from "../types/event";
import EventForm from "./EventForm";

const EVENT: CalendarEvent = {
  id: 3,
  title: "Dentista",
  description: null,
  event_date: "2026-09-25",
  start_time: "15:00:00",
  end_time: "16:30:00",
  created_at: "2026-09-01T00:00:00Z",
};

describe("EventForm", () => {
  it("creates an all-day event on the default date and clears the form", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EventForm defaultDate="2026-09-24" onSubmit={onSubmit} isSubmitting={false} />);

    await userEvent.type(screen.getByLabelText("Título do evento"), " Feriado ");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar evento" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Feriado",
      description: null,
      event_date: "2026-09-24",
      start_time: null,
      end_time: null,
    });
    expect(screen.getByLabelText("Título do evento")).toHaveValue("");
  });

  it("edits an existing event starting from its values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <EventForm event={EVENT} defaultDate="2026-09-01" onSubmit={onSubmit} isSubmitting={false} />,
    );

    expect(screen.getByLabelText("Data")).toHaveValue("2026-09-25");
    expect(screen.getByLabelText("Início")).toHaveValue("15:00");
    await userEvent.clear(screen.getByLabelText("Fim"));
    await userEvent.type(screen.getByLabelText("Descrição"), "Levar exames");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Dentista",
      description: "Levar exames",
      event_date: "2026-09-25",
      start_time: "15:00",
      end_time: null,
    });
  });

  it("blocks an end time without a start or before the start", async () => {
    render(<EventForm defaultDate="2026-09-24" onSubmit={vi.fn()} isSubmitting={false} />);
    await userEvent.type(screen.getByLabelText("Título do evento"), "Reunião");

    await userEvent.type(screen.getByLabelText("Fim"), "10:00");
    expect(screen.getByText("Informe o início para usar um horário de fim.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar evento" })).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Início"), "11:00");
    expect(screen.getByText("O fim não pode ser antes do início.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar evento" })).toBeDisabled();
  });

  it("uses the given day without showing a date input", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <EventForm defaultDate="2026-10-02" hideDate onSubmit={onSubmit} isSubmitting={false} />,
    );

    expect(screen.queryByLabelText("Data")).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Título do evento"), "Viagem{Enter}");

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ event_date: "2026-10-02" }));
  });
});
