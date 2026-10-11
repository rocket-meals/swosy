/**
 * CronScheduleHelper – reads the cron strings the workflows are scheduled with
 * (`CronHelper.getCronString`, 6 fields with seconds, or classic 5 fields) and answers two questions:
 *
 * - When does the schedule fire next? (`getNextRuns`) – computed in the time zone of the process,
 *   so on the server this matches what Directus' `schedule()` does (`TZ` of the container).
 * - What kind of schedule is it? (`describe`) – for a readable label like "Täglich um 04:00".
 *
 * Supported per field: `*`, a number, lists (`1,5`), ranges (`1-5`) and steps (`*\/5`, `0-30/10`).
 * Without Vue or Directus imports, so the module page can use it too.
 */

export type CronScheduleDescription = { kind: 'every_minute' } | { kind: 'every_minutes'; minutes: number } | { kind: 'hourly'; minute: number } | { kind: 'daily'; hour: number; minute: number } | { kind: 'weekly'; weekday: number; hour: number; minute: number } | { kind: 'monthly'; day: number; hour: number; minute: number } | { kind: 'custom' };

type CronField = {
  /** The field as written, e.g. `*\/5`. */
  raw: string;
  /** Allowed values, ascending. */
  values: number[];
  /** `*` – matters for the day-of-month / day-of-week rule. */
  wildcard: boolean;
};

/** A field as written, with the range of values it may hold, e.g. 0 to 59 for minutes. */
type CronFieldSpec = {
  raw: string;
  min: number;
  max: number;
};

type ParsedCron = {
  seconds: CronField;
  minutes: CronField;
  hours: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
};

/** How far `getNextRuns` looks ahead – enough for a yearly schedule. */
const MAX_DAYS_AHEAD = 400;

