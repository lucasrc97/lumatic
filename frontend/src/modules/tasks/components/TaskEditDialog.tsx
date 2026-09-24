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

import { fromInputValue, toInputValue } from "../lib/customValues";
import type { CustomValue, Task, TaskColumn, TaskField, TaskUpdateInput } from "../types/task";
import CustomFieldInput from "./CustomFieldInput";

interface TaskEditDialogProps {
  /** The task being edited; the dialog is open while set. */
  task: Task | null;
  columns: TaskColumn[];
  fields: TaskField[];
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
  fields,
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
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.id, toInputValue(task.custom_values[field.id])])),
  );
  const trimmedTitle = title.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedTitle) return;
    const customValues: Record<string, CustomValue | null> = Object.fromEntries(
      fields.map((field) => [field.id, fromInputValue(field, values[field.id] ?? "")]),
    );
    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || null,
        due_date: dueDate || null,
        column_id: columnId,
        custom_values: customValues,
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
        {fields.map((field) => (
          <div key={field.id} className="space-y-1">
            <label htmlFor={`edit-task-field-${field.id}`} className="text-sm font-medium">
              {field.name}
            </label>
            <CustomFieldInput
              id={`edit-task-field-${field.id}`}
              field={field}
              value={values[field.id] ?? ""}
              onChange={(value) => setValues((current) => ({ ...current, [field.id]: value }))}
            />
          </div>
        ))}
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
