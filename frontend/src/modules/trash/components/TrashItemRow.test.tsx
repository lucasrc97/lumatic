import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { TrashItem } from "../types/trash";
import TrashItemRow from "./TrashItemRow";

const ITEM: TrashItem = {
  module: "habits",
  id: 7,
  title: "Meditar",
  deleted_at: "2026-09-20T10:00:00Z",
  purge_at: "2026-10-20T10:00:00Z",
};

function renderRow(item: TrashItem = ITEM) {
  const onRestore = vi.fn();
  const onPurge = vi.fn();
  render(
    <ul>
      <TrashItemRow
        item={item}
        now={new Date(2026, 8, 24, 12)}
        onRestore={onRestore}
        onPurge={onPurge}
      />
    </ul>,
  );
  return { onRestore, onPurge };
}

describe("TrashItemRow", () => {
  it("shows the item, its module and when it will be permanently deleted", () => {
    renderRow();

    expect(screen.getByText("Meditar")).toBeInTheDocument();
    expect(screen.getByText(/Hábito · Excluído em 20 set/)).toBeInTheDocument();
    expect(screen.getByText(/excluído de vez em 26 dias/)).toBeInTheDocument();
  });

  it("says when the item is due for deletion today", () => {
    renderRow({ ...ITEM, purge_at: "2026-09-24T18:00:00Z" });

    expect(screen.getByText(/excluído de vez hoje/)).toBeInTheDocument();
  });

  it("restores immediately but purges only after confirmation", async () => {
    const { onRestore, onPurge } = renderRow();

    await userEvent.click(screen.getByRole("button", { name: "Restaurar Meditar" }));
    expect(onRestore).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole("button", { name: "Excluir Meditar de vez" }));
    expect(onPurge).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Excluir de vez" }));
    expect(onPurge).toHaveBeenCalledOnce();
  });
});
