import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import type { Priority, TaskCreateInput } from "../types/task";
import PrioritySelect from "./PrioritySelect";

interface TaskFormProps {
  /** Should reject on failure; the form keeps its input and the parent shows `error`. */
  onSubmit: (input: TaskCreateInput) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

/** Quick task creation: title, optional due date and priority. The rest is set when editing. */
export default function TaskForm({ onSubmit, isSubmitting, error }: TaskFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("none");
  const trimmedTitle = title.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedTitle) return;
    try {
      await onSubmit({ title: trimmedTitle, due_date: dueDate || null, priority });
      setTitle("");
      setDueDate("");
      setPriority("none");
    } catch {
      // Failure is reported through the `error` prop; keep the input for a retry.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <label htmlFor="task-title" className="sr-only">
          {t("tasks.form.titleLabel")}
        </label>
        <Input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("tasks.form.titlePlaceholder")}
          maxLength={200}
          autoComplete="off"
          className="min-w-0 basis-full sm:flex-1 sm:basis-auto"
        />
        <label htmlFor="task-due-date" className="sr-only">
          {t("tasks.form.dueDateLabel")}
        </label>
        <Input
          id="task-due-date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="w-36 min-w-0 flex-1 sm:w-40 sm:flex-none"
        />
        <label htmlFor="task-priority" className="sr-only">
          {t("tasks.priority.label")}
        </label>
        <PrioritySelect
          id="task-priority"
          value={priority}
          onChange={setPriority}
          className="w-28 min-w-0 flex-1 sm:flex-none"
        />
        <Button type="submit" disabled={!trimmedTitle || isSubmitting} className="shrink-0">
          <Plus className="h-4 w-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">{t("common.add")}</span>
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
