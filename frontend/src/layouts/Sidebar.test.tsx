import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  it("links to each section and marks the current one", () => {
    render(
      <MemoryRouter initialEntries={["/calendar"]}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Hábitos" })).toHaveAttribute("href", "/habits");
    expect(screen.getByRole("link", { name: "Calendário" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("notifies when a link is followed so the mobile menu can close", async () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter>
        <Sidebar onNavigate={onNavigate} />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("link", { name: "Hábitos" }));

    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
