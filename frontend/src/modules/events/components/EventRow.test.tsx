import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CalendarEvent } from "../types/event";
import EventRow from "./EventRow";

const EVENT: CalendarEvent = {
  id: 3,
  title: "Dentista",
  description: "Levar exames",
  event_date: "2026-09-25",
  start_time: "15:00:00",
  end_time: "16:30:00",
  created_at: "2026-09-01T00:00:00Z",
};

function renderRow(event: CalendarEvent = EVENT) {
  const handlers = { onEdit: vi.fn(), onDelete: vi.fn() };
  render(
    <ul>
      <EventRow event={event} {...handlers} />
    </ul>,
  );
  return handlers;
}

describe("EventRow", () => {
  it("shows the time range, title and description", () => {
    renderRow();

    expect(screen.getByText("15:00–16:30")).toBeInTheDocument();
    expect(screen.getByText("Dentista")).toBeInTheDocument();
    expect(screen.getByText("Levar exames")).toBeInTheDocument();
  });

  it("labels events without a time as all day", () => {
    renderRow({ ...EVENT, start_time: null, end_time: null });

    expect(screen.getByText("Dia inteiro")).toBeInTheDocument();
  });

  it("edits right away but deletes only after confirmation", async () => {
    const { onEdit, onDelete } = renderRow();

    await userEvent.click(screen.getByRole("button", { name: "Editar Dentista" }));
    expect(onEdit).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole("button", { name: "Excluir Dentista" }));
    expect(onDelete).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
