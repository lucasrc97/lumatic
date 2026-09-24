import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";

import { formatTimeRange } from "../lib/times";
import type { CalendarEvent } from "../types/event";

interface EventRowProps {
  event: CalendarEvent;
  disabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function EventRow({ event, disabled = false, onEdit, onDelete }: EventRowProps) {
  const { t } = useTranslation();

  return (
    <li className="flex items-start justify-between gap-2 rounded-lg border p-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">
          {formatTimeRange(event.start_time, event.end_time) ?? t("events.allDay")}
        </p>
        <p className="break-words font-medium">{event.title}</p>
        {event.description && (
          <p className="line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
            {event.description}
          </p>
        )}
      </div>
      <div className="-mr-2 flex shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
          aria-label={t("events.editLabel", { title: event.title })}
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={disabled}
              aria-label={t("events.deleteLabel", { title: event.title })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          }
          title={t("events.deleteTitle")}
          description={t("events.deleteDescription", { title: event.title })}
          confirmLabel={t("events.delete")}
          onConfirm={onDelete}
          destructive
        />
      </div>
    </li>
  );
}
