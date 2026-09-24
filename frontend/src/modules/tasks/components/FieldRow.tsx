import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import { joinOptions, splitOptions } from "../lib/options";
import type { FieldUpdateInput, TaskField } from "../types/task";

interface FieldRowProps {
  field: TaskField;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onUpdate: (input: FieldUpdateInput) => void;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
}

/** One editable field; name and options are saved when the input loses focus. */
export default function FieldRow({
  field,
  isFirst,
  isLast,
  disabled,
  onUpdate,
  onMove,
  onDelete,
}: FieldRowProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(field.name);
  const [options, setOptions] = useState(joinOptions(field.options));

  function commitName() {
    const trimmed = name.trim();
    if (!trimmed) setName(field.name);
    else if (trimmed !== field.name) onUpdate({ name: trimmed });
  }

  function commitOptions() {
    const parsed = splitOptions(options);
    if (parsed.length === 0) setOptions(joinOptions(field.options));
    else if (joinOptions(parsed) !== joinOptions(field.options)) onUpdate({ options: parsed });
  }

  return (
    <li className="space-y-2 rounded-lg border p-2">
      <div className="flex items-center gap-2">
        <Input
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
          maxLength={50}
          className="h-9"
          aria-label={t("tasks.fields.renameLabel", { name: field.name })}
        />
        <span className="shrink-0 text-xs text-muted-foreground">
          {t(`tasks.fields.types.${field.type}`)}
        </span>
      </div>
      {field.type === "select" && (
        <Input
          value={options}
          disabled={disabled}
          onChange={(event) => setOptions(event.target.value)}
          onBlur={commitOptions}
          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
          className="h-9"
          aria-label={t("tasks.fields.optionsOf", { name: field.name })}
        />
      )}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled || isFirst}
          aria-label={t("tasks.fields.moveUp", { name: field.name })}
          onClick={() => onMove(-1)}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled || isLast}
          aria-label={t("tasks.fields.moveDown", { name: field.name })}
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
              disabled={disabled}
              aria-label={t("tasks.fields.deleteLabel", { name: field.name })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          }
          title={t("tasks.fields.deleteTitle")}
          description={t("tasks.fields.deleteDescription", { name: field.name })}
          confirmLabel={t("tasks.fields.delete")}
          onConfirm={onDelete}
          destructive
        />
      </div>
    </li>
  );
}
