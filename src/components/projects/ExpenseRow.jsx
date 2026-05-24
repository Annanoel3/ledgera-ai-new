import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ExpenseRow({
  item,
  onDelete,
  onDuplicate,
  onProjectChange,
  onMakeRecurring,
  darkMode,
  allProjects,
  isDeleteLoading,
  isDuplicateLoading,
  isRecurringLoading,
  isMobile,
  isSelected,
  onToggleSelect,
  showCheckbox,
}) {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  if (isMobile) {
    return (
      <div
        className="border-b"
        style={{ borderColor: darkMode ? "#374151" : "#e5e7eb" }}
      >
        <div
          className="p-4 flex items-center justify-between gap-3"
          onClick={() => setExpanded(!expanded)}
          style={{
            backgroundColor: expanded
              ? darkMode
                ? "#2d3748"
                : "#f0f9ff"
              : "transparent",
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {showCheckbox && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4"
                />
              )}
              <div className="min-w-0">
                <p style={{ color: darkMode ? "#d1d5db" : "#111827" }} className="text-sm">
                  {format(new Date(item.date), "MMM d, yyyy")}
                </p>
                <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }} className="text-xs">
                  {item.vendor || item.category}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-red-500 whitespace-nowrap">
              {formatCurrency(item.amount)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-0 w-6 h-6"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" style={{ color: "#22A699" }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: "#22A699" }} />
              )}
            </Button>
          </div>
        </div>

        {expanded && (
          <div
            className="p-4 space-y-3 border-t"
            style={{
              backgroundColor: darkMode ? "#1f2937" : "#f9fafb",
              borderColor: darkMode ? "#374151" : "#e5e7eb",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {item.notes && (
              <div>
                <p
                  style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                  className="text-xs mb-1"
                >
                  Notes
                </p>
                <p
                  style={{ color: darkMode ? "#d1d5db" : "#111827" }}
                  className="text-sm"
                >
                  {item.notes}
                </p>
              </div>
            )}

            <div>
              <p
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                className="text-xs mb-1"
              >
                Project
              </p>
              <Select
                value={item.projectId}
                onValueChange={(newProjectId) =>
                  onProjectChange(item.id, newProjectId)
                }
              >
                <SelectTrigger
                  className="w-full"
                  style={{
                    backgroundColor: darkMode ? "#374151" : "#ffffff",
                    border: `1px solid ${darkMode ? "#4b5563" : "#e5e7eb"}`,
                    color: darkMode ? "#ffffff" : "#111827",
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: darkMode ? "#374151" : "#ffffff",
                    border: `1px solid ${darkMode ? "#4b5563" : "#e5e7eb"}`,
                  }}
                >
                  {allProjects.map((proj) => (
                    <SelectItem
                      key={proj.id}
                      value={proj.id}
                      style={{ color: darkMode ? "#ffffff" : "#111827" }}
                    >
                      {proj.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onMakeRecurring(item)}
                disabled={isRecurringLoading}
                style={{ backgroundColor: "#22A699" }}
                className="flex-1 text-sm h-8"
              >
                {isRecurringLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Make Recurring"
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(item)}
                disabled={isDuplicateLoading}
                className="hover:text-[#22A699] h-8"
                title="Duplicate"
              >
                {isDuplicateLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => onDelete(e, item.id)}
                disabled={isDeleteLoading}
                className="hover:text-red-500 h-8"
              >
                {isDeleteLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop view
  return (
    <tr style={{ borderColor: darkMode ? "#374151" : "#e5e7eb" }}>
      {showCheckbox && (
        <td className="p-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            className="w-4 h-4"
          />
        </td>
      )}
      <td style={{ color: darkMode ? "#d1d5db" : "#111827" }}>
        {format(new Date(item.date), "MMM d, yyyy")}
      </td>
      <td style={{ color: darkMode ? "#d1d5db" : "#111827" }}>
        {item.category}
      </td>
      <td style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
        {item.vendor || "-"}
      </td>
      <td className="font-medium text-red-500">
        ${item.amount.toFixed(2)}
      </td>
      <td style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
        {item.notes || "-"}
      </td>
      <td>
        <Select
          value={item.projectId}
          onValueChange={(newProjectId) =>
            onProjectChange(item.id, newProjectId)
          }
        >
          <SelectTrigger
            className="w-40"
            style={{
              backgroundColor: darkMode ? "#374151" : "#ffffff",
              border: `1px solid ${darkMode ? "#4b5563" : "#e5e7eb"}`,
              color: darkMode ? "#ffffff" : "#111827",
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            style={{
              backgroundColor: darkMode ? "#374151" : "#ffffff",
              border: `1px solid ${darkMode ? "#4b5563" : "#e5e7eb"}`,
            }}
          >
            {allProjects.map((proj) => (
              <SelectItem
                key={proj.id}
                value={proj.id}
                style={{ color: darkMode ? "#ffffff" : "#111827" }}
              >
                {proj.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td>
        <div className="flex gap-1">
          <Button
            onClick={() => onMakeRecurring(item)}
            disabled={isRecurringLoading}
            style={{ backgroundColor: "#22A699", color: "white" }}
            className="text-xs h-8"
          >
            {isRecurringLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "Make Recurring"
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDuplicate(item)}
            disabled={isDuplicateLoading}
            className="hover:text-[#22A699]"
            title="Duplicate"
          >
            {isDuplicateLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => onDelete(e, item.id)}
            disabled={isDeleteLoading}
            className="hover:text-red-500"
          >
            {isDeleteLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
}