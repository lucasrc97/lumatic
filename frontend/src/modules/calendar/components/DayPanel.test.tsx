import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CalendarItem } from "../types/calendar";
import DayPanel from "./DayPanel";

const ITEMS: CalendarItem[] = [
  {
    module: "events",
    id: 1,
    title: "Dentista",
    date: "2026-09-25",
    start_time: "15:00:00",
    end_time: "16:00:00",
    completed: false,
  },
  {
    module: "tasks",
    id: 7,
    title: "Pagar aluguel",
    date: "2026-09-25",
    start_time: null,
    end_time: null,
    completed: true,
  },
];

function renderPanel(items: CalendarItem[] = ITEMS) {
  const handlers = {
    onCreateEvent: vi.fn().mockResolvedValue(undefined),
    onCreateTask: vi.fn().mockResolvedValue(undefined),
  };
  render(<DayPanel date="2026-09-25" items={items} isSubmitting={false} {...handlers} />);
  return handlers;
}

describe("DayPanel", () => {
  it("shows what is already scheduled on the day", () => {
    renderPanel();

    expect(screen.getByRole("heading", { name: "sexta-feira, 25 de setembro" })).toBeInTheDocument();
    expect(screen.getByText("15:00–16:00")).toBeInTheDocument();
    expect(screen.getByText("Dentista")).toBeInTheDocument();
    expect(screen.getByText("Prazo")).toBeInTheDocument();
    expect(screen.getByText("Pagar aluguel")).toHaveClass("line-through");
  });

  it("says when the day is free", () => {
    renderPanel([]);

    expect(screen.getByText("Nada marcado neste dia.")).toBeInTheDocument();
  });

  it("creates an event on the day", async () => {
    const { onCreateEvent } = renderPanel();

    await userEvent.click(screen.getByRole("button", { name: "Novo evento" }));
    await userEvent.type(screen.getByLabelText("Título do evento"), "Reunião");
    await userEvent.type(screen.getByLabelText("Início"), "09:00");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar evento" }));

    expect(onCreateEvent).toHaveBeenCalledWith({
      title: "Reunião",
      description: null,
      event_date: "2026-09-25",
      start_time: "09:00",
      end_time: null,
    });
  });

  it("creates a task due on the day", async () => {
    const { onCreateTask } = renderPanel();

    await userEvent.click(screen.getByRole("button", { name: "Nova tarefa" }));
    await userEvent.type(screen.getByLabelText("Título da tarefa"), "Comprar presente{Enter}");

    expect(onCreateTask).toHaveBeenCalledWith({
      title: "Comprar presente",
      due_date: "2026-09-25",
      priority: "none",
    });
  });
});
