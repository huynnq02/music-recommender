"use client";

import { useState } from "react";

interface MusicSearchProps {
  onSearch: (input: string) => void;
  isLoading?: boolean;
}

export default function MusicSearch({
  onSearch,
  isLoading = false,
}: MusicSearchProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a song name or YouTube URL"
            className="w-full pl-12 pr-6 py-4 text-lg text-black rounded-xl border-2 border-gray-200 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-200 bg-white group-hover:border-gray-300 placeholder-gray-400"
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`px-8 py-4 bg-black text-white text-lg font-semibold rounded-xl 
            transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 transform
            ${
              isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-90 hover:bg-gray-900"
            }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Searching...</span>
            </div>
          ) : (
            "Get Recommendations"
          )}
        </button>
      </div>
    </form>
  );
}
