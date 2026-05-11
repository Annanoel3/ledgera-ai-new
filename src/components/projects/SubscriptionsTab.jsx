import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SubscriptionsTab({ projectId, darkMode }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    customDays: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });
  const queryClient = useQueryClient();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions', projectId],
    queryFn: () => base44.entities.RecurringSubscription.filter({ projectId, active: true })
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('createRecurringFromChat', {
        projectId,
        name: data.name,
        amount: parseFloat(data.amount),
        frequency: data.frequency,
        customDays: data.frequency === 'custom' ? parseInt(data.customDays) : null,
        startDate: data.startDate,
        notes: data.notes
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subscription created');
      setFormData({
        name: '',
        amount: '',
        frequency: 'monthly',
        customDays: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['subscriptions', projectId] });
    },
    onError: () => {
      toast.error('Failed to create subscription');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (subscriptionId) => {
      await base44.entities.RecurringSubscription.update(subscriptionId, {
        active: false,
        endDate: format(new Date(), 'yyyy-MM-dd')
      });
    },
    onSuccess: () => {
      toast.success('Subscription canceled');
      queryClient.invalidateQueries({ queryKey: ['subscriptions', projectId] });
    },
    onError: () => {
      toast.error('Failed to cancel subscription');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.amount || !formData.startDate) {
      toast.error('Fill in all required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  const frequencyLabels = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    custom: 'Custom'
  };

  return (
    <div className="space-y-4">
      {subscriptions.length > 0 && (
        <div className="space-y-2">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{
                backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`
              }}
            >
              <div className="flex-1">
                <p className="font-medium" style={{ color: darkMode ? '#ffffff' : '#111827' }}>
                  {sub.name}
                </p>
                <p className="text-sm" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                  ${sub.amount} {frequencyLabels[sub.frequency]}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => cancelMutation.mutate(sub.id)}
                disabled={cancelMutation.isPending}
                style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full gap-2"
          style={{ backgroundColor: '#22A699' }}
        >
          <Plus className="w-4 h-4" /> Add Subscription
        </Button>
      ) : (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent style={{
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`
          }}>
            <DialogHeader>
              <DialogTitle style={{ color: darkMode ? '#ffffff' : '#111827' }}>
                Add Recurring
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
                  Subscription Name *
                </label>
                <Input
                  placeholder="e.g., ChatGPT Pro"
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
                  Amount *
                </label>
                <Input
                  type="number"
                  placeholder="19.99"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  step="0.01"
                  style={{
                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                    border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                    color: darkMode ? '#ffffff' : '#111827'
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
                  Frequency *
                </label>
                <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                  <SelectTrigger style={{
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
                    <SelectItem value="custom" style={{ color: darkMode ? '#ffffff' : '#111827' }}>Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.frequency === 'custom' && (
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
                    Days Between Charges *
                  </label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={formData.customDays}
                    onChange={(e) => setFormData({ ...formData, customDays: e.target.value })}
                    style={{
                      backgroundColor: darkMode ? '#374151' : '#ffffff',
                      border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                      color: darkMode ? '#ffffff' : '#111827'
                    }}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}