import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Check, ChevronDown } from 'lucide-react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

/**
 * Drop-in Select replacement that uses a bottom Drawer on mobile.
 * Props:
 *   value, onValueChange, options: [{value, label}],
 *   placeholder, triggerStyle, triggerClassName, darkMode
 */
export function MobileSelect({ value, onValueChange, options = [], placeholder, triggerStyle, triggerClassName, darkMode }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const selected = options.find(o => o.value === value);

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={triggerStyle}
          className={`flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none ${triggerClassName || ''}`}
        >
          <span>{selected?.label || placeholder || 'Select...'}</span>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left border-b" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
              <DrawerTitle style={{ color: darkMode ? '#ffffff' : '#111827' }}>
                {placeholder || 'Select an option'}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-2 pb-8 pt-2 overflow-y-auto max-h-[60vh]">
              {options.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { onValueChange(option.value); setOpen(false); }}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-sm rounded-xl mb-1"
                  style={{
                    color: darkMode ? '#ffffff' : '#111827',
                    backgroundColor: value === option.value
                      ? (darkMode ? '#374151' : '#f3f4f6')
                      : 'transparent',
                  }}
                >
                  <span>{option.label}</span>
                  {value === option.value && <Check className="h-4 w-4 text-[#22A699]" />}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger style={triggerStyle} className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}