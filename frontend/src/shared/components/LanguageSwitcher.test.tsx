import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import LanguageSwitcher from "./LanguageSwitcher";

describe("LanguageSwitcher", () => {
  it("switches the interface language and remembers the choice", async () => {
    render(<LanguageSwitcher />);

    await userEvent.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem("lumatic.language")).toBe("en");
  });
});
