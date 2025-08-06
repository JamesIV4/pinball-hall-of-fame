export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return `${weekStart.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })} -> ${weekEnd.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function getCurrentWeek(): Date {
  return getWeekStart(new Date());
}

export function isInCurrentWeek(timestamp: string): boolean {
  const scoreDate = new Date(timestamp);
  const currentWeekStart = getCurrentWeek();
  const currentWeekEnd = getWeekEnd(currentWeekStart);
  return scoreDate >= currentWeekStart && scoreDate <= currentWeekEnd;
}