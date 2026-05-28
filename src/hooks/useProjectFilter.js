import { useState } from "react";

/**
 * Persists year/month filter selection per project in localStorage.
 * Key: `project_filter_<projectId>`
 */
export function useProjectFilter(projectId) {
  const storageKey = `project_filter_${projectId}`;

  const getInitialState = () => {
    if (!projectId) return { year: new Date().getFullYear().toString(), month: new Date().getMonth().toString() };
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return { year: new Date().getFullYear().toString(), month: new Date().getMonth().toString() };
  };

  const [filter, setFilter] = useState(getInitialState);

  const setYear = (year) => {
    const next = { ...filter, year };
    setFilter(next);
    if (projectId) localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const setMonth = (month) => {
    const next = { ...filter, month };
    setFilter(next);
    if (projectId) localStorage.setItem(storageKey, JSON.stringify(next));
  };

  return { selectedYear: filter.year, selectedMonth: filter.month, setSelectedYear: setYear, setSelectedMonth: setMonth };
}