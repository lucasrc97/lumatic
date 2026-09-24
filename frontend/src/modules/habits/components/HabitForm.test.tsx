import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import HabitForm from "./HabitForm";

describe("HabitForm", () => {
  it("submits the trimmed name and clears the field on success", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<HabitForm onSubmit={onSubmit} isSubmitting={false} />);
    const input = screen.getByLabelText("Nome do hábito");

    await userEvent.type(input, "  Ler 10 páginas  ");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Ler 10 páginas", color: "#22c55e" });
    expect(input).toHaveValue("");
  });

  it("keeps the name when submission fails and shows the error", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("boom"));
    const { rerender } = render(<HabitForm onSubmit={onSubmit} isSubmitting={false} />);
    const input = screen.getByLabelText("Nome do hábito");

    await userEvent.type(input, "Correr");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    rerender(<HabitForm onSubmit={onSubmit} isSubmitting={false} error="Falhou" />);

    expect(input).toHaveValue("Correr");
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
  });

  it("cannot be submitted with a blank name", async () => {
    render(<HabitForm onSubmit={vi.fn()} isSubmitting={false} />);

    await userEvent.type(screen.getByLabelText("Nome do hábito"), "   ");

    expect(screen.getByRole("button", { name: "Adicionar" })).toBeDisabled();
  });
});
