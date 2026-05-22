import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { manageEventCheckIn } from "@/functions/manageEventCheckIn";

export default function EventModal({ event, defaultDate, profile, onSave, onDelete, onClose }) {
  const dark = profile?.darkMode;

  const defaultStart = event?.startDate
    ? event.startDate.slice(0, 16)
    : defaultDate
    ? format(defaultDate, "yyyy-MM-dd") + "T09:00"
    : format(new Date(), "yyyy-MM-dd") + "T09:00";

  const defaultEnd = event?.endDate
    ? event.endDate.slice(0, 16)
    : defaultDate
    ? format(defaultDate, "yyyy-MM-dd") + "T10:00"
    : format(new Date(), "yyyy-MM-dd") + "T10:00";

  const [name, setName] = useState(event?.name || "");
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [notes, setNotes] = useState(event?.notes || "");
  const [projectId, setProjectId] = useState(event?.projectId || "");
  const [saving, setSaving] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const cardBg = dark ? "#1f2937" : "#ffffff";
  const border = dark ? "#374151" : "#e5e7eb";
  const textPrimary = dark ? "#ffffff" : "#111827";
  const textMuted = dark ? "#9ca3af" : "#6b7280";
  const inputBg = dark ? "#111827" : "#f9fafb";

  const handleSave = async () => {
    if (!name.trim() || !startDate) return;
    setSaving(true);
    
    // Convert local datetime to UTC ISO string
    // datetime-local input gives "2026-05-13T09:00" in the user's local timezone
    // We need to convert to UTC for storage
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      const [datePart, timePart] = dateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      // Create date in local timezone
      const localDate = new Date(year, month - 1, day, hours, minutes, 0);
      // Convert to UTC ISO string
      return localDate.toISOString();
    };
    
    try {
      if (event) {
        // Update existing event through manageEventCheckIn
        await manageEventCheckIn({
          action: 'update',
          eventId: event.id,
          name: name.trim(),
          startDate: formatDate(startDate),
          endDate: endDate ? formatDate(endDate) : null,
          notes,
          projectId: projectId || null
        });
      } else {
        // Create new event through onSave
        await onSave({ 
          name: name.trim(), 
          startDate: formatDate(startDate), 
          endDate: endDate ? formatDate(endDate) : null, 
          notes, 
          projectId: projectId || null 
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: textPrimary }}>
            {event ? "Edit Event" : "New Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: textMuted }}>Event Name *</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Wedding photography, Client meeting"
              style={{ backgroundColor: inputBg, borderColor: border, color: textPrimary }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textMuted }}>Start *</label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ backgroundColor: inputBg, borderColor: border, color: textPrimary }}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: textMuted }}>End</label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ backgroundColor: inputBg, borderColor: border, color: textPrimary }}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: textMuted }}>Link to Project</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ backgroundColor: inputBg, borderColor: border, color: textPrimary }}
            >
              <option value="">— No project —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: textMuted }}>Notes</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any details about this event..."
              rows={2}
              style={{ backgroundColor: inputBg, borderColor: border, color: textPrimary }}
            />
          </div>

          <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(34,166,153,0.08)", color: "#22A699" }}>
            📩 You'll receive a check-in notification 2 hours after this event starts to log any income or expenses.
          </p>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !startDate || saving}
              className="flex-1"
              style={{ backgroundColor: "#22A699", color: "#ffffff" }}
            >
              {saving ? "Saving..." : event ? "Update Event" : "Create Event"}
            </Button>
            {event && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDelete(event.id)}
                style={{ borderColor: "#ef4444", color: "#ef4444" }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}