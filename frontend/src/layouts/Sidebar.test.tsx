import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  it("links to each module and the calendar and marks the current one", () => {
    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Hábitos" })).toHaveAttribute("href", "/habits");
    expect(screen.getByRole("link", { name: "Eventos" })).toHaveAttribute("href", "/events");
    expect(screen.getByRole("link", { name: "Calendário" })).toHaveAttribute("href", "/calendar");
    expect(screen.getByRole("link", { name: "Tarefas" })).toHaveAttribute("aria-current", "page");
  });

  it("leaves app-wide pages and the language choice to other places", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "Lixeira" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Configurações" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "English" })).not.toBeInTheDocument();
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
