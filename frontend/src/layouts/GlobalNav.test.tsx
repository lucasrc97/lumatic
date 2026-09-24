import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import GlobalNav from "./GlobalNav";

function renderNav(calendarOpen = false, onToggleCalendar = vi.fn()) {
  render(
    <MemoryRouter initialEntries={["/trash"]}>
      <GlobalNav calendarOpen={calendarOpen} onToggleCalendar={onToggleCalendar} />
    </MemoryRouter>,
  );
  return onToggleCalendar;
}

describe("GlobalNav", () => {
  it("links to the trash and settings and marks the current page", () => {
    renderNav();

    expect(screen.getByRole("link", { name: "Configurações" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("link", { name: "Lixeira" })).toHaveAttribute("aria-current", "page");
  });

  it("toggles the calendar panel instead of linking to a page", async () => {
    const onToggle = renderNav(true);

    const calendar = screen.getByRole("button", { name: "Calendário" });
    expect(calendar).toHaveAttribute("aria-expanded", "true");
    expect(calendar).toHaveAttribute("aria-controls", "calendar-panel");

    await userEvent.click(calendar);
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
