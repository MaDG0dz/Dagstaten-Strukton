"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Zoeken...",
}: SearchInputProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => onChange(local), 300);
    return () => clearTimeout(timer);
  }, [local, onChange]);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {local && (
        <button
          onClick={() => {
            setLocal("");
            onChange("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
