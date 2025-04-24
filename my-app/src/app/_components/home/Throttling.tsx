"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

export const Throttling = () => {
  const [inputText, setInputText] = useState("");
  const [throttledText, setThrottledText] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const lastExecuted = useRef<number>(0);

  // Throttling effect
  useEffect(() => {
    const now = Date.now();
    if (now - lastExecuted.current >= 2000) {
      // Update throttledText if 500ms have passed
      setThrottledText(inputText);
      lastExecuted.current = now;
    } else {
      // Schedule an update for the remaining time
      const remainingTime = 2000 - (now - lastExecuted.current);
      const handler = setTimeout(() => {
        setThrottledText(inputText);
        lastExecuted.current = Date.now();
      }, remainingTime);

      // Cleanup timeout on input change or unmount
      return () => clearTimeout(handler);
    }
  }, [inputText]);

  // Update search history when throttled text changes
  useEffect(() => {
    if (throttledText) {
      setSearchHistory([...searchHistory, throttledText]);
    }
  }, [throttledText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
