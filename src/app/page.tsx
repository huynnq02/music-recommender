"use client";

import { useState } from "react";
import MusicSearch from "@/components/MusicSearch";
import RecommendationList from "@/components/RecommendationList";

interface Recommendation {
  name: string;
  artist: string;
  reason: string;
  youtubeUrl: string;
}

export default function Home() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleSearch = async (input: string) => {
    setIsLoading(true);
    setError(null);
    setSearchTerm(input);
    setRecommendations([]);
    setSuggestions([]);
    setSuggestion(null);

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch recommendations");
        setSuggestion(data.suggestion);
        setSuggestions(data.suggestions || []);
        throw new Error(data.error || "Failed to fetch recommendations");
      }

      setRecommendations(data.recommendations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to get recommendations. Please try again."
      );
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold mb-6 text-black">
              Music Recommender
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover new music based on your favorite songs. Enter a song name
              or YouTube URL to get personalized recommendations.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
            <MusicSearch onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              <p className="text-gray-600 animate-pulse">
                Finding recommendations for "{searchTerm}"...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 mr-3 flex-shrink-0 mt-1 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-medium text-red-700">{error}</p>
                  {suggestion && (
                    <p className="mt-2 text-sm">
                      <button
                        onClick={() => handleSearch(suggestion.split('"')[1])}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {suggestion}
                      </button>
                    </p>
                  )}
                  {suggestions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-blue-600 mb-2">
                        Other suggestions:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearch(suggestion)}
                            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors duration-200"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <RecommendationList
            recommendations={recommendations}
            searchTerm={searchTerm}
          />
        </div>
      </div>
    </main>
  );
}
