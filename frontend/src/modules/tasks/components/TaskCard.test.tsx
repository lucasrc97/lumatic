import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Task, TaskColumn, TaskField } from "../types/task";
import TaskCard from "./TaskCard";

const COLUMNS: TaskColumn[] = [
  { id: 1, name: "A fazer", color: "#94a3b8", position: 0, is_done: false },
  { id: 3, name: "Concluída", color: "#22c55e", position: 1, is_done: true },
];

const FIELDS: TaskField[] = [
  { id: 7, name: "Prioridade", type: "select", options: ["Baixa", "Alta"], position: 0 },
  { id: 8, name: "Entrega", type: "date", options: [], position: 1 },
  { id: 9, name: "Horas", type: "number", options: [], position: 2 },
];

const TASK: Task = {
  id: 5,
  title: "Pagar aluguel",
  description: "Transferência",
  due_date: "2026-09-20",
  column_id: 1,
  custom_values: { "7": "Alta", "8": "2026-10-02" },
  completed_at: null,
  created_at: "2026-09-01T00:00:00Z",
};

function renderCard(task: Task = TASK) {
  const handlers = { onMove: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(
    <TaskCard task={task} columns={COLUMNS} fields={FIELDS} today="2026-09-24" {...handlers} />,
  );
  return handlers;
}

describe("TaskCard", () => {
  it("shows the task details, overdue due date and filled custom fields", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: "Pagar aluguel" })).toBeInTheDocument();
    expect(screen.getByText("Transferência")).toBeInTheDocument();
    expect(screen.getByText("20 set")).toBeInTheDocument();
    expect(screen.getByText("(atrasada)")).toBeInTheDocument();
    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("2 out")).toBeInTheDocument();
    expect(screen.queryByText(/Horas/)).not.toBeInTheDocument();
  });

  it("does not flag completed tasks as overdue", () => {
    renderCard({ ...TASK, column_id: 3, completed_at: "2026-09-21T10:00:00Z" });

    expect(screen.queryByText("(atrasada)")).not.toBeInTheDocument();
  });

  it("moves the task to the chosen column", async () => {
    const { onMove } = renderCard();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Coluna de Pagar aluguel" }),
      "Concluída",
    );

    expect(onMove).toHaveBeenCalledWith(3);
  });

  it("edits right away but deletes only after confirmation", async () => {
    const { onEdit, onDelete } = renderCard();

    await userEvent.click(screen.getByRole("button", { name: "Editar Pagar aluguel" }));
    expect(onEdit).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole("button", { name: "Excluir Pagar aluguel" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(/irá para a lixeira/);
    expect(onDelete).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
