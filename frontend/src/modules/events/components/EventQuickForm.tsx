import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toISODate } from "@/shared/lib/dates";

import { timeProblem } from "../lib/times";
import type { EventInput } from "../types/event";

interface EventQuickFormProps {
  /** Should reject on failure; the form keeps its input and the parent shows `error`. */
  onSubmit: (input: EventInput) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

/**
 * Quick event creation: title, date (today by default) and optional times.
 * The description is set when editing.
 */
export default function EventQuickForm({ onSubmit, isSubmitting, error }: EventQuickFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const trimmedTitle = title.trim();
  const problem = timeProblem(start, end);
  const canSubmit = !!trimmedTitle && !!date && !problem && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      await onSubmit({
        title: trimmedTitle,
        description: null,
        event_date: date,
        start_time: start || null,
        end_time: end || null,
      });
      setTitle("");
      setStart("");
      setEnd("");
    } catch {
      // Failure is reported through the `error` prop; keep the input for a retry.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <label htmlFor="event-title" className="sr-only">
          {t("events.form.titleLabel")}
        </label>
        <Input
          id="event-title"
          value={title}
          onChange={(changeEvent) => setTitle(changeEvent.target.value)}
          placeholder={t("events.form.titlePlaceholder")}
          maxLength={200}
          autoComplete="off"
          className="min-w-0 basis-full sm:flex-1 sm:basis-auto"
        />
        <label htmlFor="event-date" className="sr-only">
          {t("events.form.date")}
        </label>
        <Input
          id="event-date"
          type="date"
          value={date}
          onChange={(changeEvent) => setDate(changeEvent.target.value)}
          className="w-36 min-w-0 flex-1 basis-full sm:w-40 sm:flex-none sm:basis-auto"
        />
        <label htmlFor="event-start" className="sr-only">
          {t("events.form.start")}
        </label>
        <Input
          id="event-start"
          type="time"
          value={start}
          onChange={(changeEvent) => setStart(changeEvent.target.value)}
          title={t("events.form.start")}
          className="w-28 min-w-0 flex-1 sm:flex-none"
        />
        <label htmlFor="event-end" className="sr-only">
          {t("events.form.end")}
        </label>
        <Input
          id="event-end"
          type="time"
          value={end}
          onChange={(changeEvent) => setEnd(changeEvent.target.value)}
          title={t("events.form.end")}
          className="w-28 min-w-0 flex-1 sm:flex-none"
          aria-describedby={problem ? "event-time-problem" : undefined}
        />
        <Button type="submit" disabled={!canSubmit} className="shrink-0">
          <Plus className="h-4 w-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">{t("common.add")}</span>
        </Button>
      </div>
      {problem ? (
        <p id="event-time-problem" className="text-sm text-destructive">
          {t(`events.form.${problem}`)}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{t("events.form.allDayHint")}</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
