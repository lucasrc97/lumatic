import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

import { TRASH_RETENTION_DAYS } from "../types/preferences";

interface RetentionFormProps {
  initialDays: number;
  /** Should reject on failure; the parent shows `error`. */
  onSubmit: (days: number) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

export default function RetentionForm({
  initialDays,
  onSubmit,
  isSubmitting,
  error,
}: RetentionFormProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(String(initialDays));
  const [saved, setSaved] = useState(false);
  const days = Number(value);
  const isValid =
    Number.isInteger(days) && days >= TRASH_RETENTION_DAYS.min && days <= TRASH_RETENTION_DAYS.max;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    setSaved(false);
    try {
      await onSubmit(days);
      setSaved(true);
    } catch {
      // Failure is reported through the `error` prop; keep the typed value for a retry.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <label htmlFor="trash-retention" className="text-sm font-medium">
        {t("settings.retentionLabel")}
      </label>
      <div className="flex gap-2">
        <Input
          id="trash-retention"
          type="number"
          inputMode="numeric"
          min={TRASH_RETENTION_DAYS.min}
          max={TRASH_RETENTION_DAYS.max}
          step={1}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setSaved(false);
          }}
          className="w-28"
          aria-describedby="trash-retention-hint"
        />
        <Button type="submit" disabled={!isValid || isSubmitting}>
          {t("settings.save")}
        </Button>
      </div>
      <p id="trash-retention-hint" className="text-xs text-muted-foreground">
        {t("settings.retentionHint", TRASH_RETENTION_DAYS)}
      </p>
      {saved && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("settings.saved")}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
