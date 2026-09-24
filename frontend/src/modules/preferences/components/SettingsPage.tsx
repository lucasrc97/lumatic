import { useTranslation } from "react-i18next";

import LanguageSwitcher from "@/shared/components/LanguageSwitcher";
import ThemeSwitcher from "@/shared/components/ThemeSwitcher";
import { getErrorMessage } from "@/shared/lib/apiClient";

import { usePreferences, useUpdatePreferences } from "../hooks/usePreferences";
import RetentionForm from "./RetentionForm";

export default function SettingsPage() {
  const { t } = useTranslation();
  const preferencesQuery = usePreferences();
  const updatePreferences = useUpdatePreferences();

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">{t("settings.language")}</h2>
        <LanguageSwitcher />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">{t("settings.theme")}</h2>
        <ThemeSwitcher />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">{t("settings.trash")}</h2>
        {preferencesQuery.isPending && (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        )}
        {preferencesQuery.isError && (
          <p role="alert" className="text-sm text-destructive">
            {getErrorMessage(preferencesQuery.error)}
          </p>
        )}
        {preferencesQuery.data && (
          <RetentionForm
            initialDays={preferencesQuery.data.trash_retention_days}
            onSubmit={async (days) => {
              await updatePreferences.mutateAsync({ trash_retention_days: days });
            }}
            isSubmitting={updatePreferences.isPending}
            error={updatePreferences.error ? getErrorMessage(updatePreferences.error) : null}
          />
        )}
      </div>
    </section>
  );
}
