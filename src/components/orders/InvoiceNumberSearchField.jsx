"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function InvoiceNumberSearchField({
  name,
  label,
  value,
  onChange,
  required = false,
  placeholder = "Search or type invoice number",
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  const fetchSuggestions = useCallback(async (q) => {
    const term = String(q || "").trim();
    if (term.length < 1) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/invoice-list?search=${encodeURIComponent(term)}&limit=12`,
        { credentials: "include" },
      );
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      const numbers = list
        .map((row) => String(row.invoice_number || "").trim())
        .filter(Boolean);
      setSuggestions([...new Set(numbers)]);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onInputChange = (e) => {
    const next = e.target.value;
    onChange(next);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(next);
    }, 280);
  };

  const pickSuggestion = (num) => {
    onChange(num);
    setOpen(false);
    setSuggestions([]);
  };

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        required={required}
        onChange={onInputChange}
        onFocus={() => {
          setOpen(true);
          if (String(value || "").trim()) fetchSuggestions(value);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {open && (loading || suggestions.length > 0) && (
        <ul
          className="absolute z-30 mt-1 w-full max-h-48 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg text-sm"
          role="listbox"
        >
          {loading ? (
            <li className="px-3 py-2 text-gray-500">Searching…</li>
          ) : (
            suggestions.map((num) => (
              <li key={num}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 text-gray-800"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickSuggestion(num)}
                >
                  {num}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
