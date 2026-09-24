import { Plus, SlidersHorizontal } from "lucide-react";
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
import { NativeSelect } from "@/shared/components/ui/native-select";

import { splitOptions } from "../lib/options";
import { moveId } from "../lib/reorder";
import {
  FIELD_TYPES,
  type FieldCreateInput,
  type FieldType,
  type FieldUpdateInput,
  type TaskField,
} from "../types/task";
import FieldRow from "./FieldRow";

interface ManageFieldsDialogProps {
  fields: TaskField[];
  disabled: boolean;
  error?: string | null;
  /** Should reject on failure; the form keeps its input and the dialog shows `error`. */
  onCreate: (input: FieldCreateInput) => Promise<void>;
  onUpdate: (id: number, input: FieldUpdateInput) => void;
  onReorder: (ids: number[]) => void;
  onDelete: (id: number) => void;
}

export default function ManageFieldsDialog({
  fields,
  disabled,
  error,
  onCreate,
  onUpdate,
  onReorder,
  onDelete,
}: ManageFieldsDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [type, setType] = useState<FieldType>("text");
  const [options, setOptions] = useState("");
  const trimmedName = name.trim();
  const parsedOptions = splitOptions(options);
  const canSubmit = !!trimmedName && (type !== "select" || parsedOptions.length > 0);
  const ids = fields.map((field) => field.id);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      await onCreate({
        name: trimmedName,
        type,
        options: type === "select" ? parsedOptions : [],
      });
      setName("");
      setOptions("");
    } catch {
      // Failure is reported through the `error` prop; keep the input for a retry.
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {t("tasks.fields.manage")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("tasks.fields.title")}</DialogTitle>
          <DialogDescription>{t("tasks.fields.description")}</DialogDescription>
        </DialogHeader>

        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("tasks.fields.empty")}</p>
        ) : (
          <ul className="space-y-2">
            {fields.map((field, index) => (
              <FieldRow
                key={field.id}
                field={field}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                disabled={disabled}
                onUpdate={(input) => onUpdate(field.id, input)}
                onMove={(delta) => onReorder(moveId(ids, index, delta))}
                onDelete={() => onDelete(field.id)}
              />
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("tasks.fields.namePlaceholder")}
              maxLength={50}
              autoComplete="off"
              aria-label={t("tasks.fields.nameLabel")}
            />
            <NativeSelect
              value={type}
              onChange={(event) =>
                setType(FIELD_TYPES.find((fieldType) => fieldType === event.target.value) ?? "text")
              }
              className="w-36 shrink-0"
              aria-label={t("tasks.fields.typeLabel")}
            >
              {FIELD_TYPES.map((fieldType) => (
                <option key={fieldType} value={fieldType}>
                  {t(`tasks.fields.types.${fieldType}`)}
                </option>
              ))}
            </NativeSelect>
          </div>
          {type === "select" && (
            <div className="space-y-1">
              <Input
                value={options}
                onChange={(event) => setOptions(event.target.value)}
                placeholder={t("tasks.fields.optionsPlaceholder")}
                aria-label={t("tasks.fields.optionsLabel")}
                aria-describedby="new-field-options-hint"
              />
              <p id="new-field-options-hint" className="text-xs text-muted-foreground">
                {t("tasks.fields.optionsHint")}
              </p>
            </div>
          )}
          <Button type="submit" disabled={!canSubmit || disabled} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden />
            {t("common.add")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
