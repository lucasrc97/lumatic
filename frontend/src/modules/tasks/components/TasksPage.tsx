import { KanbanSquare, List } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { getErrorMessage } from "@/shared/lib/apiClient";
import { toISODate } from "@/shared/lib/dates";

import {
  useCreateColumn,
  useCreateField,
  useCreateTask,
  useDeleteColumn,
  useDeleteField,
  useDeleteTask,
  useReorderColumns,
  useReorderFields,
  useTaskColumns,
  useTaskFields,
  useTasks,
  useUpdateColumn,
  useUpdateField,
  useUpdateTask,
} from "../hooks/useTasks";
import type { Task } from "../types/task";
import ManageColumnsDialog from "./ManageColumnsDialog";
import ManageFieldsDialog from "./ManageFieldsDialog";
import TaskBoard from "./TaskBoard";
import TaskCard from "./TaskCard";
import TaskEditDialog from "./TaskEditDialog";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";

type View = "list" | "board";

export default function TasksPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>("list");
  const [editing, setEditing] = useState<Task | null>(null);
  const today = toISODate(new Date());

  const tasksQuery = useTasks();
  const columnsQuery = useTaskColumns();
  const fieldsQuery = useTaskFields();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createColumn = useCreateColumn();
  const updateColumn = useUpdateColumn();
  const reorderColumns = useReorderColumns();
  const deleteColumn = useDeleteColumn();
  const createField = useCreateField();
  const updateField = useUpdateField();
  const reorderFields = useReorderFields();
  const deleteField = useDeleteField();

  const columns = columnsQuery.data ?? [];
  const fields = fieldsQuery.data ?? [];
  const loadError = tasksQuery.error ?? columnsQuery.error ?? fieldsQuery.error;
  const isLoading = tasksQuery.isPending || columnsQuery.isPending || fieldsQuery.isPending;
  const tasks = tasksQuery.data;
  const isReady = tasks !== undefined && !isLoading && !loadError;
  // While the edit dialog is open it shows update errors itself.
  const actionError = (editing ? null : updateTask.error) ?? deleteTask.error;
  const columnError =
    createColumn.error ?? updateColumn.error ?? reorderColumns.error ?? deleteColumn.error;
  const columnsBusy =
    createColumn.isPending ||
    updateColumn.isPending ||
    reorderColumns.isPending ||
    deleteColumn.isPending;
  const fieldError = createField.error ?? updateField.error ?? reorderFields.error ?? deleteField.error;
  const fieldsBusy =
    createField.isPending || updateField.isPending || reorderFields.isPending || deleteField.isPending;

  function renderTask(task: Task) {
    return (
      <TaskCard
        task={task}
        columns={columns}
        fields={fields}
        today={today}
        disabled={updateTask.isPending && updateTask.variables?.id === task.id}
        onMove={(columnId) => updateTask.mutate({ id: task.id, input: { column_id: columnId } })}
        onEdit={() => {
          updateTask.reset();
          setEditing(task);
        }}
        onDelete={() => deleteTask.mutate(task.id)}
      />
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("tasks.title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label={t("tasks.view")} className="flex rounded-md border p-0.5">
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" aria-hidden />
              {t("tasks.viewList")}
            </Button>
            <Button
              variant={view === "board" ? "secondary" : "ghost"}
              size="sm"
              className="h-8"
              aria-pressed={view === "board"}
              onClick={() => setView("board")}
            >
              <KanbanSquare className="h-4 w-4" aria-hidden />
              {t("tasks.viewBoard")}
            </Button>
          </div>
          <ManageColumnsDialog
            columns={columns}
            disabled={columnsBusy}
            error={columnError ? getErrorMessage(columnError) : null}
            onCreate={async (input) => {
              await createColumn.mutateAsync(input);
            }}
            onUpdate={(id, input) => updateColumn.mutate({ id, input })}
            onReorder={(ids) => reorderColumns.mutate(ids)}
            onDelete={(id) => deleteColumn.mutate(id)}
          />
          <ManageFieldsDialog
            fields={fields}
            disabled={fieldsBusy}
            error={fieldError ? getErrorMessage(fieldError) : null}
            onCreate={async (input) => {
              await createField.mutateAsync(input);
            }}
            onUpdate={(id, input) => updateField.mutate({ id, input })}
            onReorder={(ids) => reorderFields.mutate(ids)}
            onDelete={(id) => deleteField.mutate(id)}
          />
        </div>
      </div>

      <TaskForm
        onSubmit={async (input) => {
          await createTask.mutateAsync(input);
        }}
        isSubmitting={createTask.isPending}
        error={createTask.error ? getErrorMessage(createTask.error) : null}
      />

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(actionError)}
        </p>
      )}
      {isLoading && !loadError && (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      )}
      {loadError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(loadError)}
        </p>
      )}

      {isReady && tasks.length === 0 && view === "list" && (
        <p className="text-sm text-muted-foreground">{t("tasks.empty")}</p>
      )}
      {isReady &&
        (view === "list" ? (
          <TaskList tasks={tasks} today={today} renderTask={renderTask} />
        ) : (
          <TaskBoard tasks={tasks} columns={columns} renderTask={renderTask} />
        ))}

      <TaskEditDialog
        task={editing}
        columns={columns}
        fields={fields}
        onSubmit={async (input) => {
          if (editing) await updateTask.mutateAsync({ id: editing.id, input });
        }}
        onClose={() => setEditing(null)}
        isSubmitting={updateTask.isPending}
        error={editing && updateTask.error ? getErrorMessage(updateTask.error) : null}
      />
    </section>
  );
}
