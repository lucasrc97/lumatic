import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { NativeSelect } from "@/shared/components/ui/native-select";
import { Textarea } from "@/shared/components/ui/textarea";

import type { Priority, Task, TaskColumn, TaskUpdateInput } from "../types/task";
import PrioritySelect from "./PrioritySelect";

interface TaskEditDialogProps {
  /** The task being edited; the dialog is open while set. */
  task: Task | null;
  columns: TaskColumn[];
  /** Should reject on failure; the dialog stays open and the parent shows `error`. */
  onSubmit: (input: TaskUpdateInput) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export default function TaskEditDialog({ task, onClose, ...props }: TaskEditDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={task !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t("tasks.edit.title")}</DialogTitle>
        </DialogHeader>
        {/* Keyed so the form restarts from the task's values each time it opens. */}
        {task && <TaskEditForm key={task.id} task={task} onClose={onClose} {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function TaskEditForm({
  task,
  columns,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}: Omit<TaskEditDialogProps, "task"> & { task: Task }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [columnId, setColumnId] = useState(task.column_id);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const trimmedTitle = title.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedTitle) return;
    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || null,
        due_date: dueDate || null,
        column_id: columnId,
        priority,
      });
      onClose();
    } catch {
      // Failure is reported through the `error` prop; keep the input for a retry.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="edit-task-title" className="text-sm font-medium">
          {t("tasks.edit.titleLabel")}
        </label>
        <Input
          id="edit-task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          autoComplete="off"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="edit-task-description" className="text-sm font-medium">
          {t("tasks.edit.description")}
        </label>
        <Textarea
          id="edit-task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2000}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="edit-task-due-date" className="text-sm font-medium">
            {t("tasks.edit.dueDate")}
          </label>
          <Input
            id="edit-task-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="edit-task-column" className="text-sm font-medium">
            {t("tasks.edit.column")}
          </label>
          <NativeSelect
            id="edit-task-column"
            value={columnId}
            onChange={(event) => setColumnId(Number(event.target.value))}
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1">
          <label htmlFor="edit-task-priority" className="text-sm font-medium">
            {t("tasks.priority.label")}
          </label>
          <PrioritySelect id="edit-task-priority" value={priority} onChange={setPriority} />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={!trimmedTitle || isSubmitting}>
          {t("tasks.edit.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
