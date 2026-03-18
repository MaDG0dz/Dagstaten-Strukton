import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
} from "date-fns";
import { nl } from "date-fns/locale";

export function formatDate(date: Date, formatStr: string = "d MMMM yyyy"): string {
  return format(date, formatStr, { locale: nl });
}

export function formatDayShort(date: Date): string {
  return format(date, "EEE", { locale: nl });
}

export function formatDayNumber(date: Date): string {
  return format(date, "d", { locale: nl });
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getNextWeek(date: Date): Date {
  return addWeeks(date, 1);
}

export function getPreviousWeek(date: Date): Date {
  return subWeeks(date, 1);
}

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export { isToday, isSameDay };
