import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import MonthNavigator from "./MonthNavigator";

function Harness({ onChange }: { onChange: (month: Date) => void }) {
  const [month, setMonth] = useState(new Date(2026, 8, 1));
  return (
    <MonthNavigator
      month={month}
      onChange={(next) => {
        setMonth(next);
        onChange(next);
      }}
    />
  );
}

describe("MonthNavigator", () => {
  it("moves across months and years with the arrows", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    for (let i = 0; i < 4; i++) {
      await userEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    }

    expect(onChange).toHaveBeenLastCalledWith(new Date(2027, 0, 1));
    expect(screen.getByLabelText("Ano")).toHaveValue(2027);
    expect(screen.getByLabelText("Mês")).toHaveValue("0");

    await userEvent.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 11, 1));
  });

  it("jumps to a chosen month and year", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText("Mês"), "março");
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 2, 1));

    fireEvent.change(screen.getByLabelText("Ano"), { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledTimes(1); // partial year is ignored
    fireEvent.change(screen.getByLabelText("Ano"), { target: { value: "2030" } });
    expect(onChange).toHaveBeenLastCalledWith(new Date(2030, 2, 1));
  });

  it("goes back to the current month", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Hoje" }));

    const now = new Date();
    expect(onChange).toHaveBeenLastCalledWith(new Date(now.getFullYear(), now.getMonth(), 1));
  });
});
