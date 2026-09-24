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
import { Textarea } from "@/shared/components/ui/textarea";

import { timeProblem, toTimeInput } from "../lib/times";
import type { CalendarEvent, EventInput } from "../types/event";

interface EventEditDialogProps {
  /** The event being edited; the dialog is open while set. */
  event: CalendarEvent | null;
  /** Should reject on failure; the dialog stays open and the parent shows `error`. */
  onSubmit: (input: EventInput) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export default function EventEditDialog({ event, onClose, ...props }: EventEditDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={event !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t("events.edit")}</DialogTitle>
        </DialogHeader>
        {/* Keyed so the form restarts from the event's values each time it opens. */}
        {event && <EventEditForm key={event.id} event={event} onClose={onClose} {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function EventEditForm({
  event,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}: Omit<EventEditDialogProps, "event"> & { event: CalendarEvent }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.event_date);
  const [start, setStart] = useState(toTimeInput(event.start_time));
  const [end, setEnd] = useState(toTimeInput(event.end_time));
  const [description, setDescription] = useState(event.description ?? "");
  const trimmedTitle = title.trim();
  const problem = timeProblem(start, end);
  const canSubmit = !!trimmedTitle && !!date && !problem && !isSubmitting;

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (!canSubmit) return;
    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || null,
        event_date: date,
        start_time: start || null,
        end_time: end || null,
      });
      onClose();
    } catch {
      // Failure is reported through the `error` prop; keep the input for a retry.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="edit-event-title" className="text-sm font-medium">
          {t("events.form.titleLabel")}
        </label>
        <Input
          id="edit-event-title"
          value={title}
          onChange={(changeEvent) => setTitle(changeEvent.target.value)}
          maxLength={200}
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 space-y-1 sm:col-span-1">
          <label htmlFor="edit-event-date" className="text-sm font-medium">
            {t("events.form.date")}
          </label>
          <Input
            id="edit-event-date"
            type="date"
            value={date}
            onChange={(changeEvent) => setDate(changeEvent.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="edit-event-start" className="text-sm font-medium">
            {t("events.form.start")}
          </label>
          <Input
            id="edit-event-start"
            type="time"
            value={start}
            onChange={(changeEvent) => setStart(changeEvent.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="edit-event-end" className="text-sm font-medium">
            {t("events.form.end")}
          </label>
          <Input
            id="edit-event-end"
            type="time"
            value={end}
            onChange={(changeEvent) => setEnd(changeEvent.target.value)}
            aria-describedby={problem ? "edit-event-time-problem" : undefined}
          />
        </div>
      </div>
      {problem ? (
        <p id="edit-event-time-problem" className="text-sm text-destructive">
          {t(`events.form.${problem}`)}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{t("events.form.allDayHint")}</p>
      )}
      <div className="space-y-1">
        <label htmlFor="edit-event-description" className="text-sm font-medium">
          {t("events.form.description")}
        </label>
        <Textarea
          id="edit-event-description"
          value={description}
          onChange={(changeEvent) => setDescription(changeEvent.target.value)}
          maxLength={2000}
        />
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
        <Button type="submit" disabled={!canSubmit}>
          {t("events.form.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
