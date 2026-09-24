import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Task, TaskColumn } from "../types/task";
import TaskRow from "./TaskRow";

const COLUMNS: TaskColumn[] = [
  { id: 1, name: "A fazer", color: "#94a3b8", position: 0, is_done: false },
  { id: 3, name: "Concluída", color: "#22c55e", position: 1, is_done: true },
];

const TASK: Task = {
  id: 5,
  title: "Pagar aluguel",
  description: "Transferência",
  due_date: "2026-09-20",
  column_id: 1,
  priority: "medium",
  completed_at: null,
  created_at: "2026-09-01T00:00:00Z",
};

function renderRow(task: Task = TASK) {
  const handlers = { onMove: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(
    <ul>
      <TaskRow task={task} columns={COLUMNS} today="2026-09-24" {...handlers} />
    </ul>,
  );
  return handlers;
}

describe("TaskRow", () => {
  it("shows the task on one row with its priority color and label", () => {
    renderRow();

    expect(screen.getByRole("listitem")).toHaveStyle({ borderLeftColor: "#f59e0b" });
    expect(screen.getByText("Média")).toHaveStyle({ backgroundColor: "#f59e0b" });
    expect(screen.getByText("Pagar aluguel")).toBeInTheDocument();
    expect(screen.getByText("(atrasada)")).toBeInTheDocument();
    // The description stays out of the compact row; it is shown when editing.
    expect(screen.queryByText("Transferência")).not.toBeInTheDocument();
  });

  it("strikes through completed tasks and omits the tag without priority", () => {
    renderRow({ ...TASK, priority: "none", column_id: 3, completed_at: "2026-09-21T10:00:00Z" });

    expect(screen.getByText("Pagar aluguel")).toHaveClass("line-through");
    expect(screen.queryByText("Sem prioridade")).not.toBeInTheDocument();
    expect(screen.queryByText("(atrasada)")).not.toBeInTheDocument();
  });

  it("moves, edits and deletes (after confirmation)", async () => {
    const { onMove, onEdit, onDelete } = renderRow();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Coluna de Pagar aluguel" }),
      "Concluída",
    );
    expect(onMove).toHaveBeenCalledWith(3);

    await userEvent.click(screen.getByRole("button", { name: "Editar Pagar aluguel" }));
    expect(onEdit).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole("button", { name: "Excluir Pagar aluguel" }));
    expect(onDelete).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
