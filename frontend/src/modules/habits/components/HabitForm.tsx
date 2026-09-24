import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import type { HabitCreateInput } from "../types/habit";

const DEFAULT_COLOR = "#22c55e";

interface HabitFormProps {
  /** Should reject on failure; the form keeps its input and the parent shows `error`. */
  onSubmit: (input: HabitCreateInput) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

export default function HabitForm({ onSubmit, isSubmitting, error }: HabitFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const trimmedName = name.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName) return;
    try {
      await onSubmit({ name: trimmedName, color });
      setName("");
    } catch {
      // Failure is reported through the `error` prop; keep the typed name for a retry.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <div className="flex gap-2">
        <label htmlFor="habit-name" className="sr-only">
          {t("habits.form.nameLabel")}
        </label>
        <Input
          id="habit-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("habits.form.namePlaceholder")}
          maxLength={100}
          autoComplete="off"
        />
        <label htmlFor="habit-color" className="sr-only">
          {t("habits.form.colorLabel")}
        </label>
        <Input
          id="habit-color"
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="w-12 shrink-0 cursor-pointer p-1"
        />
        <Button type="submit" disabled={!trimmedName || isSubmitting} className="shrink-0">
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
