import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import GlobalNav from "./GlobalNav";

describe("GlobalNav", () => {
  it("links to the trash and settings and marks the current page", () => {
    render(
      <MemoryRouter initialEntries={["/trash"]}>
        <GlobalNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Configurações" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("link", { name: "Lixeira" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Calendário" })).not.toBeInTheDocument();
  });
});
