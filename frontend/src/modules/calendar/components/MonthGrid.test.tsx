import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CalendarItem } from "../types/calendar";
import MonthGrid from "./MonthGrid";

function item(id: number, module: string, date: string, title: string): CalendarItem {
  return { module, id, title, date, start_time: null, end_time: null, completed: false };
}

const ITEMS = [
  item(1, "events", "2026-09-25", "Dentista"),
  item(2, "tasks", "2026-09-25", "Pagar aluguel"),
  item(3, "events", "2026-09-25", "Reunião"),
  item(4, "events", "2026-09-25", "Academia"),
];

function renderGrid(onSelect = vi.fn()) {
  render(
    <MonthGrid
      month={new Date(2026, 8, 1)}
      items={ITEMS}
      today="2026-09-24"
      selected="2026-09-25"
      onSelect={onSelect}
    />,
  );
  return onSelect;
}

describe("MonthGrid", () => {
  it("shows whole weeks, Monday first, with each day's item count", () => {
    renderGrid();

    // September 2026 starts on a Tuesday: the grid begins on Monday, August 31.
    expect(screen.getAllByRole("button")[0]).toHaveAccessibleName(
      "segunda-feira, 31 de agosto, nada marcado",
    );
    expect(
      screen.getByRole("button", { name: "sexta-feira, 25 de setembro, 4 itens" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("lists up to three titles per day and counts the rest", () => {
    renderGrid();

    expect(screen.getByText("Dentista")).toBeInTheDocument();
    expect(screen.getByText("Pagar aluguel")).toBeInTheDocument();
    expect(screen.getByText("Reunião")).toBeInTheDocument();
    expect(screen.queryByText("Academia")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("selects a day when clicked", async () => {
    const onSelect = renderGrid();

    await userEvent.click(screen.getByRole("button", { name: /^quarta-feira, 30 de setembro/ }));

    expect(onSelect).toHaveBeenCalledWith("2026-09-30");
  });
});
