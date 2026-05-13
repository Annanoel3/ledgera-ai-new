import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, ArrowLeftRight, DollarSign, CreditCard } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function QuickEditItem({ item, type, projects, onUpdate, onDelete, onConvert, formatCurrency, profile }) {
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState(item);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);

  const project = projects.find(p => p.id === item.projectId);

  const handleQuickUpdate = async (field, value) => {
    await onUpdate(item.id, { [field]: value });
  };

  const handleFullUpdate = async () => {
    await onUpdate(item.id, editData);
    setShowEdit(false);
  };

  const handleConvert = async () => {
    await onConvert(item.id, type === 'income' ? 'expense' : 'income');
    setShowConvertConfirm(false);
  };

  return (
    <>
      <div 
        className="p-4 rounded-lg border transition-all hover:shadow-md"
        style={{
          backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {type === 'income' ? <DollarSign className="w-3 h-3 mr-1" /> : <CreditCard className="w-3 h-3 mr-1" />}
                {type}
              </Badge>
              <span className="text-xs" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                {format(new Date(item.date), 'MMM d, yyyy')}
              </span>
            </div>
            
            <p className="font-medium mb-1" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
              {item.notes || item.vendor || 'No description'}
            </p>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={item.projectId}
                onValueChange={(val) => handleQuickUpdate('projectId', val)}
              >
                <SelectTrigger className="w-40 h-8 text-xs" style={{
                  backgroundColor: profile?.darkMode ? '#1f2937' : '#f9fafb',
                  border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: profile?.darkMode ? '#ffffff' : '#111827'
                }}>
                  <SelectValue>{project?.title || 'Select project'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={item.category || 'other'}
                onValueChange={(val) => handleQuickUpdate('category', val)}
              >
                <SelectTrigger className="w-40 h-8 text-xs" style={{
                  backgroundColor: profile?.darkMode ? '#1f2937' : '#f9fafb',
                  border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                  color: profile?.darkMode ? '#ffffff' : '#111827'
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {type === 'expense' ? (
                    <>
                      <SelectItem value="supplies">Supplies & Materials</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="professional">Professional Services</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="homeOffice">Home Office</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="product">Product Sales</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className={`text-xl font-bold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(item.amount)}
            </p>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowEdit(true)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowConvertConfirm(true)}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:text-red-600"
                onClick={() => {
                  if (confirm('Delete this item?')) onDelete(item.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent style={{
          backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`
        }}>
          <DialogHeader>
            <DialogTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
              Edit {type === 'income' ? 'Income' : 'Expense'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={editData.amount}
                onChange={(e) => setEditData({...editData, amount: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={editData.date}
                onChange={(e) => setEditData({...editData, date: e.target.value})}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={editData.notes || ''}
                onChange={(e) => setEditData({...editData, notes: e.target.value})}
              />
            </div>
            {type === 'expense' && (
              <div>
                <Label>Vendor</Label>
                <Input
                  value={editData.vendor || ''}
                  onChange={(e) => setEditData({...editData, vendor: e.target.value})}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEdit(false)}
              style={{
                backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                color: profile?.darkMode ? '#ffffff' : '#111827'
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFullUpdate}
              className="bg-[#22A699] hover:bg-[#1d8d82] text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Confirmation */}
      <Dialog open={showConvertConfirm} onOpenChange={setShowConvertConfirm}>
        <DialogContent style={{
          backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff',
          border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}`
        }}>
          <DialogHeader>
            <DialogTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
              Convert to {type === 'income' ? 'Expense' : 'Income'}?
            </DialogTitle>
          </DialogHeader>
          <p style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>
            This will convert this {type} of {formatCurrency(item.amount)} to an {type === 'income' ? 'expense' : 'income'}.
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConvertConfirm(false)}
              style={{
                backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                color: profile?.darkMode ? '#ffffff' : '#111827'
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConvert}
              className="bg-[#22A699] hover:bg-[#1d8d82] text-white"
            >
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}