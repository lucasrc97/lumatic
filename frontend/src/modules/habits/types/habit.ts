// Field names mirror the API payloads (snake_case) to avoid a mapping layer.

export interface Habit {
  id: number;
  name: string;
  color: string;
  archived: boolean;
  created_at: string;
}

export interface HabitProgress extends Habit {
  current_streak: number;
  longest_streak: number;
  /** `yyyy-MM-dd` dates completed within the requested range, ascending. */
  completed_dates: string[];
}

export interface HabitCreateInput {
  name: string;
  color?: string;
}

export interface HabitUpdateInput {
  name?: string;
  color?: string;
  archived?: boolean;
}

/** Inclusive range of `yyyy-MM-dd` dates. */
export interface DateRange {
  from: string;
  to: string;
}
