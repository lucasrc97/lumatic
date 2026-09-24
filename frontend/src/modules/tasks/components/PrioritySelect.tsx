import { useTranslation } from "react-i18next";

import { NativeSelect } from "@/shared/components/ui/native-select";
import { cn } from "@/shared/lib/utils";

import { toPriority } from "../lib/priority";
import { PRIORITIES, type Priority } from "../types/task";

interface PrioritySelectProps {
  id: string;
  value: Priority;
  onChange: (priority: Priority) => void;
  className?: string;
}

export default function PrioritySelect({ id, value, onChange, className }: PrioritySelectProps) {
  const { t } = useTranslation();

  return (
    <NativeSelect
      id={id}
      value={value}
      onChange={(event) => onChange(toPriority(event.target.value))}
      className={cn(className)}
    >
      {PRIORITIES.map((priority) => (
        <option key={priority} value={priority}>
          {t(`tasks.priority.${priority}`)}
        </option>
      ))}
    </NativeSelect>
  );
}
