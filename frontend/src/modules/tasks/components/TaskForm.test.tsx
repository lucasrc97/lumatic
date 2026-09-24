import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import TaskForm from "./TaskForm";

describe("TaskForm", () => {
  it("submits the trimmed title and optional due date, then clears the form", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} isSubmitting={false} />);

    await userEvent.type(screen.getByLabelText("Título da tarefa"), "  Pagar aluguel  ");
    await userEvent.type(screen.getByLabelText("Prazo"), "2026-09-30");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onSubmit).toHaveBeenCalledWith({ title: "Pagar aluguel", due_date: "2026-09-30" });
    expect(screen.getByLabelText("Título da tarefa")).toHaveValue("");
  });

  it("sends a null due date when none is chosen and keeps input on failure", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("offline"));
    render(<TaskForm onSubmit={onSubmit} isSubmitting={false} error="Falhou" />);

    await userEvent.type(screen.getByLabelText("Título da tarefa"), "Ligar{Enter}");

    expect(onSubmit).toHaveBeenCalledWith({ title: "Ligar", due_date: null });
    expect(screen.getByLabelText("Título da tarefa")).toHaveValue("Ligar");
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
  });

  it("does not submit a blank title", () => {
    render(<TaskForm onSubmit={vi.fn()} isSubmitting={false} />);

    expect(screen.getByRole("button", { name: "Adicionar" })).toBeDisabled();
  });
});
