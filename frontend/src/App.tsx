import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/layouts/AppLayout";
import EventsPage from "@/modules/events/components/EventsPage";
import HabitsPage from "@/modules/habits/components/HabitsPage";
import SettingsPage from "@/modules/preferences/components/SettingsPage";
import TasksPage from "@/modules/tasks/components/TasksPage";
import TrashPage from "@/modules/trash/components/TrashPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/habits" replace />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/habits" replace />} />
      </Route>
    </Routes>
  );
}
