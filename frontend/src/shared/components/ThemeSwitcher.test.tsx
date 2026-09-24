import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ThemeSwitcher from "./ThemeSwitcher";

function mockSystemDark(dark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: dark, addEventListener: vi.fn() }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("dark");
});

describe("ThemeSwitcher", () => {
  it("defaults to following the system", () => {
    render(<ThemeSwitcher />);

    expect(screen.getByRole("button", { name: "Sistema" })).toHaveAttribute("aria-pressed", "true");
  });

  it("applies and remembers light and dark themes", async () => {
    mockSystemDark(false);
    render(<ThemeSwitcher />);

    await userEvent.click(screen.getByRole("button", { name: "Escuro" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("lumatic.theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Escuro" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: "Claro" }));
    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem("lumatic.theme")).toBe("light");
  });

  it("follows the system preference when set to system", async () => {
    mockSystemDark(true);
    localStorage.setItem("lumatic.theme", "light");
    render(<ThemeSwitcher />);

    await userEvent.click(screen.getByRole("button", { name: "Sistema" }));

    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("lumatic.theme")).toBe("system");
  });
});
