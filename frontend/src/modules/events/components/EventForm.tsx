import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

import { toTimeInput } from "../lib/times";
import type { CalendarEvent, EventInput } from "../types/event";

interface EventFormProps {
  /** Event being edited; omit to create one. */
  event?: CalendarEvent;
  /** `yyyy-MM-dd` for a new event. */
  defaultDate: string;
  /** Hide the date input, e.g. when the day was already picked in the calendar. */
  hideDate?: boolean;
  /** Should reject on failure; the form keeps its input and the parent shows `error`. */
  onSubmit: (input: EventInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
  error?: string | null;
  /** Prefix for input ids, so two forms can share a page. */
  idPrefix?: string;
}

/** Title, date, optional start/end time and description; clears itself after creating. */
export default function EventForm({
  event,
  defaultDate,
  hideDate = false,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  idPrefix = "event",
}: EventFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.event_date ?? defaultDate);
  const [start, setStart] = useState(toTimeInput(event?.start_time ?? null));
  const [end, setEnd] = useState(toTimeInput(event?.end_time ?? null));
  const [description, setDescription] = useState(event?.description ?? "");
  const trimmedTitle = title.trim();
  let timeError: string | null = null;
  if (end && !start) timeError = t("events.form.endNeedsStart");
  // `HH:mm` strings compare like the times they represent.
  else if (end && end < start) timeError = t("events.form.endBeforeStart");
  const canSubmit = !!trimmedTitle && !!date && !timeError && !isSubmitting;
  const id = (name: string) => `${idPrefix}-${name}`;

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (!canSubmit) return;
    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || null,
        event_date: hideDate ? defaultDate : date,
        start_time: start || null,
        end_time: end || null,
      });
      // A parent that keeps the form open after creating gets a blank form for the next one.
      if (!event) {
        setTitle("");
        setStart("");
        setEnd("");
        setDescription("");
      }
    } catch {
      // Failure is reported through the `error` prop; keep the input for a retry.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor={id("title")} className="text-sm font-medium">
          {t("events.form.titleLabel")}
        </label>
        <Input
          id={id("title")}
          value={title}
          onChange={(changeEvent) => setTitle(changeEvent.target.value)}
          placeholder={t("events.form.titlePlaceholder")}
          maxLength={200}
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {!hideDate && (
          <div className="col-span-2 space-y-1 sm:col-span-1">
            <label htmlFor={id("date")} className="text-sm font-medium">
              {t("events.form.date")}
            </label>
            <Input
              id={id("date")}
              type="date"
              value={date}
              onChange={(changeEvent) => setDate(changeEvent.target.value)}
            />
          </div>
        )}
        <div className="space-y-1">
          <label htmlFor={id("start")} className="text-sm font-medium">
            {t("events.form.start")}
          </label>
          <Input
            id={id("start")}
            type="time"
            value={start}
            onChange={(changeEvent) => setStart(changeEvent.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={id("end")} className="text-sm font-medium">
            {t("events.form.end")}
          </label>
          <Input
            id={id("end")}
            type="time"
            value={end}
            onChange={(changeEvent) => setEnd(changeEvent.target.value)}
            aria-describedby={timeError ? id("time-error") : undefined}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("events.form.allDayHint")}</p>
      {timeError && (
        <p id={id("time-error")} className="text-sm text-destructive">
          {timeError}
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor={id("description")} className="text-sm font-medium">
          {t("events.form.description")}
        </label>
        <Textarea
          id={id("description")}
          value={description}
          onChange={(changeEvent) => setDescription(changeEvent.target.value)}
          maxLength={2000}
          className="min-h-[60px]"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={!canSubmit}>
          {event ? t("events.form.save") : t("events.form.create")}
        </Button>
      </div>
    </form>
  );
}
