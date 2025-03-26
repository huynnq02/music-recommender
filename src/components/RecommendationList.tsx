import React from "react";

interface Recommendation {
  name: string;
  artist: string;
  reason: string;
  youtubeUrl: string;
}

interface RecommendationListProps {
  recommendations: Recommendation[];
  searchTerm: string;
}

export default function RecommendationList({
  recommendations,
  searchTerm,
}: RecommendationListProps) {
  if (recommendations.length === 0) {
    return null;
  }

  // Function to ensure YouTube URL is properly formatted
  const getYouTubeUrl = (url: string, songName: string, artist: string) => {
    if (!url || url === "https://youtube.com/watch?v=") {
      // If URL is invalid or empty, create a search URL instead
      const searchQuery = encodeURIComponent(
        `${songName} ${artist} official music video`
      );
      return `https://www.youtube.com/results?search_query=${searchQuery}`;
    }
    // If it's already a full YouTube URL, return it
    if (
      url.startsWith("https://www.youtube.com/") ||
      url.startsWith("https://youtu.be/")
    ) {
      return url;
    }
    // If it's just a video ID, construct the full URL
    return `https://www.youtube.com/watch?v=${url}`;
  };

  // Function to check if input is a YouTube URL
  const isYouTubeUrl = (input: string): boolean => {
    return input.includes("youtube.com/") || input.includes("youtu.be/");
  };

  // Get the first recommendation's name and artist if search term is a URL
  const getSearchDisplay = () => {
    if (isYouTubeUrl(searchTerm) && recommendations.length > 0) {
      const firstRec = recommendations[0];
      return `"${firstRec.name}" by ${firstRec.artist}`;
    }
    return `"${searchTerm}"`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 text-blue-800">
          Recommended Songs
        </h2>
        <p className="text-base text-gray-600">
          Based on your search:{" "}
          <span className="font-medium text-blue-700">
            {getSearchDisplay()}
          </span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-200 hover:border-gray-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-black transition-colors duration-200 truncate">
                  {rec.name}
                </h3>
                <p className="text-gray-600 truncate">{rec.artist}</p>
              </div>
              <a
                href={getYouTubeUrl(rec.youtubeUrl, rec.name, rec.artist)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-[#FF0000] hover:text-[#FF0000]/90 transition-colors duration-200 transform hover:scale-110"
                title="Watch on YouTube"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <p className="relative text-gray-700 italic text-sm line-clamp-2 group-hover:text-gray-900 transition-colors duration-200">
                "{rec.reason}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
