import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Trash2, Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { manageEventCheckIn } from '@/functions/manageEventCheckIn';

export default function EventsModal({ projectId, isOpen, onClose, darkMode }) {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', startDate: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (isOpen && projectId) {
      loadEvents();
    }
  }, [isOpen, projectId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await base44.entities.Event.filter({ projectId });
      setEvents(allEvents);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await manageEventCheckIn({
        action: 'create',
        projectId,
        name: data.name,
        startDate: new Date(data.startDate).toISOString(),
        notes: data.notes
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Event created & check-in scheduled for 2 hours after');
      setFormData({ name: '', startDate: '', notes: '' });
      setShowForm(false);
      loadEvents();
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => {
      toast.error('Failed to create event');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId) => {
      const response = await manageEventCheckIn({
        action: 'delete',
        eventId
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Event and check-in canceled');
      loadEvents();
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => {
      toast.error('Failed to delete event');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.startDate) {
      toast.error('Please fill in all fields');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`
      }}>
        <DialogHeader>
          <DialogTitle style={{ color: darkMode ? '#ffffff' : '#111827' }}>
            Project Events
          </DialogTitle>
        </DialogHeader>

        {!showForm ? (
          <div className="space-y-3">
            {loading ? (
              <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>Loading events...</p>
            ) : events.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                      border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium" style={{ color: darkMode ? '#ffffff' : '#111827' }}>
                        {event.name}
                      </p>
                      <p className="text-sm flex items-center gap-1" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                        <Calendar className="w-3 h-3" />
                        {format(new Date(event.startDate), 'MMM d, h:mm a')}
                      </p>
                      {event.notes && (
                        <p className="text-xs mt-1" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
                          {event.notes}
                        </p>
                      )}
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#22A699' }}>
                        <Clock className="w-3 h-3" />
                        Check-in scheduled 2 hours after
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(event.id)}
                      disabled={deleteMutation.isPending}
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                      className="flex-shrink-0 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} className="text-center py-4">
                No events yet. Add one to get started!
              </p>
            )}

            <Button
              onClick={() => setShowForm(true)}
              className="w-full"
              style={{ backgroundColor: '#22A699' }}
            >
              + New Event
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
                Event Name
              </label>
              <Input
                placeholder="e.g., Client meeting, Project launch"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  backgroundColor: darkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: darkMode ? '#ffffff' : '#111827'
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
                Start Date & Time
              </label>
              <Input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                style={{
                  backgroundColor: darkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: darkMode ? '#ffffff' : '#111827'
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
                Notes (optional)
              </label>
              <Textarea
                placeholder="Add any details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                style={{
                  backgroundColor: darkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: darkMode ? '#ffffff' : '#111827'
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
                style={{
                  backgroundColor: darkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: darkMode ? '#d1d5db' : '#374151'
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
                style={{ backgroundColor: '#22A699' }}
              >
                Create Event
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}