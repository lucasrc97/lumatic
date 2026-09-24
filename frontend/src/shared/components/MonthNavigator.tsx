import { addMonths, format, setMonth, setYear, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { NativeSelect } from "@/shared/components/ui/native-select";
import { useDateLocale } from "@/shared/i18n";

const MIN_YEAR = 1900;
const MAX_YEAR = 2999;

interface MonthNavigatorProps {
  /** Any day in the shown month. */
  month: Date;
  onChange: (month: Date) => void;
}

/** Previous/next month buttons, a month picker, a year field and a jump back to today. */
export default function MonthNavigator({ month, onChange }: MonthNavigatorProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const year = month.getFullYear();
  const [yearText, setYearText] = useState(String(year));
  const [shownYear, setShownYear] = useState(year);
  // Follow year changes made elsewhere (arrows, month picker, "today").
  if (year !== shownYear) {
    setShownYear(year);
    setYearText(String(year));
  }
  const monthNames = Array.from({ length: 12 }, (_, index) =>
    format(new Date(2000, index, 1), "LLLL", { locale }),
  );

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("month.previous")}
        onClick={() => onChange(addMonths(month, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <NativeSelect
        value={month.getMonth()}
        onChange={(event) => onChange(setMonth(month, Number(event.target.value)))}
        className="h-9 w-36 capitalize"
        aria-label={t("month.month")}
      >
        {monthNames.map((name, index) => (
          <option key={name} value={index} className="capitalize">
            {name}
          </option>
        ))}
      </NativeSelect>
      <Input
        type="number"
        inputMode="numeric"
        min={MIN_YEAR}
        max={MAX_YEAR}
        value={yearText}
        onChange={(event) => {
          setYearText(event.target.value);
          const typed = Number(event.target.value);
          // Partial years (e.g. "20" while typing "2027") are kept as text until valid.
          if (Number.isInteger(typed) && typed >= MIN_YEAR && typed <= MAX_YEAR) {
            onChange(setYear(month, typed));
          }
        }}
        onBlur={() => setYearText(String(year))}
        className="h-9 w-24"
        aria-label={t("month.year")}
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("month.next")}
        onClick={() => onChange(addMonths(month, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={() => onChange(startOfMonth(new Date()))}>
        {t("month.today")}
      </Button>
    </div>
  );
}
