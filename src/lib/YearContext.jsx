import React, { createContext, useContext, useState, useEffect } from 'react';

const YearContext = createContext();

export function YearProvider({ children }) {
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('selectedYear');
    return saved || new Date().getFullYear().toString();
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = localStorage.getItem('selectedMonth');
    return saved || 'all';
  });

  useEffect(() => {
    localStorage.setItem('selectedYear', selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    localStorage.setItem('selectedMonth', selectedMonth);
  }, [selectedMonth]);

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear, selectedMonth, setSelectedMonth }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  const context = useContext(YearContext);
  if (!context) {
    throw new Error('useYear must be used within YearProvider');
  }
  return context;
}