import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { calendarApi } from "@/modules/calendar/services/calendarApi";

import AppLayout from "./AppLayout";

vi.mock("@/modules/calendar/services/calendarApi", () => ({
  calendarApi: { list: vi.fn() },
}));

function renderLayout() {
  vi.mocked(calendarApi.list).mockResolvedValue([]);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/tasks"]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="tasks" element={<p>Página de tarefas</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AppLayout", () => {
  it("opens the calendar above the current page and remembers the choice", async () => {
    renderLayout();
    expect(screen.queryByRole("region", { name: "Calendário" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Calendário" }));

    const panel = screen.getByRole("region", { name: "Calendário" });
    const page = screen.getByText("Página de tarefas");
    // The panel comes first in the document, pushing the page down.
    expect(panel.compareDocumentPosition(page) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(localStorage.getItem("lumatic.calendarOpen")).toBe("true");

    await userEvent.click(screen.getByRole("button", { name: "Calendário" }));
    expect(screen.queryByRole("region", { name: "Calendário" })).not.toBeInTheDocument();
    expect(localStorage.getItem("lumatic.calendarOpen")).toBe("false");
  });

  it("starts open when it was left open", () => {
    localStorage.setItem("lumatic.calendarOpen", "true");

    renderLayout();

    expect(screen.getByRole("region", { name: "Calendário" })).toBeInTheDocument();
  });
});
