import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { TaskField } from "../types/task";
import ManageFieldsDialog from "./ManageFieldsDialog";

const FIELDS: TaskField[] = [
  { id: 7, name: "Prioridade", type: "select", options: ["Baixa", "Alta"], position: 0 },
  { id: 9, name: "Horas", type: "number", options: [], position: 1 },
];

async function openDialog(fields: TaskField[] = FIELDS) {
  const handlers = {
    onCreate: vi.fn().mockResolvedValue(undefined),
    onUpdate: vi.fn(),
    onReorder: vi.fn(),
    onDelete: vi.fn(),
  };
  render(<ManageFieldsDialog fields={fields} disabled={false} {...handlers} />);
  await userEvent.click(screen.getByRole("button", { name: "Campos" }));
  return handlers;
}

describe("ManageFieldsDialog", () => {
  it("says when there are no fields", async () => {
    await openDialog([]);

    expect(screen.getByText("Nenhum campo ainda.")).toBeInTheDocument();
  });

  it("creates a select field only once it has options", async () => {
    const { onCreate } = await openDialog([]);

    await userEvent.type(screen.getByLabelText("Nome do campo"), "Prioridade");
    await userEvent.selectOptions(screen.getByLabelText("Tipo do campo"), "Lista de opções");
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Opções"), "Baixa, , Alta ");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onCreate).toHaveBeenCalledWith({
      name: "Prioridade",
      type: "select",
      options: ["Baixa", "Alta"],
    });
  });

  it("creates other field types without options", async () => {
    const { onCreate } = await openDialog([]);

    await userEvent.type(screen.getByLabelText("Nome do campo"), "Entrega");
    await userEvent.selectOptions(screen.getByLabelText("Tipo do campo"), "Data");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onCreate).toHaveBeenCalledWith({ name: "Entrega", type: "date", options: [] });
  });

  it("saves edited options when they change", async () => {
    const { onUpdate } = await openDialog();
    const options = screen.getByLabelText("Opções de Prioridade");

    expect(options).toHaveValue("Baixa, Alta");
    await userEvent.type(options, ", Urgente{Enter}");

    expect(onUpdate).toHaveBeenCalledWith(7, { options: ["Baixa", "Alta", "Urgente"] });
    expect(screen.queryByLabelText("Opções de Horas")).not.toBeInTheDocument();
  });

  it("reorders and deletes after confirmation", async () => {
    const { onReorder, onDelete } = await openDialog();

    await userEvent.click(screen.getByRole("button", { name: "Mover Horas para cima" }));
    expect(onReorder).toHaveBeenCalledWith([9, 7]);

    await userEvent.click(screen.getByRole("button", { name: "Excluir campo Horas" }));
    expect(screen.getAllByRole("dialog").at(-1)).toHaveTextContent(/em todas as tarefas/);
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onDelete).toHaveBeenCalledWith(9);
  });
});
