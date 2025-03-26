import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

interface Recommendation {
  name: string;
  artist: string;
  reason: string;
  youtubeUrl: string;
}

interface ApiResponse {
  recommendations: Recommendation[];
}

interface ValidationResponse {
  isValid: boolean;
  songName?: string;
  artist?: string;
  reason?: string;
}

// Initialize the Gemini API with proper configuration
const ai = new GoogleGenAI({
  apiKey: "AIzaSyDeQeddlvvvriSXBSyCfXdm1PfHH4sVCVI",
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function cleanJsonResponse(text: string): string {
  // Remove markdown code block formatting if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  return text.trim();
}

// Function to extract video ID from YouTube URL
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^?\s]+)/,
    /youtube\.com\/v\/([^?\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Function to validate YouTube URL
async function validateYouTubeUrl(url: string): Promise<boolean> {
  try {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return false;

    // Use YouTube's oEmbed endpoint to check if video exists
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    return response.ok;
  } catch (error) {
    console.error("YouTube validation error:", error);
    return false;
  }
}

// Function to search for a song on YouTube
async function searchYouTube(
  songName: string,
  artist: string
): Promise<string> {
  try {
    const searchQuery = `${songName} ${artist} official music video`;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Find the most likely YouTube URL for the song "${songName}" by "${artist}". 
      Return ONLY the URL, no other text. Prefer official music videos or official audio uploads.
      If you can't find an exact match, return a placeholder: "https://youtube.com/watch?v="`,
    });

    if (!response.text) {
      return "https://youtube.com/watch?v=";
    }

    const url = response.text.trim();
    const isValid = await validateYouTubeUrl(url);
    return isValid ? url : "https://youtube.com/watch?v=";
  } catch (error) {
    console.error("YouTube search error:", error);
    return "https://youtube.com/watch?v=";
  }
}

async function validateSong(input: string): Promise<ValidationResponse> {
  const validationPrompt = `You are a music expert. Verify if the following input refers to a real song: "${input}"
  
  Return a JSON object with the following structure:
  {
    "isValid": boolean,
    "songName": "actual song name if found, or null if not found",
    "artist": "artist name if found, or null if not found",
    "reason": "brief explanation of why it's valid or invalid"
  }

  If it's a YouTube URL, try to identify the song from the URL.
  If it's an incomplete or partial song name, try to identify the most likely match.
  If there are typos or misspellings, mark it as invalid and provide the correct song name.
  Return isValid: false if:
  - The song name has obvious typos
  - The song name is incomplete
  - You're not confident this is a real song
  - The song name is misspelled`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: validationPrompt,
    });

    if (!response.text) {
      throw new Error("No validation response received");
    }

    const cleanedText = cleanJsonResponse(response.text);
    const validation = JSON.parse(cleanedText) as ValidationResponse;

    // Additional validation for obvious typos
    if (validation.isValid) {
      const normalizedInput = input.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalizedSongName = (validation.songName || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      // If the normalized versions are significantly different, mark as invalid
      if (
        normalizedInput !== normalizedSongName &&
        Math.abs(normalizedInput.length - normalizedSongName.length) <= 2
      ) {
        validation.isValid = false;
        validation.reason = "Song name appears to have typos";
      }
    }

    return validation;
  } catch (error) {
    console.error("Song validation error:", error);
    throw new Error(`Failed to validate song: ${getErrorMessage(error)}`);
  }
}

// Function to generate search suggestions
async function generateSearchSuggestions(input: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Given the input "${input}", generate 3 possible song suggestions that the user might have meant to search for.
      Consider:
      1. Common typos and misspellings
      2. Similar sounding names
      3. Popular songs that match the partial input
      4. Songs with similar words or phrases
      
      Return ONLY a JSON array of strings, no other text. Example: ["Song Name 1", "Song Name 2", "Song Name 3"]
      Make sure to include the most likely correct version of the song name.`,
    });

    if (!response.text) {
      return [];
    }

    const cleanedText = cleanJsonResponse(response.text);
    const suggestions = JSON.parse(cleanedText) as string[];
    return suggestions.filter((s) => s && typeof s === "string");
  } catch (error) {
    console.error("Suggestion generation error:", error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const { input } = await request.json();

    if (!input || input.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter a song name or YouTube URL" },
        { status: 400 }
      );
    }

    try {
      const validation = await validateSong(input);
      console.log("Song validation result:", validation);

      if (!validation.isValid) {
        // Generate suggestions when the song is invalid
        const suggestions = await generateSearchSuggestions(input);

        return NextResponse.json(
          {
            error: `Invalid song: ${
              validation.reason || "Could not verify this as a real song"
            }`,
            suggestion: validation.songName
              ? `Did you mean "${validation.songName}" by ${validation.artist}?`
              : null,
            suggestions: suggestions,
          },
          { status: 400 }
        );
      }

      const validatedInput =
        validation.songName && validation.artist
          ? `${validation.songName} by ${validation.artist}`
          : input;

      const prompt = `You are a music recommendation expert. Based on the verified song "${validatedInput}", recommend 5 similar songs that users might enjoy.
      Consider factors like genre, style, mood, and era.
      
      For each recommendation, provide:
      1. Song name
      2. Artist name
      3. A brief explanation of why it's similar (max 100 characters)
      
      Return ONLY the JSON object without any markdown formatting or additional text. The response should look exactly like this:
      {
        "recommendations": [
          {
            "name": "Song Name",
            "artist": "Artist Name",
            "reason": "Brief reason for recommendation"
          }
        ]
      }
      
      Ensure the response is valid JSON and includes exactly 5 recommendations.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      if (!response.text) {
        throw new Error("No response received from AI model");
      }

      const rawText = response.text;
      console.log("Raw AI response:", rawText);

      const cleanedText = cleanJsonResponse(rawText);
      console.log("Cleaned response:", cleanedText);

      try {
        const data = JSON.parse(cleanedText) as ApiResponse;

        if (!data.recommendations || !Array.isArray(data.recommendations)) {
          console.error("Invalid response structure:", data);
          throw new Error(
            "Invalid response format: Missing recommendations array"
          );
        }

        if (data.recommendations.length === 0) {
          throw new Error("No recommendations received");
        }

        // Process recommendations and validate/search YouTube URLs in parallel
        const processedRecommendations = await Promise.all(
          data.recommendations.map(
            async (rec: Partial<Recommendation>, index) => {
              if (!rec.name || !rec.artist) {
                console.error(`Invalid recommendation at index ${index}:`, rec);
              }

              // Search for YouTube URL for each song
              const youtubeUrl = await searchYouTube(
                rec.name || "Unknown Song",
                rec.artist || "Unknown Artist"
              );

              return {
                name: rec.name || "Unknown Song",
                artist: rec.artist || "Unknown Artist",
                reason: rec.reason || "Similar style and mood",
                youtubeUrl: youtubeUrl,
              };
            }
          )
        );

        return NextResponse.json({
          originalSong: {
            name: validation.songName || input,
            artist: validation.artist || "Unknown Artist",
          },
          recommendations: processedRecommendations,
        });
      } catch (parseError) {
        console.error("Parse error:", parseError);
        console.error("Raw text:", rawText);
        console.error("Cleaned text:", cleanedText);
        return NextResponse.json(
          {
            error: `Failed to process recommendations: ${getErrorMessage(
              parseError
            )}`,
          },
          { status: 500 }
        );
      }
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return NextResponse.json(
        { error: getErrorMessage(validationError) },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Request error:", error);
    return NextResponse.json(
      {
        error: `Failed to generate recommendations: ${getErrorMessage(error)}`,
      },
      { status: 500 }
    );
  }
}
