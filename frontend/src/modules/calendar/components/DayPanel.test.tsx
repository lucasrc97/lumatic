import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

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

async function renderExpanded(items: CalendarItem[] = ITEMS) {
  render(<DayPanel date="2026-09-25" items={items} />);
  await userEvent.click(screen.getByRole("button", { name: "sexta-feira, 25 de setembro" }));
}

describe("DayPanel", () => {
  it("starts with the list hidden and toggles it with the arrow next to the date", async () => {
    render(<DayPanel date="2026-09-25" items={ITEMS} />);
    const toggle = screen.getByRole("button", { name: "sexta-feira, 25 de setembro" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Dentista")).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Dentista")).toBeInTheDocument();

    await userEvent.click(toggle);
    expect(screen.queryByText("Dentista")).not.toBeInTheDocument();
  });

  it("lists what is already scheduled on the day", async () => {
    await renderExpanded();

    expect(screen.getByRole("heading", { name: "sexta-feira, 25 de setembro" })).toBeInTheDocument();
    expect(screen.getByText("15:00–16:00")).toBeInTheDocument();
    expect(screen.getByText("Prazo")).toBeInTheDocument();
    expect(screen.getByText("Pagar aluguel")).toHaveClass("line-through");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("says when the day is free", async () => {
    await renderExpanded([]);

    expect(screen.getByText("Nada marcado neste dia.")).toBeInTheDocument();
  });
});
