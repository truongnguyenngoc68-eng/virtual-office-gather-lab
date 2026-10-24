/**
 * Utility functions for generating recurring events
 */

export interface RecurrencePattern {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
  occurrences?: number;
}

/**
 * Generate recurring event instances from a pattern
 */
export const generateRecurringEvents = (
  startDate: Date,
  endDate: Date,
  pattern: RecurrencePattern
): Date[] => {
  const instances: Date[] = [];
  let currentDate = new Date(startDate);
  let count = 0;
  const maxOccurrences = pattern.occurrences || 365; // Default to 1 year

  while (count < maxOccurrences) {
    // Check if we've passed the end date
    if (pattern.endDate && currentDate > pattern.endDate) {
      break;
    }

    instances.push(new Date(currentDate));

    // Calculate next occurrence
    switch (pattern.frequency) {
      case "daily":
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + pattern.interval);
        break;

      case "weekly":
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          // Find next occurrence on specified days
          const nextDate = findNextDayOfWeek(currentDate, pattern.daysOfWeek);
          currentDate = new Date(nextDate);
          if (nextDate <= currentDate) {
            currentDate.setDate(currentDate.getDate() + 7 * pattern.interval);
          }
        } else {
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 7 * pattern.interval);
        }
        break;

      case "monthly":
        if (pattern.dayOfMonth) {
          currentDate = new Date(currentDate);
          currentDate.setMonth(currentDate.getMonth() + pattern.interval);
          currentDate.setDate(pattern.dayOfMonth);
        } else {
          currentDate = new Date(currentDate);
          currentDate.setMonth(currentDate.getMonth() + pattern.interval);
        }
        break;

      case "yearly":
        currentDate = new Date(currentDate);
        currentDate.setFullYear(currentDate.getFullYear() + pattern.interval);
        break;
    }

    count++;
  }

  return instances;
};

/**
 * Find next occurrence of specified days of week
 */
const findNextDayOfWeek = (fromDate: Date, daysOfWeek: number[]): Date => {
  const currentDay = fromDate.getDay();
  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

  // Find next day this week
  for (const day of sortedDays) {
    if (day > currentDay) {
      const nextDate = new Date(fromDate);
      nextDate.setDate(nextDate.getDate() + (day - currentDay));
      return nextDate;
    }
  }

  // If no day found this week, use first day of next week
  const nextDate = new Date(fromDate);
  const daysUntilNext = 7 - currentDay + sortedDays[0];
  nextDate.setDate(nextDate.getDate() + daysUntilNext);
  return nextDate;
};

/**
 * Calculate reminder times for an event
 */
export const calculateReminderTimes = (
  eventStartTime: Date,
  reminderMinutes: number[]
): Date[] => {
  return reminderMinutes
    .map((minutes) => {
      const reminderTime = new Date(eventStartTime);
      reminderTime.setMinutes(reminderTime.getMinutes() - minutes);
      return reminderTime;
    })
    .filter((time) => time > new Date()) // Only future reminders
    .sort((a, b) => a.getTime() - b.getTime());
};
