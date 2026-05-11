import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RecurringSubscriptionModal({ 
  isOpen, 
  onClose, 
  expense, 
  onConfirm,
  darkMode
}) {
  const [frequency, setFrequency] = useState("monthly");
  const [customDays, setCustomDays] = useState("");
  const [name, setName] = useState(expense?.vendor || "");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm({
        name,
        frequency,
        customDays: frequency === "custom" ? parseInt(customDays) : undefined,
        notes,
      });
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFrequency("monthly");
    setCustomDays("");
    setName(expense?.vendor || "");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent style={{
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`
      }}>
        <DialogHeader>
          <DialogTitle style={{ color: darkMode ? '#ffffff' : '#111827' }}>
            Create Recurring Subscription
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
              Subscription Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Claude, Base44"
              style={{
                backgroundColor: darkMode ? '#374151' : '#ffffff',
                border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                color: darkMode ? '#ffffff' : '#111827'
              }}
              className="mt-1"
            />
          </div>

          <div>
            <Label style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
              Billing Frequency
            </Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="mt-1" style={{
                backgroundColor: darkMode ? '#374151' : '#ffffff',
                border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                color: darkMode ? '#ffffff' : '#111827'
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{
                backgroundColor: darkMode ? '#374151' : '#ffffff',
                border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`
              }}>
                <SelectItem value="weekly" style={{ color: darkMode ? '#ffffff' : '#111827' }}>Weekly</SelectItem>
                <SelectItem value="monthly" style={{ color: darkMode ? '#ffffff' : '#111827' }}>Monthly</SelectItem>
                <SelectItem value="yearly" style={{ color: darkMode ? '#ffffff' : '#111827' }}>Yearly</SelectItem>
                <SelectItem value="custom" style={{ color: darkMode ? '#ffffff' : '#111827' }}>Custom (days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === "custom" && (
            <div>
              <Label style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
                Days Between Charges
              </Label>
              <Input
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="e.g., 14"
                min="1"
                style={{
                  backgroundColor: darkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: darkMode ? '#ffffff' : '#111827'
                }}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
              Notes (optional)
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              style={{
                backgroundColor: darkMode ? '#374151' : '#ffffff',
                border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                color: darkMode ? '#ffffff' : '#111827'
              }}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} style={{
            backgroundColor: darkMode ? '#374151' : '#ffffff',
            border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
            color: darkMode ? '#d1d5db' : '#374151'
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!name || (frequency === "custom" && !customDays) || isLoading}
            style={{ backgroundColor: '#22A699' }}
          >
            {isLoading ? "Creating..." : "Create Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}