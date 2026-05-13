import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, RefreshCw, Upload } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import EventModal from "@/components/calendar/EventModal";
import { manageEventCheckIn } from "@/functions/manageEventCheckIn";
import { googleCalendarSync } from "@/functions/googleCalendarSync";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: profile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const dark = profile?.darkMode;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => base44.entities.Event.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: incomeItems = [] } = useQuery({
    queryKey: ["incomeItems"],
    queryFn: () => base44.entities.IncomeItem.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: expenseItems = [] } = useQuery({
    queryKey: ["expenseItems"],
    queryFn: () => base44.entities.ExpenseItem.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: googleConnected = false } = useQuery({
    queryKey: ["googleCalendarConnected"],
    queryFn: async () => {
      try {
        await googleCalendarSync({ action: "check" });
        return true;
      } catch {
        return false;
      }
    },
    enabled: !!user,
  });

  // Build a map: dateStr -> { hasIncome, hasExpense, events[] }
  const dayData = useMemo(() => {
    const map = {};
    for (const item of incomeItems) {
      const d = item.date?.split("T")[0];
      if (!d) continue;
      if (!map[d]) map[d] = { hasIncome: false, hasExpense: false, events: [] };
      map[d].hasIncome = true;
    }
    for (const item of expenseItems) {
      const d = item.date?.split("T")[0];
      if (!d) continue;
      if (!map[d]) map[d] = { hasIncome: false, hasExpense: false, events: [] };
      map[d].hasExpense = true;
    }
    for (const ev of events) {
      const d = ev.startDate?.split("T")[0];
      if (!d) continue;
      if (!map[d]) map[d] = { hasIncome: false, hasExpense: false, events: [] };
      map[d].events.push(ev);
    }
    return map;
  }, [incomeItems, expenseItems, events]);

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (e, ev) => {
    e.stopPropagation();
    setSelectedEvent(ev);
    setSelectedDate(null);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (data) => {
    try {
      if (selectedEvent) {
        await manageEventCheckIn({ ...data, action: "update", eventId: selectedEvent.id });
        toast.success("Event updated");
      } else {
        await manageEventCheckIn({ ...data, action: "create" });
        toast.success("Event created — you'll get a check-in notification 2 hours after it starts!");
      }
      queryClient.invalidateQueries(["events"]);
      setShowEventModal(false);
    } catch (err) {
      toast.error("Failed to save event: " + err.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await manageEventCheckIn({ action: "delete", eventId });
      toast.success("Event deleted");
      queryClient.invalidateQueries(["events"]);
      setShowEventModal(false);
    } catch (err) {
      toast.error("Failed to delete event: " + err.message);
    }
  };

  const handleImportFromGoogle = async () => {
    setSyncing(true);
    try {
      const res = await googleCalendarSync({ action: "import" });
      const count = res.data?.imported ?? 0;
      toast.success(`Imported ${count} event(s) from Google Calendar`);
      queryClient.invalidateQueries(["events"]);
    } catch (err) {
      toast.error("Import failed: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleExportToGoogle = async () => {
    setExporting(true);
    try {
      const res = await googleCalendarSync({ action: "export" });
      const count = res.data?.exported ?? 0;
      toast.success(`Exported ${count} event(s) to Google Calendar`);
    } catch (err) {
      toast.error("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const url = await base44.connectors.connectAppUser("6a048dedf01204ab3851c9a5");
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          queryClient.invalidateQueries(["googleCalendarConnected"]);
        }
      }, 500);
    } catch (err) {
      toast.error("Failed to connect: " + err.message);
    }
  };

  const bg = dark ? "#0f0f0f" : "#f9fafb";
  const cardBg = dark ? "#1a1a1a" : "#ffffff";
  const border = dark ? "#374151" : "#e5e7eb";
  const textPrimary = dark ? "#ffffff" : "#111827";
  const textMuted = dark ? "#9ca3af" : "#6b7280";

  return (
    <div className="p-4 md:p-6" style={{ backgroundColor: bg }}>
      <div className="max-w-5xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-wrap gap-2 mb-6">
            {googleConnected ? (
              <>
                <Button
                  onClick={handleImportFromGoogle}
                  disabled={syncing}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  style={{ backgroundColor: cardBg, border: `1px solid ${border}`, color: textPrimary }}
                >
                  {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Import from Google
                </Button>
                <Button
                  onClick={handleExportToGoogle}
                  disabled={exporting}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  style={{ backgroundColor: cardBg, border: `1px solid ${border}`, color: textPrimary }}
                >
                  {exporting ? <Upload className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Export to Google
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConnectGoogle}
                size="sm"
                className="gap-2"
                style={{ backgroundColor: "#22A699", color: "#ffffff" }}
              >
                <CalendarIcon className="w-4 h-4" /> Connect Google Calendar
              </Button>
            )}
            <Button
              onClick={() => { setSelectedEvent(null); setSelectedDate(new Date()); setShowEventModal(true); }}
              size="sm"
              className="gap-2"
              style={{ backgroundColor: "#22A699", color: "#ffffff" }}
            >
              <Plus className="w-4 h-4" /> New Event
            </Button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 text-xs" style={{ color: textMuted }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> Expense
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "#22A699" }} /> Event
          </span>
        </div>

        {/* Calendar Card */}
        <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ backgroundColor: cardBg, borderColor: border }}>
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: border }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              style={{ color: textPrimary }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold" style={{ color: textPrimary }}>
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              style={{ color: textPrimary }}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: border }}>
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium" style={{ color: textMuted }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {calDays.map((day, idx) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const data = dayData[dateStr] || {};
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const hasEvents = data.events?.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className="min-h-[80px] md:min-h-[100px] p-1.5 border-b border-r cursor-pointer transition-colors"
                  style={{
                    borderColor: border,
                    backgroundColor: today
                      ? dark ? "rgba(34,166,153,0.12)" : "rgba(34,166,153,0.06)"
                      : "transparent",
                    opacity: inMonth ? 1 : 0.35,
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = dark ? "#1f2937" : "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = today ? (dark ? "rgba(34,166,153,0.12)" : "rgba(34,166,153,0.06)") : "transparent"}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full"
                      style={{
                        backgroundColor: today ? "#22A699" : "transparent",
                        color: today ? "#ffffff" : inMonth ? textPrimary : textMuted,
                      }}
                    >
                      {format(day, "d")}
                    </span>
                    {/* Dots */}
                    <div className="flex gap-0.5">
                      {data.hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                      {data.hasExpense && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-0.5">
                    {(data.events || []).slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        onClick={e => handleEventClick(e, ev)}
                        className="text-xs px-1 py-0.5 rounded truncate font-medium"
                        style={{ backgroundColor: "rgba(34,166,153,0.15)", color: "#22A699" }}
                      >
                        {ev.name}
                      </div>
                    ))}
                    {(data.events || []).length > 2 && (
                      <div className="text-xs px-1" style={{ color: textMuted }}>
                        +{data.events.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="mt-6">
          <h3 className="text-base font-semibold mb-3" style={{ color: textPrimary }}>
            Upcoming Events This Month
          </h3>
          {events
            .filter(ev => {
              const d = ev.startDate?.split("T")[0];
              return d >= format(monthStart, "yyyy-MM-dd") && d <= format(monthEnd, "yyyy-MM-dd");
            })
            .sort((a, b) => a.startDate?.localeCompare(b.startDate))
            .slice(0, 8)
            .map(ev => (
              <div
                key={ev.id}
                onClick={e => handleEventClick(e, ev)}
                className="flex items-center gap-4 p-3 rounded-xl mb-2 cursor-pointer border transition-colors"
                style={{ backgroundColor: cardBg, borderColor: border }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center" style={{ backgroundColor: "rgba(34,166,153,0.12)" }}>
                  <span className="text-xs font-bold" style={{ color: "#22A699" }}>
                    {format(parseISO(ev.startDate), "dd")}
                  </span>
                  <span className="text-xs" style={{ color: "#22A699" }}>
                    {format(parseISO(ev.startDate), "MMM")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: textPrimary }}>{ev.name}</p>
                  <p className="text-xs" style={{ color: textMuted }}>
                    {format(parseISO(ev.startDate), "MMM d, yyyy · h:mm a")}
                    {ev.endDate ? ` – ${format(parseISO(ev.endDate), "h:mm a")}` : ""}
                  </p>
                </div>
                <CalendarIcon className="w-4 h-4 flex-shrink-0" style={{ color: textMuted }} />
              </div>
            ))
          }
          {events.filter(ev => {
            const d = ev.startDate?.split("T")[0];
            return d >= format(monthStart, "yyyy-MM-dd") && d <= format(monthEnd, "yyyy-MM-dd");
          }).length === 0 && (
            <p className="text-sm py-4 text-center" style={{ color: textMuted }}>
              No events this month. Click any day to add one!
            </p>
          )}
        </div>
      </div>

      {showEventModal && (
        <EventModal
          event={selectedEvent}
          defaultDate={selectedDate}
          profile={profile}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onClose={() => setShowEventModal(false)}
        />
      )}
    </div>
  );
}