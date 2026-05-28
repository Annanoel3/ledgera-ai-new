import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function MakeRecurringDialog({ expense, darkMode, onConfirm, onClose }) {
  const [frequency, setFrequency] = useState("monthly");
  const [endDate, setEndDate] = useState("");

  const handleConfirm = () => {
    onConfirm({ expense, frequency, endDate: endDate || null });
  };

  return (
    <Dialog open={!!expense} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent style={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
        <DialogHeader>
          <DialogTitle style={{ color: darkMode ? '#ffffff' : '#111827' }}>Make Recurring</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
            Convert <strong style={{ color: darkMode ? '#ffffff' : '#111827' }}>{expense?.vendor || "this expense"}</strong> (${expense?.amount?.toFixed(2)}) into a recurring subscription.
          </p>

          <div className="space-y-2">
            <Label style={{ color: darkMode ? '#d1d5db' : '#374151' }}>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger style={{ backgroundColor: darkMode ? '#374151' : '#ffffff', border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`, color: darkMode ? '#ffffff' : '#111827' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: darkMode ? '#374151' : '#ffffff' }}>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label style={{ color: darkMode ? '#d1d5db' : '#374151' }}>End Date (optional)</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ backgroundColor: darkMode ? '#374151' : '#ffffff', border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`, color: darkMode ? '#ffffff' : '#111827' }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} style={{ backgroundColor: darkMode ? '#374151' : '#ffffff', color: darkMode ? '#d1d5db' : '#374151' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} style={{ backgroundColor: '#22A699', color: '#ffffff' }}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}