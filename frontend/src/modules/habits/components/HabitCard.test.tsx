import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { HabitProgress } from "../types/habit";
import HabitCard from "./HabitCard";

const DAYS = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"];

const HABIT: HabitProgress = {
  id: 1,
  name: "Meditar",
  color: "#22c55e",
  archived: false,
  created_at: "2026-09-01T00:00:00Z",
  current_streak: 3,
  longest_streak: 8,
  completed_dates: ["2026-09-22", "2026-09-23", "2026-09-24"],
};

function renderCard(onArchive = vi.fn()) {
  render(
    <HabitCard
      habit={HABIT}
      days={DAYS}
      today="2026-09-24"
      isUpdating={false}
      onToggleDay={vi.fn()}
      onArchive={onArchive}
    />,
  );
  return onArchive;
}

describe("HabitCard", () => {
  it("shows the habit name, streaks and weekly progress", () => {
    renderCard();

    expect(screen.getByText("Meditar")).toBeInTheDocument();
    expect(screen.getByText(/3 dias seguidos/)).toBeInTheDocument();
    expect(screen.getByText(/recorde 8/)).toBeInTheDocument();
    expect(screen.getByText("3/7")).toBeInTheDocument();
  });

  it("uses the plural form for a zero streak", () => {
    render(
      <HabitCard
        habit={{ ...HABIT, current_streak: 0 }}
        days={DAYS}
        today="2026-09-24"
        isUpdating={false}
        onToggleDay={vi.fn()}
        onArchive={vi.fn()}
      />,
    );

    expect(screen.getByText(/0 dias seguidos/)).toBeInTheDocument();
  });

  it("archives only after confirmation", async () => {
    const onArchive = renderCard();

    await userEvent.click(screen.getByRole("button", { name: "Arquivar Meditar" }));
    expect(onArchive).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Arquivar" }));
    expect(onArchive).toHaveBeenCalledOnce();
  });
});
