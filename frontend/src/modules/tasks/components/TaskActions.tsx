import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";

interface TaskActionsProps {
  title: string;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/** Edit and delete (to the trash, after confirmation) buttons for one task. */
export default function TaskActions({ title, disabled, onEdit, onDelete }: TaskActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={disabled}
        aria-label={t("tasks.card.editLabel", { title })}
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
            aria-label={t("tasks.card.deleteLabel", { title })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
        title={t("tasks.card.deleteTitle")}
        description={t("tasks.card.deleteDescription", { title })}
        confirmLabel={t("tasks.card.delete")}
        onConfirm={onDelete}
        destructive
      />
    </div>
  );
}
