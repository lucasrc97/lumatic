import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import type { TaskCreateInput } from "../types/task";

interface TaskFormProps {
  /** Should reject on failure; the form keeps its input and the parent shows `error`. */
  onSubmit: (input: TaskCreateInput) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

/** Quick task creation: title and optional due date. Other details are set when editing. */
export default function TaskForm({ onSubmit, isSubmitting, error }: TaskFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const trimmedTitle = title.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedTitle) return;
    try {
      await onSubmit({ title: trimmedTitle, due_date: dueDate || null });
      setTitle("");
      setDueDate("");
    } catch {
      // Failure is reported through the `error` prop; keep the input for a retry.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <div className="flex gap-2">
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
        />
        <label htmlFor="task-due-date" className="sr-only">
          {t("tasks.form.dueDateLabel")}
        </label>
        <Input
          id="task-due-date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="w-36 shrink-0 sm:w-40"
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
