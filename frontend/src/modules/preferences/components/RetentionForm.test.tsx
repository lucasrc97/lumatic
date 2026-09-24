import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import RetentionForm from "./RetentionForm";

describe("RetentionForm", () => {
  it("saves a new retention period and confirms it", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RetentionForm initialDays={30} onSubmit={onSubmit} isSubmitting={false} />);
    const input = screen.getByLabelText("Dias até excluir de vez");

    expect(input).toHaveValue(30);
    await userEvent.clear(input);
    await userEvent.type(input, "7");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith(7);
    expect(screen.getByRole("status")).toHaveTextContent("Salvo.");
  });

  it.each(["0", "366", "1.5", ""])("cannot be saved with %j days", async (value) => {
    render(<RetentionForm initialDays={30} onSubmit={vi.fn()} isSubmitting={false} />);
    const input = screen.getByLabelText("Dias até excluir de vez");

    await userEvent.clear(input);
    if (value) await userEvent.type(input, value);

    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("shows the error and no confirmation when saving fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("boom"));
    const { rerender } = render(
      <RetentionForm initialDays={30} onSubmit={onSubmit} isSubmitting={false} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    rerender(
      <RetentionForm initialDays={30} onSubmit={onSubmit} isSubmitting={false} error="Falhou" />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
