import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import type { ColumnUpdateInput, TaskColumn } from "../types/task";

interface ColumnRowProps {
  column: TaskColumn;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onUpdate: (input: ColumnUpdateInput) => void;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
}

/** One editable column; name and color are saved when the input loses focus. */
export default function ColumnRow({
  column,
  isFirst,
  isLast,
  disabled,
  onUpdate,
  onMove,
  onDelete,
}: ColumnRowProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(column.name);
  const [color, setColor] = useState(column.color);

  function commitName() {
    const trimmed = name.trim();
    if (!trimmed) setName(column.name);
    else if (trimmed !== column.name) onUpdate({ name: trimmed });
  }

  return (
    <li className="space-y-2 rounded-lg border p-2">
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={color}
          disabled={disabled}
          onChange={(event) => setColor(event.target.value)}
          onBlur={() => color !== column.color && onUpdate({ color })}
          className="h-9 w-10 shrink-0 cursor-pointer p-1"
          aria-label={t("tasks.columns.recolorLabel", { name: column.name })}
        />
        <Input
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
          maxLength={50}
          className="h-9"
          aria-label={t("tasks.columns.renameLabel", { name: column.name })}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="done-column"
            checked={column.is_done}
            disabled={disabled}
            onChange={() => onUpdate({ is_done: true })}
            aria-label={t("tasks.columns.markDone", { name: column.name })}
          />
          <span aria-hidden>{t("tasks.columns.doneColumn")}</span>
        </label>
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={disabled || isFirst}
            aria-label={t("tasks.columns.moveUp", { name: column.name })}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={disabled || isLast}
            aria-label={t("tasks.columns.moveDown", { name: column.name })}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                // The done column must always exist; mark another one as done first.
                disabled={disabled || column.is_done}
                aria-label={t("tasks.columns.deleteLabel", { name: column.name })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title={t("tasks.columns.deleteTitle")}
            description={t("tasks.columns.deleteDescription", { name: column.name })}
            confirmLabel={t("tasks.columns.delete")}
            onConfirm={onDelete}
            destructive
          />
        </div>
      </div>
    </li>
  );
}
