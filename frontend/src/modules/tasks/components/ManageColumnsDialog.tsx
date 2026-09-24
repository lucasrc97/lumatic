import { Columns3, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";

import { moveId } from "../lib/reorder";
import type { ColumnCreateInput, ColumnUpdateInput, TaskColumn } from "../types/task";
import ColumnRow from "./ColumnRow";

const DEFAULT_COLOR = "#94a3b8";

interface ManageColumnsDialogProps {
  columns: TaskColumn[];
  disabled: boolean;
  error?: string | null;
  /** Should reject on failure; the form keeps its input and the dialog shows `error`. */
  onCreate: (input: ColumnCreateInput) => Promise<void>;
  onUpdate: (id: number, input: ColumnUpdateInput) => void;
  onReorder: (ids: number[]) => void;
  onDelete: (id: number) => void;
}

export default function ManageColumnsDialog({
  columns,
  disabled,
  error,
  onCreate,
  onUpdate,
  onReorder,
  onDelete,
}: ManageColumnsDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const trimmedName = name.trim();
  const ids = columns.map((column) => column.id);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName) return;
    try {
      await onCreate({ name: trimmedName, color });
      setName("");
    } catch {
      // Failure is reported through the `error` prop; keep the typed name for a retry.
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns3 className="h-4 w-4" aria-hidden />
          {t("tasks.columns.manage")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("tasks.columns.title")}</DialogTitle>
          <DialogDescription>{t("tasks.columns.description")}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {columns.map((column, index) => (
            <ColumnRow
              key={column.id}
              column={column}
              isFirst={index === 0}
              isLast={index === columns.length - 1}
              disabled={disabled}
              onUpdate={(input) => onUpdate(column.id, input)}
              onMove={(delta) => onReorder(moveId(ids, index, delta))}
              onDelete={() => onDelete(column.id)}
            />
          ))}
        </ul>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="w-12 shrink-0 cursor-pointer p-1"
            aria-label={t("tasks.columns.colorLabel")}
          />
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("tasks.columns.namePlaceholder")}
            maxLength={50}
            autoComplete="off"
            aria-label={t("tasks.columns.nameLabel")}
          />
          <Button type="submit" disabled={!trimmedName || disabled} className="shrink-0">
            <Plus className="h-4 w-4" aria-hidden />
            <span className="sr-only sm:not-sr-only">{t("common.add")}</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
