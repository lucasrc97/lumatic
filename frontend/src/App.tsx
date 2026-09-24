import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/layouts/AppLayout";
import CalendarView from "@/layouts/CalendarView";
import HabitsPage from "@/modules/habits/components/HabitsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/habits" replace />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="*" element={<Navigate to="/habits" replace />} />
      </Route>
    </Routes>
  );
}
