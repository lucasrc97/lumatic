import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePreferences } from "@/modules/preferences/hooks/usePreferences";
import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import { getErrorMessage } from "@/shared/lib/apiClient";

import { useEmptyTrash, usePurgeTrashItem, useRestoreTrashItem, useTrash } from "../hooks/useTrash";
import TrashItemRow from "./TrashItemRow";

export default function TrashPage() {
  const { t } = useTranslation();
  const trashQuery = useTrash();
  const preferencesQuery = usePreferences();
  const restoreItem = useRestoreTrashItem();
  const purgeItem = usePurgeTrashItem();
  const emptyTrash = useEmptyTrash();
  const actionError = restoreItem.error ?? purgeItem.error ?? emptyTrash.error;
  const isBusy = restoreItem.isPending || purgeItem.isPending || emptyTrash.isPending;
  const now = new Date();

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("trash.title")}</h1>
        {!!trashQuery.data?.length && (
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm" disabled={isBusy}>
                <Trash2 className="h-4 w-4" aria-hidden />
                {t("trash.emptyTrash")}
              </Button>
            }
            title={t("trash.emptyTitle")}
            description={t("trash.emptyDescription")}
            confirmLabel={t("trash.emptyTrash")}
            onConfirm={() => emptyTrash.mutate()}
            destructive
          />
        )}
      </div>

      {preferencesQuery.data && (
        <p className="text-sm text-muted-foreground">
          {t("trash.description", { count: preferencesQuery.data.trash_retention_days })}
        </p>
      )}

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(actionError)}
        </p>
      )}
      {trashQuery.isPending && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      {trashQuery.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(trashQuery.error)}
        </p>
      )}
      {trashQuery.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("trash.empty")}</p>
      )}

      <ul className="space-y-2">
        {trashQuery.data?.map((item) => (
          <TrashItemRow
            key={`${item.module}-${item.id}`}
            item={item}
            now={now}
            disabled={isBusy}
            onRestore={() => restoreItem.mutate(item)}
            onPurge={() => purgeItem.mutate(item)}
          />
        ))}
      </ul>
    </section>
  );
}
