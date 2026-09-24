import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TaskColumn } from "../types/task";
import TaskBoard from "./TaskBoard";

const COLUMNS: TaskColumn[] = [
  { id: 1, name: "A fazer", color: "#94a3b8", position: 0, is_done: false },
  { id: 3, name: "Concluída", color: "#22c55e", position: 1, is_done: true },
];

describe("TaskBoard", () => {
  it("visibly marks which column is the done column", () => {
    render(<TaskBoard tasks={[]} columns={COLUMNS} renderTask={() => null} />);

    const done = screen.getByRole("heading", { name: /Concluída/ });
    const todo = screen.getByRole("heading", { name: /A fazer/ });
    expect(within(done).getByText("Concluídas")).toBeVisible();
    expect(within(todo).queryByText("Concluídas")).not.toBeInTheDocument();
  });
});
