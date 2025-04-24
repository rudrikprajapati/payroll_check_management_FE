"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

export const Debouncing = () => {
  const [inputText, setInputText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Debouncing effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(inputText);
    }, 500);

    // Cleanup timeout on input change or component unmount
    return () => {
      clearTimeout(handler);
    };
  }, [inputText]);

  // Update search history when debounced text changes
  useEffect(() => {
    if (debouncedText) {
      setSearchHistory([...searchHistory, debouncedText]);
    }
  }, [debouncedText]);

  const handleInputChange = (e: any) => {
    setInputText(e.target.value);
  };
  return (
    <div className="flex flex-col items-center mt-8 max-w-md mx-auto">
      <Input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        placeholder="Search something..."
        className="p-2 border rounded-md shadow-sm"
      />
      <div className="mt-4 w-full">
        {searchHistory.length > 0 ? (
          <ul className="space-y-2">
            {searchHistory.map((term, index) => (
              <li key={index} className="text-gray-700 border-b pb-1">
                {term}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No search history yet...</p>
        )}
      </div>
    </div>
  );
};
