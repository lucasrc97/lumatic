/** Select options typed as comma-separated text; blanks are dropped. */
export function splitOptions(text: string): string[] {
  return text
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);
}

export function joinOptions(options: string[]): string {
  return options.join(", ");
}
