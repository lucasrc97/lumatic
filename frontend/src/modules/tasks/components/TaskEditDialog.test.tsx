import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Task, TaskColumn } from "../types/task";
import TaskEditDialog from "./TaskEditDialog";

const COLUMNS: TaskColumn[] = [
  { id: 1, name: "A fazer", color: "#94a3b8", position: 0, is_done: false },
  { id: 3, name: "Concluída", color: "#22c55e", position: 1, is_done: true },
];

const TASK: Task = {
  id: 5,
  title: "Pagar aluguel",
  description: null,
  due_date: "2026-09-30",
  column_id: 1,
  priority: "low",
  completed_at: null,
  created_at: "2026-09-01T00:00:00Z",
};

function renderDialog(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn();
  render(
    <TaskEditDialog
      task={TASK}
      columns={COLUMNS}
      onSubmit={onSubmit}
      onClose={onClose}
      isSubmitting={false}
    />,
  );
  return { onSubmit, onClose };
}

describe("TaskEditDialog", () => {
  it("starts from the task's values", () => {
    renderDialog();

    expect(screen.getByLabelText("Título")).toHaveValue("Pagar aluguel");
    expect(screen.getByLabelText("Prazo")).toHaveValue("2026-09-30");
    expect(screen.getByLabelText("Coluna")).toHaveValue("1");
    expect(screen.getByLabelText("Prioridade")).toHaveValue("low");
  });

  it("saves every field, clearing emptied ones, and closes", async () => {
    const { onSubmit, onClose } = renderDialog();

    await userEvent.type(screen.getByLabelText("Descrição"), "Até dia 5");
    await userEvent.clear(screen.getByLabelText("Prazo"));
    await userEvent.selectOptions(screen.getByLabelText("Coluna"), "Concluída");
    await userEvent.selectOptions(screen.getByLabelText("Prioridade"), "Alta");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Pagar aluguel",
      description: "Até dia 5",
      due_date: null,
      column_id: 3,
      priority: "high",
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("stays open when saving fails", async () => {
    const { onClose } = renderDialog(vi.fn().mockRejectedValue(new Error("offline")));

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
