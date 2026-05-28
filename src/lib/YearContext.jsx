import React, { createContext, useContext, useState, useEffect } from 'react';

const YearContext = createContext();

export function YearProvider({ children }) {
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('selectedYear');
    return saved || new Date().getFullYear().toString();
  });

  useEffect(() => {
    localStorage.setItem('selectedYear', selectedYear);
  }, [selectedYear]);

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear }}>
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