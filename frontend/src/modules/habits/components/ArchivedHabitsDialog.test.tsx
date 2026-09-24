import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Habit } from "../types/habit";
import ArchivedHabitsDialog from "./ArchivedHabitsDialog";

const HABIT: Habit = {
  id: 4,
  name: "Correr",
  color: "#22c55e",
  archived: true,
  created_at: "2026-09-01T00:00:00Z",
};

async function openDialog(habits: Habit[] | undefined = [HABIT]) {
  const handlers = { onUnarchive: vi.fn(), onDelete: vi.fn() };
  render(<ArchivedHabitsDialog habits={habits} disabled={false} {...handlers} />);
  await userEvent.click(screen.getByRole("button", { name: "Arquivados" }));
  return handlers;
}

describe("ArchivedHabitsDialog", () => {
  it("says when nothing is archived", async () => {
    await openDialog([]);

    expect(screen.getByText("Nenhum hábito arquivado.")).toBeInTheDocument();
  });

  it("unarchives right away", async () => {
    const { onUnarchive } = await openDialog();

    expect(screen.getByText("Correr")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Desarquivar Correr" }));

    expect(onUnarchive).toHaveBeenCalledWith(4);
  });

  it("moves to the trash only after confirmation", async () => {
    const { onDelete } = await openDialog();

    await userEvent.click(screen.getByRole("button", { name: "Excluir Correr" }));
    expect(onDelete).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(onDelete).toHaveBeenCalledWith(4);
  });
});
