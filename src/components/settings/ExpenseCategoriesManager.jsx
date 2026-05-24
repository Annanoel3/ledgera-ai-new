import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Tag } from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_CATEGORIES = [
  "software", "travel", "supplies", "meals", "utilities",
  "marketing", "equipment", "professional services", "subscriptions", "other"
];

export default function ExpenseCategoriesManager({ profile, onSave }) {
  const existing = profile?.customExpenseCategories ?? null;
  const initial = existing !== null ? existing : DEFAULT_CATEGORIES;
  const [categories, setCategories] = useState(initial);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const dark = profile?.darkMode;
  const cardStyle = {
    backgroundColor: dark ? "#1f2937" : "#ffffff",
    border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
  };
  const labelColor = { color: dark ? "#d1d5db" : "#374151" };
  const mutedColor = { color: dark ? "#9ca3af" : "#6b7280" };
  const inputStyle = {
    backgroundColor: dark ? "#374151" : "#ffffff",
    border: `1px solid ${dark ? "#4b5563" : "#e5e7eb"}`,
    color: dark ? "#ffffff" : "#111827",
  };
  const badgeStyle = {
    backgroundColor: dark ? "#374151" : "#f3f4f6",
    border: `1px solid ${dark ? "#4b5563" : "#e5e7eb"}`,
    color: dark ? "#d1d5db" : "#374151",
  };

  const handleAdd = () => {
    const val = newCategory.trim().toLowerCase();
    if (!val) return;
    if (categories.includes(val)) {
      toast.error("Category already exists");
      return;
    }
    setCategories([...categories, val]);
    setNewCategory("");
  };

  const handleRemove = (cat) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(categories);
      toast.success("Categories saved!");
    } catch {
      toast.error("Failed to save categories");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCategories(DEFAULT_CATEGORIES);
  };

  return (
    <Card style={cardStyle}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: dark ? "#ffffff" : "#111827" }}>
          <Tag className="w-5 h-5 text-[#22A699]" />
          Expense Categories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm" style={mutedColor}>
          Customize the categories used when logging expenses. These will appear in your reports and filters.
        </p>

        {/* Add new */}
        <div className="flex gap-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g., freelance tools, co-working..."
            style={inputStyle}
          />
          <Button onClick={handleAdd} className="bg-[#22A699] hover:bg-[#1d8d82] text-white">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Categories list */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge key={cat} variant="secondary" className="gap-2 capitalize" style={badgeStyle}>
              {cat}
              <button onClick={() => handleRemove(cat)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {categories.length === 0 && (
            <p className="text-sm" style={mutedColor}>No categories. Add some above.</p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#22A699] hover:bg-[#1d8d82] text-white"
          >
            {saving ? "Saving..." : "Save Categories"}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            style={{ backgroundColor: dark ? "#374151" : "#ffffff", border: `1px solid ${dark ? "#4b5563" : "#e5e7eb"}`, color: dark ? "#d1d5db" : "#374151" }}
          >
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}