import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import i18n from "@/shared/i18n";

import HabitWeekGrid from "./HabitWeekGrid";

const DAYS = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"];

function renderGrid(onToggle = vi.fn()) {
  render(
    <HabitWeekGrid
      days={DAYS}
      completedDates={["2026-09-22"]}
      today="2026-09-24"
      color="#22c55e"
      onToggle={onToggle}
    />,
  );
  return onToggle;
}

describe("HabitWeekGrid", () => {
  it("shows which days are completed", () => {
    renderGrid();

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(7);
    expect(screen.getByRole("button", { name: /22 de setembro/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /23 de setembro/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles a day to the opposite state", async () => {
    const onToggle = renderGrid();

    await userEvent.click(screen.getByRole("button", { name: /22 de setembro/ }));
    await userEvent.click(screen.getByRole("button", { name: /24 de setembro/ }));

    expect(onToggle).toHaveBeenNthCalledWith(1, "2026-09-22", false);
    expect(onToggle).toHaveBeenNthCalledWith(2, "2026-09-24", true);
  });

  it("labels days in the active language", async () => {
    await i18n.changeLanguage("en");
    renderGrid();

    expect(screen.getByRole("button", { name: "Tuesday, September 22" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("does not allow completing future days", () => {
    renderGrid();

    expect(screen.getByRole("button", { name: /25 de setembro/ })).toBeDisabled();
  });
});
