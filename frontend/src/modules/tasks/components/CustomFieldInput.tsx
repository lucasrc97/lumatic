import { Input } from "@/shared/components/ui/input";
import { NativeSelect } from "@/shared/components/ui/native-select";

import type { TaskField } from "../types/task";

interface CustomFieldInputProps {
  id: string;
  field: TaskField;
  /** Raw input value; empty means unset. */
  value: string;
  onChange: (value: string) => void;
}

/** The input matching a custom field's type. */
export default function CustomFieldInput({ id, field, value, onChange }: CustomFieldInputProps) {
  if (field.type === "select") {
    return (
      <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">—</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </NativeSelect>
    );
  }
  return (
    <Input
      id={id}
      type={field.type === "text" ? "text" : field.type}
      step={field.type === "number" ? "any" : undefined}
      maxLength={field.type === "text" ? 500 : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
