import React from "react";
import { format } from "date-fns";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DayTransactionsModal({ date, incomeItems, expenseItems, projects, profile, onClose, onAddEvent }) {
  const dark = profile?.darkMode;
  const cardBg = dark ? "#1f2937" : "#ffffff";
  const border = dark ? "#374151" : "#e5e7eb";
  const textPrimary = dark ? "#ffffff" : "#111827";
  const textMuted = dark ? "#9ca3af" : "#6b7280";

  const dateStr = format(date, "yyyy-MM-dd");

  const dayIncome = incomeItems.filter(i => i.date?.split("T")[0] === dateStr);
  const dayExpenses = expenseItems.filter(i => i.date?.split("T")[0] === dateStr);

  const totalIncome = dayIncome.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenses = dayExpenses.reduce((s, i) => s + (i.amount || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(profile?.locale || 'en-US', {
      style: 'currency',
      currency: profile?.currency || 'USD'
    }).format(amount);
  };

  const getProjectName = (projectId) => {
    return projects?.find(p => p.id === projectId)?.title || "Unknown Project";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div
        className="rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
        style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
          <div>
            <h2 className="font-semibold text-lg" style={{ color: textPrimary }}>
              {format(date, "EEEE, MMMM d")}
            </h2>
            <p className="text-sm" style={{ color: textMuted }}>
              {dayIncome.length + dayExpenses.length} transaction{dayIncome.length + dayExpenses.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ color: textMuted }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary row */}
        {(dayIncome.length > 0 || dayExpenses.length > 0) && (
          <div className="grid grid-cols-2 gap-3 px-5 py-3 border-b" style={{ borderColor: border }}>
            <div className="rounded-lg p-2.5" style={{ backgroundColor: dark ? "rgba(34,197,94,0.1)" : "#f0fdf4" }}>
              <p className="text-xs font-medium text-green-600">Total Income</p>
              <p className="text-base font-bold text-green-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="rounded-lg p-2.5" style={{ backgroundColor: dark ? "rgba(239,68,68,0.1)" : "#fff1f2" }}>
              <p className="text-xs font-medium text-red-500">Total Expenses</p>
              <p className="text-base font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        )}

        {/* Scrollable list */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {dayIncome.length === 0 && dayExpenses.length === 0 && (
            <p className="text-center py-6 text-sm" style={{ color: textMuted }}>No transactions on this day.</p>
          )}

          {dayIncome.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: border, backgroundColor: dark ? "#111827" : "#f9fafb" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(34,197,94,0.15)" }}>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: textPrimary }}>
                  {item.notes || item.category || "Income"}
                </p>
                <p className="text-xs truncate" style={{ color: textMuted }}>
                  {getProjectName(item.projectId)} · {item.category}
                </p>
              </div>
              <span className="text-sm font-semibold text-green-500 flex-shrink-0">+{formatCurrency(item.amount)}</span>
            </div>
          ))}

          {dayExpenses.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: border, backgroundColor: dark ? "#111827" : "#f9fafb" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(239,68,68,0.15)" }}>
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: textPrimary }}>
                  {item.vendor || item.notes || item.category || "Expense"}
                </p>
                <p className="text-xs truncate" style={{ color: textMuted }}>
                  {getProjectName(item.projectId)} · {item.category}
                </p>
              </div>
              <span className="text-sm font-semibold text-red-500 flex-shrink-0">-{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t" style={{ borderColor: border }}>
          <Button
            className="w-full"
            style={{ backgroundColor: "#22A699", color: "#ffffff" }}
            onClick={onAddEvent}
          >
            Add Event on This Day
          </Button>
        </div>
      </div>
    </div>
  );
}