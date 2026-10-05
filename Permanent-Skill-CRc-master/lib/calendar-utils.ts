export function createGoogleCalendarUrl(event: {
  title: string;
  description?: string;
  start: string | Date;
  end?: string | Date;
  location?: string;
}): string {
  const currentYear = new Date().getFullYear();
  let startDate = new Date(event.start);
  if (isNaN(startDate.getTime())) {
    startDate = parseMeetingStartTime(undefined, typeof event.start === "string" ? event.start : undefined);
  } else if (startDate.getFullYear() < 2020) {
    startDate.setFullYear(currentYear);
  }

  let endDate = event.end && !isNaN(new Date(event.end).getTime())
    ? new Date(event.end)
    : new Date(startDate.getTime() + 60 * 60 * 1000);
  if (endDate.getFullYear() < 2020) {
    endDate.setFullYear(currentYear);
  }

  const formatGCal = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d+/g, "");
  };

  const dates = `${formatGCal(startDate)}/${formatGCal(endDate)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
    details: event.description || "Permanent Skills Academy Live Mastermind / Training Session.",
    location: event.location || "Online Google Meet / Video Room",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateIcsFileContent(event: {
  title: string;
  description?: string;
  start: string | Date;
  end?: string | Date;
  location?: string;
  url?: string;
}): string {
  const currentYear = new Date().getFullYear();
  let startDate = new Date(event.start);
  if (isNaN(startDate.getTime())) {
    startDate = parseMeetingStartTime(undefined, typeof event.start === "string" ? event.start : undefined);
  } else if (startDate.getFullYear() < 2020) {
    startDate.setFullYear(currentYear);
  }

  let endDate = event.end && !isNaN(new Date(event.end).getTime())
    ? new Date(event.end)
    : new Date(startDate.getTime() + 60 * 60 * 1000);
  if (endDate.getFullYear() < 2020) {
    endDate.setFullYear(currentYear);
  }

  const formatIcs = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Permanent Skills Academy//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@permanentseo.com`,
    `DTSTAMP:${formatIcs(new Date())}`,
    `DTSTART:${formatIcs(startDate)}`,
    `DTEND:${formatIcs(endDate)}`,
    `SUMMARY:${event.title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${event.location || event.url || "Online Video Conference"}`,
    `URL:${event.url || "https://permanentseo.com/calendar"}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcsCalendarFile(event: {
  title: string;
  description?: string;
  start: string | Date;
  end?: string | Date;
  location?: string;
  url?: string;
}) {
  if (typeof window === "undefined") return;
  const icsData = generateIcsFileContent(event);
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type MeetingTimingStatus = "ended" | "can_join" | "waiting";

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const WEEKDAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

export function parseMeetingStartTime(startStr?: string, meetSyncTimeStr?: string): Date {
  const currentYear = new Date().getFullYear();

  if (startStr) {
    const d = new Date(startStr);
    if (!isNaN(d.getTime())) {
      if (d.getFullYear() < 2020) d.setFullYear(currentYear);
      return d;
    }
  }

  if (meetSyncTimeStr) {
    const str = meetSyncTimeStr.trim();
    const strLower = str.toLowerCase();

    // 0. Explicit completed / archived / ended state
    if (
      strLower.includes("completed") ||
      strLower.includes("wrap-up: completed") ||
      strLower.includes("archived") ||
      strLower.includes("ended")
    ) {
      return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // 1. Extract Time if present (e.g., 12:00 PM, 3:00 PM, 4:30 PM, or 15:30)
    let hours = 15; // default 3 PM
    let minutes = 0;
    let hasTime = false;

    const time12Match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (time12Match) {
      hours = parseInt(time12Match[1], 10);
      minutes = parseInt(time12Match[2], 10);
      const ampm = time12Match[3].toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      hasTime = true;
    } else {
      const time24Match = str.match(/\b(\d{1,2}):(\d{2})\b/);
      if (time24Match) {
        hours = parseInt(time24Match[1], 10);
        minutes = parseInt(time24Match[2], 10);
        hasTime = true;
      }
    }

    // 2. Check for explicit Month + Day (e.g. "Wed, Oct 7, 12:00 PM", "Oct 7", "October 7, 2026")
    const monthMatch = strLower.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/);
    if (monthMatch) {
      const monthName = monthMatch[1];
      const monthIndex = MONTH_MAP[monthName];

      // Look for day number before or after month
      const dayMatch = str.match(new RegExp(`(?:${monthName}\\s*(\\d{1,2})|(\\d{1,2})\\s*${monthName})`, "i"));
      const dayNum = dayMatch ? parseInt(dayMatch[1] || dayMatch[2], 10) : NaN;

      // Look for 4-digit year
      const yearMatch = str.match(/\b(20\d{2})\b/);
      const yearNum = yearMatch ? parseInt(yearMatch[1], 10) : currentYear;

      if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31 && monthIndex !== undefined) {
        return new Date(yearNum, monthIndex, dayNum, hours, minutes, 0, 0);
      }
    }

    // 3. Check for relative "today" or "tomorrow"
    if (strLower.includes("today")) {
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d;
    }

    if (strLower.includes("tomorrow")) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(hours, minutes, 0, 0);
      return d;
    }

    // 4. Check for Weekday (e.g. "Friday, 2:00 PM", "Weekly Review: Friday, 4:30 PM")
    const weekdayMatch = strLower.match(/\b(sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\b/);
    if (weekdayMatch) {
      const targetDay = WEEKDAY_MAP[weekdayMatch[1]];
      if (targetDay !== undefined) {
        const now = new Date();
        const currentDay = now.getDay();
        let diff = (targetDay - currentDay + 7) % 7;
        if (diff === 0) {
          const testToday = new Date(now);
          testToday.setHours(hours, minutes, 0, 0);
          if (testToday.getTime() < now.getTime()) {
            diff = 7;
          }
        }
        const d = new Date(now);
        d.setDate(d.getDate() + diff);
        d.setHours(hours, minutes, 0, 0);
        return d;
      }
    }

    // 5. Try standard date parsing
    const directDate = new Date(str);
    if (!isNaN(directDate.getTime())) {
      if (directDate.getFullYear() < 2020) {
        directDate.setFullYear(currentYear);
      }
      return directDate;
    }

    // 6. If has time but no specific date, assume today
    if (hasTime) {
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d;
    }
  }

  // Fallback: 1 hour from now
  return new Date(Date.now() + 60 * 60 * 1000);
}

export function checkMeetingStatus(
  startStr?: string,
  endStr?: string,
  meetSyncTimeStr?: string
): {
  status: MeetingTimingStatus;
  startDate: Date;
  endDate: Date;
  msUntilStart: number;
  msUntilCanJoin: number;
} {
  const startDate = parseMeetingStartTime(startStr, meetSyncTimeStr);
  const endDate = endStr && !isNaN(new Date(endStr).getTime())
    ? new Date(endStr)
    : new Date(startDate.getTime() + 60 * 60 * 1000);

  const now = Date.now();
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const canJoinMs = startMs - 5 * 60 * 1000; // 5 mins before start

  let status: MeetingTimingStatus = "waiting";
  if (now > endMs) {
    status = "ended";
  } else if (now >= canJoinMs) {
    status = "can_join";
  } else {
    status = "waiting";
  }

  return {
    status,
    startDate,
    endDate,
    msUntilStart: Math.max(0, startMs - now),
    msUntilCanJoin: Math.max(0, canJoinMs - now),
  };
}
