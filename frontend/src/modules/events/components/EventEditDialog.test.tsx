import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CalendarEvent } from "../types/event";
import EventEditDialog from "./EventEditDialog";

const EVENT: CalendarEvent = {
  id: 3,
  title: "Dentista",
  description: null,
  event_date: "2026-09-25",
  start_time: "15:00:00",
  end_time: "16:30:00",
  created_at: "2026-09-01T00:00:00Z",
};

function renderDialog(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn();
  render(
    <EventEditDialog event={EVENT} onSubmit={onSubmit} onClose={onClose} isSubmitting={false} />,
  );
  return { onSubmit, onClose };
}

describe("EventEditDialog", () => {
  it("starts from the event's values and saves every field, then closes", async () => {
    const { onSubmit, onClose } = renderDialog();

    expect(screen.getByLabelText("Data")).toHaveValue("2026-09-25");
    expect(screen.getByLabelText("Início")).toHaveValue("15:00");
    await userEvent.clear(screen.getByLabelText("Fim"));
    await userEvent.type(screen.getByLabelText("Descrição"), "Levar exames");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Dentista",
      description: "Levar exames",
      event_date: "2026-09-25",
      start_time: "15:00",
      end_time: null,
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
