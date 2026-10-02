"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Card, Modal, PrimaryButton } from "@/components/ui";
import { eventTimeLabel, formatDateTime } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default function CalendarPage() {
  const { events } = useApp();
  const [cursor, setCursor] = useState(new Date(2026, 8, 1));
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const grid = useMemo(() => {
    const start = startOfMonth(cursor);
    const firstMondayOffset = (start.getDay() + 6) % 7;
    const begin = new Date(start);
    begin.setDate(start.getDate() - firstMondayOffset);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(begin);
      d.setDate(begin.getDate() + i);
      cells.push(d);
    }
    return cells;
  }, [cursor]);

  const today = new Date();

  return (
    <Card className="p-5">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date())}
          className="rounded-full border border-zinc-200 px-3 py-1 text-sm"
        >
          Today
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-lg p-1 hover:bg-zinc-100">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold">
              {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h1>
            <p className="text-xs text-zinc-500">
              {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} Karachi time
            </p>
          </div>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-lg p-1 hover:bg-zinc-100">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="w-[72px]" />
      </div>
      <div className="grid grid-cols-7 text-center text-sm font-medium text-zinc-500">
        {DAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-t border-zinc-100">
        {grid.map((date) => {
          const key = date.toDateString();
          const inMonth = date.getMonth() === cursor.getMonth();
          const isToday = date.toDateString() === today.toDateString();
          const dayEvents = events.filter((e) => new Date(e.start).toDateString() === key);
          return (
            <div key={key} className={`min-h-[110px] border-b border-r border-zinc-100 p-2 ${inMonth ? "bg-white" : "bg-zinc-50/60"}`}>
              <div
                className={`mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                  isToday ? "bg-red-500 font-semibold text-white" : inMonth ? "text-zinc-800" : "text-zinc-400"
                }`}
              >
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className={`block w-full truncate rounded px-1 py-0.5 text-left text-xs ${
                      e.type === "premium" ? "text-primary" : "text-blue-600"
                    }`}
                  >
                    {eventTimeLabel(e.start)} - {e.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title || ""}>
        {selected && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">{formatDateTime(selected.start)}</p>
            <p className="text-sm">{selected.description}</p>
            <p className="text-xs uppercase tracking-wide text-zinc-400">{selected.type} session</p>
            <PrimaryButton className="w-full" onClick={() => setSelected(null)}>
              Add to my plan
            </PrimaryButton>
          </div>
        )}
      </Modal>
    </Card>
  );
}
