export function createGoogleCalendarUrl(event: {
  title: string;
  description?: string;
  start: string | Date;
  end?: string | Date;
  location?: string;
}): string {
  const startDate = new Date(event.start);
  const endDate = event.end && !isNaN(new Date(event.end).getTime())
    ? new Date(event.end)
    : new Date(startDate.getTime() + 60 * 60 * 1000);

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
  const startDate = new Date(event.start);
  const endDate = event.end && !isNaN(new Date(event.end).getTime())
    ? new Date(event.end)
    : new Date(startDate.getTime() + 60 * 60 * 1000);
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

export function parseMeetingStartTime(startStr?: string, meetSyncTimeStr?: string): Date {
  if (startStr) {
    const d = new Date(startStr);
    if (!isNaN(d.getTime())) return d;
  }
  if (meetSyncTimeStr) {
    const timeMatch = meetSyncTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;

      const d = new Date();
      if (meetSyncTimeStr.toLowerCase().includes("tomorrow")) {
        d.setDate(d.getDate() + 1);
      }
      d.setHours(hours, minutes, 0, 0);
      return d;
    }
    const d = new Date(meetSyncTimeStr);
    if (!isNaN(d.getTime())) return d;
  }
  // Default fallback: 1 hour in future
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
