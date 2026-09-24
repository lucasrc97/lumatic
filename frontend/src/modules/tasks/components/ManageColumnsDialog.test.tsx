import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { TaskColumn } from "../types/task";
import ManageColumnsDialog from "./ManageColumnsDialog";

const COLUMNS: TaskColumn[] = [
  { id: 1, name: "A fazer", color: "#94a3b8", position: 0, is_done: false },
  { id: 2, name: "Em andamento", color: "#3b82f6", position: 1, is_done: false },
  { id: 3, name: "Concluída", color: "#22c55e", position: 2, is_done: true },
];

async function openDialog(error: string | null = null) {
  const handlers = {
    onCreate: vi.fn().mockResolvedValue(undefined),
    onUpdate: vi.fn(),
    onReorder: vi.fn(),
    onDelete: vi.fn(),
  };
  render(<ManageColumnsDialog columns={COLUMNS} disabled={false} error={error} {...handlers} />);
  await userEvent.click(screen.getByRole("button", { name: "Colunas" }));
  return handlers;
}

describe("ManageColumnsDialog", () => {
  it("creates a column", async () => {
    const { onCreate } = await openDialog();

    await userEvent.type(screen.getByLabelText("Nome da coluna"), " Esperando {Enter}");

    expect(onCreate).toHaveBeenCalledWith({ name: "Esperando", color: "#94a3b8" });
  });

  it("renames a column when the name loses focus, ignoring blank names", async () => {
    const { onUpdate } = await openDialog();
    const name = screen.getByLabelText("Nome da coluna A fazer");

    await userEvent.clear(name);
    await userEvent.tab();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(name).toHaveValue("A fazer");

    await userEvent.clear(name);
    await userEvent.type(name, "Backlog{Enter}");
    expect(onUpdate).toHaveBeenCalledWith(1, { name: "Backlog" });
  });

  it("moves columns and changes the done column", async () => {
    const { onReorder, onUpdate } = await openDialog();

    expect(screen.getByRole("button", { name: "Mover A fazer para cima" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Mover A fazer para baixo" }));
    expect(onReorder).toHaveBeenCalledWith([2, 1, 3]);

    await userEvent.click(
      screen.getByRole("radio", { name: "Usar Em andamento como coluna de concluídas" }),
    );
    expect(onUpdate).toHaveBeenCalledWith(2, { is_done: true });
  });

  it("deletes after confirmation and never offers deleting the done column", async () => {
    const { onDelete } = await openDialog();

    expect(screen.getByRole("button", { name: "Excluir coluna Concluída" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Excluir coluna Em andamento" }));
    expect(onDelete).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onDelete).toHaveBeenCalledWith(2);
  });

  it("shows errors from the server", async () => {
    await openDialog("Esta coluna ainda tem tarefas.");

    expect(screen.getByRole("alert")).toHaveTextContent("Esta coluna ainda tem tarefas.");
  });
});