export class CronScheduleHelper {
  /** Throws for anything that is not a 5 or 6 field cron string with supported syntax. */
  static parse(cron: string): ParsedCron {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5 && parts.length !== 6) {
      throw new Error('Cron string needs 5 or 6 fields: ' + cron);
    }
    const fields = parts.length === 5 ? ['0', ...parts] : parts;
    const [seconds, minutes, hours, dayOfMonth, month, dayOfWeek] = fields as [string, string, string, string, string, string];
    const parsedDayOfWeek = CronScheduleHelper.parseField({ raw: dayOfWeek, min: 0, max: 7 });
    // 7 is Sunday as well
    parsedDayOfWeek.values = [...new Set(parsedDayOfWeek.values.map(value => value % 7))].sort((a, b) => a - b);
    return {
      seconds: CronScheduleHelper.parseField({ raw: seconds, min: 0, max: 59 }),
      minutes: CronScheduleHelper.parseField({ raw: minutes, min: 0, max: 59 }),
      hours: CronScheduleHelper.parseField({ raw: hours, min: 0, max: 23 }),
      dayOfMonth: CronScheduleHelper.parseField({ raw: dayOfMonth, min: 1, max: 31 }),
      month: CronScheduleHelper.parseField({ raw: month, min: 1, max: 12 }),
      dayOfWeek: parsedDayOfWeek,
    };
  }

  private static parseField(spec: CronFieldSpec): CronField {
    const { raw } = spec;
    const values = new Set<number>();
    for (const part of raw.split(',')) {
      const { from, to, step } = CronScheduleHelper.parsePart(part, spec);
      for (let value = from; value <= to; value += step) {
        values.add(value);
      }
    }
    return { raw, values: [...values].sort((a, b) => a - b), wildcard: raw === '*' };
  }

  /** One comma separated part of a field: `*`, `5`, `1-5`, `*\/5`, `0-30/10` or `5/10`. */
  private static parsePart(part: string, spec: CronFieldSpec): { from: number; to: number; step: number } {
    const { raw, min, max } = spec;
    const [range, stepText] = part.split('/') as [string, string | undefined];
    const step = stepText === undefined ? 1 : Number.parseInt(stepText, 10);
    if (!Number.isInteger(step) || step < 1) {
      throw new Error('Invalid cron step: ' + raw);
    }
    let from = min;
    let to = max;
    if (range !== '*') {
      const [startText, endText] = range.split('-') as [string, string | undefined];
      from = Number.parseInt(startText, 10);
      to = CronScheduleHelper.resolveRangeEnd(endText, stepText, from, max);
    }
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < min || to > max || from > to) {
      throw new Error('Invalid cron field: ' + raw);
    }
    return { from, to, step };
  }

  /** The upper end of a range: `1-5` ends at 5, `5` ends at 5, `5/10` means "from 5 every 10" and ends at `max`. */
  private static resolveRangeEnd(endText: string | undefined, stepText: string | undefined, from: number, max: number): number {
    if (endText !== undefined) {
      return Number.parseInt(endText, 10);
    }
    if (stepText === undefined) {
      return from;
    }
    return max;
  }

  /** Classic cron rule: are both day fields restricted, one of them has to match – otherwise both. */
  private static matchesDay(parsed: ParsedCron, date: Date): boolean {
    const dayOfMonthMatches = parsed.dayOfMonth.values.includes(date.getDate());
    const dayOfWeekMatches = parsed.dayOfWeek.values.includes(date.getDay());
    if (!parsed.dayOfMonth.wildcard && !parsed.dayOfWeek.wildcard) {
      return dayOfMonthMatches || dayOfWeekMatches;
    }
    return dayOfMonthMatches && dayOfWeekMatches;
  }

  /** The next `count` times strictly after `from`, in the local time zone of the process. */
  static getNextRuns(cron: string, from: Date, count: number): Date[] {
    const parsed = CronScheduleHelper.parse(cron);
    const result: Date[] = [];
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    for (let dayIndex = 0; dayIndex <= MAX_DAYS_AHEAD && result.length < count; dayIndex++) {
      const date = new Date(day.getFullYear(), day.getMonth(), day.getDate() + dayIndex);
      if (parsed.month.values.includes(date.getMonth() + 1) && CronScheduleHelper.matchesDay(parsed, date)) {
        CronScheduleHelper.addRunsOfDay(parsed, date, from, count, result);
      }
    }
    return result;
  }

  /** Appends the runs on `date` strictly after `from` to `result`, until `result` holds `count` runs. */
  private static addRunsOfDay(parsed: ParsedCron, date: Date, from: Date, count: number, result: Date[]): void {
    for (const hour of parsed.hours.values) {
      for (const minute of parsed.minutes.values) {
        for (const second of parsed.seconds.values) {
          const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, second);
          // A time that does not exist (spring DST gap) is shifted by `Date` – skip it instead of firing twice.
          if (candidate.getHours() !== hour || candidate.getTime() <= from.getTime()) {
            continue;
          }
          result.push(candidate);
          if (result.length >= count) {
            return;
          }
        }
      }
    }
  }

  /** The kind of schedule, for a readable label. Anything unusual is `custom` – show the cron string then. */
  static describe(cron: string): CronScheduleDescription {
    let parsed: ParsedCron;
    try {
      parsed = CronScheduleHelper.parse(cron);
    } catch {
      return { kind: 'custom' };
    }
    const { minutes, hours, dayOfMonth, month, dayOfWeek } = parsed;
    const minute = CronScheduleHelper.singleValue(minutes);
    const hour = CronScheduleHelper.singleValue(hours);
    if (!month.wildcard || parsed.seconds.values.length !== 1) {
      return { kind: 'custom' };
    }
    const everyDay = dayOfMonth.wildcard && dayOfWeek.wildcard;
    if (everyDay && hours.wildcard) {
      return CronScheduleHelper.describeEveryHour(minutes, minute);
    }
    if (minute === undefined || hour === undefined) {
      return { kind: 'custom' };
    }
    if (everyDay) {
      return { kind: 'daily', hour, minute };
    }
    return CronScheduleHelper.describeWeeklyOrMonthly(dayOfMonth, dayOfWeek, hour, minute);
  }

  /** The only value of a field like `5` – undefined for lists, ranges and steps. */
  private static singleValue(field: CronField): number | undefined {
    return field.values.length === 1 && !field.raw.includes('/') ? field.values[0] : undefined;
  }

  /** Every day, every hour: every minute, every n minutes or once an hour. */
  private static describeEveryHour(minutes: CronField, minute: number | undefined): CronScheduleDescription {
    if (minutes.wildcard) {
      return { kind: 'every_minute' };
    }
    const step = /^\*\/(\d+)$/.exec(minutes.raw);
    if (step?.[1]) {
      return { kind: 'every_minutes', minutes: Number.parseInt(step[1], 10) };
    }
    if (minute !== undefined) {
      return { kind: 'hourly', minute };
    }
    return { kind: 'custom' };
  }

  /** A fixed time on one weekday or one day of the month. */
  private static describeWeeklyOrMonthly(dayOfMonth: CronField, dayOfWeek: CronField, hour: number, minute: number): CronScheduleDescription {
    const weekday = CronScheduleHelper.singleValue(dayOfWeek);
    if (dayOfMonth.wildcard && weekday !== undefined) {
      return { kind: 'weekly', weekday, hour, minute };
    }
    const day = CronScheduleHelper.singleValue(dayOfMonth);
    if (dayOfWeek.wildcard && day !== undefined) {
      return { kind: 'monthly', day, hour, minute };
    }
    return { kind: 'custom' };
  }
}
