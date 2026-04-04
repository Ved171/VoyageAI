
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Itinerary, UserPreferences, DayPlan } from '../types';

// --- Schemas for the new two-stage generation ---
// Unified to use standard @google/generative-ai Schema format

const initialItinerarySchema = {
    type: SchemaType.OBJECT,
    properties: {
        destination: { type: SchemaType.STRING },
        duration: { type: SchemaType.NUMBER },
        tripTitle: { type: SchemaType.STRING },
        tripSummary: { type: SchemaType.STRING },
        latitude: { type: SchemaType.NUMBER },
        longitude: { type: SchemaType.NUMBER },
        packingList: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        travelCost: {
            type: SchemaType.OBJECT,
            properties: {
                mode: { type: SchemaType.STRING },
                estimatedCost: { type: SchemaType.STRING },
                costDisclaimer: { type: SchemaType.STRING },
            },
            required: ['mode', 'estimatedCost', 'costDisclaimer'],
        },
        departureInfo: {
            type: SchemaType.OBJECT,
            properties: {
                time: { type: SchemaType.STRING },
                mode: { type: SchemaType.STRING },
                location: { type: SchemaType.STRING },
            },
            required: ['time', 'mode', 'location'],
        },
        returnInfo: {
            type: SchemaType.OBJECT,
            properties: {
                time: { type: SchemaType.STRING },
                mode: { type: SchemaType.STRING },
                location: { type: SchemaType.STRING },
            },
            required: ['time', 'mode', 'location'],
        },
        destinationQuote: {
            type: SchemaType.OBJECT,
            properties: {
                quote: { type: SchemaType.STRING },
                author: { type: SchemaType.STRING },
                translation: { type: SchemaType.STRING },
            },
            required: ['quote', 'author', 'translation'],
        },
        localization: {
            type: SchemaType.OBJECT,
            properties: {
                targetLanguage: { type: SchemaType.STRING },
                translatedStrings: {
                    type: SchemaType.OBJECT,
                    properties: {
                        aboutUs: { type: SchemaType.STRING },
                    },
                    required: ['aboutUs'],
                },
            },
            required: ['targetLanguage', 'translatedStrings'],
        },
    },
    required: [
        'destination', 'duration', 'tripTitle', 'tripSummary',
        'latitude', 'longitude',
        'packingList', 'travelCost', 'departureInfo', 'returnInfo', 'destinationQuote', 'localization'
    ],
};

const dailyPlanSchema = {
    type: SchemaType.OBJECT,
    properties: {
        day: { type: SchemaType.NUMBER },
        title: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING },
        activities: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING },
                    location: { type: SchemaType.STRING },
                    latitude: { type: SchemaType.NUMBER },
                    longitude: { type: SchemaType.NUMBER },
                    time: { type: SchemaType.STRING },
                    activityType: { type: SchemaType.STRING },
                },
                required: ['name', 'description', 'location', 'latitude', 'longitude', 'time', 'activityType'],
            },
        },
    },
    required: ['day', 'title', 'summary', 'activities'],
};

const allDailyPlansSchema = {
    type: SchemaType.OBJECT,
    properties: {
        dailyPlans: {
            type: SchemaType.ARRAY,
            items: dailyPlanSchema
        }
    },
    required: ['dailyPlans']
};


async function callAI<T>(prompt: string, schema: any): Promise<T> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("API Key is missing. Please check your environment configuration.");
    }

    // Masked log for debugging
    const maskedKey = `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`;
    console.log(`[GeminiService] Initializing call with key: ${maskedKey}`);

    const genAI = new GoogleGenerativeAI(apiKey);

    // Using the canonical SDK with the highly compatible 1.5-flash model
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        if (!rawText) {
            throw new Error("AI returned an empty response. Please try again.");
        }

        // Robust JSON extraction to handle any potential pre/post text
        const firstIndex = rawText.indexOf('{');
        const lastIndex = rawText.lastIndexOf('}');

        if (firstIndex === -1 || lastIndex === -1) {
            throw new Error("Invalid response format from AI. Please try again.");
        }

        const jsonText = rawText.substring(firstIndex, lastIndex + 1);
        return JSON.parse(jsonText) as T;
    } catch (error: any) {
        console.error("AI call failed:", error);
        if (error instanceof Error) {
            if (error.message.includes('JSON')) {
                throw new Error("The AI returned an invalid data format. Please try again.");
            }
            if (error.message.includes('quota')) {
                throw new Error("API quota exceeded. Please try again in a moment.");
            }
            throw new Error(error.message);
        }
        throw new Error("An unexpected error occurred during travel planning.");
    }
}

export async function* generateItinerary(preferences: UserPreferences): AsyncGenerator<Partial<Itinerary>> {
    const { origin, destination, duration, interests, budget, preferredTransport } = preferences;

    // --- SERVICE-LEVEL VALIDATION ---
    if (!origin || !origin.trim()) {
        throw new Error("Validation Error: Departure Point (Origin) is required.");
    }
    if (!destination || !destination.trim()) {
        throw new Error("Validation Error: Destination is required.");
    }

    // --- STAGE 1: Metadata ---
    const transportInfo = preferredTransport ? `Preferred Transport: ${preferredTransport}` : 'Select the most logical transport mode.';
    const initialPrompt = `
        You are an expert travel planner. Create the core metadata for a trip to ${destination}.
        Origin: ${origin}
        Duration: ${duration} days
        Interests: ${interests.join(', ')}
        Budget: ${budget} (strictly respect this budget level)
        ${transportInfo}
        
        Provide a realistic estimated total cost for the trip in the local currency of ${origin}. Include the currency symbol and code (e.g., INR, EUR, GBP).
        Provide a breakdown of the cost if possible.

        Crucially, provide details for getting from ${origin} to ${destination}:
        1. "departureInfo": Specific time (e.g. 08:30 AM), mode (e.g. Driving or Flight AI-302), and location (e.g. ${origin} City Center or ${origin} International).
        2. "returnInfo": Specific time (e.g. 09:45 PM), mode (e.g. Driving or Express Train), and location (e.g. ${destination} City Center).

        CRITICAL: Consider the realistic distance and travel time between ${origin} and ${destination} using ${transportInfo}.
        If the distance is long (e.g. over 500km) and mode is 'car', specify a very early departure time (e.g. 5:00 AM) and remind the daily plans to account for a full day of travel.
        
        Provide only the initial metadata based on the specified JSON schema.
    `;

    const initialData = await callAI<Omit<Itinerary, 'dailyPlans'>>(initialPrompt, initialItinerarySchema);
    let fullItinerary: Partial<Itinerary> = { ...initialData, dailyPlans: [] };
    yield { ...fullItinerary };

    // --- STAGE 2: Daily activities (Processed in batches to avoid API rate limits) ---
    const dayIndices = Array.from({ length: duration }, (_, i) => i + 1);
    const completedDays: DayPlan[] = [];
    const BATCH_SIZE = 4; // Process days in manageable groups

    for (let i = 0; i < dayIndices.length; i += BATCH_SIZE) {
        const batch = dayIndices.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(dayNum => {
            let additionalContext = '';
            if (dayNum === 1) {
                additionalContext = `
                    Note: This is the first day. The traveler is starting from ${origin} and arriving at ${destination}.
                    Departure Detail: Leaving ${origin} at ${initialData.departureInfo.time} via ${initialData.departureInfo.mode}.
                    CRITICAL: You MUST consider the travel time from ${origin} to ${destination} using ${initialData.travelCost.mode}.
                    If travel takes more than 2-3 hours, include "Travel and Arrival" as the first activity of the day with a realistic duration.
                    Do NOT schedule sightseeing activities before the traveler realistically arrives at the destination.
                    If travel takes many hours (e.g. driving 10+ hours), Day 1 should mostly be the travel activity and maybe just a dinner at the destination.
                `;
            } else if (dayNum === duration) {
                additionalContext = `
                    Note: This is the last day. The traveler is returning from ${destination} to ${origin}.
                    Return Detail: Leaving ${destination} at ${initialData.returnInfo.time} via ${initialData.returnInfo.mode}.
                    CRITICAL: All activities MUST end before the return departure time.
                `;
            }

            const dayPrompt = `
                Provide a detailed daily itinerary for Day ${dayNum} of the trip to ${destination} titled "${initialData.tripTitle}".
                Origin: ${origin}
                Interests: ${interests.join(', ')}
                Budget: ${budget}
                Primary Transport: ${initialData.travelCost.mode}
                
                ${additionalContext}

                This is Day ${dayNum} of a ${duration}-day trip.
                Ensure context matches previous days if possible (stay consistent with the location).
                Provide only the daily plan for this specific day based on the specified JSON schema.
            `;
            return callAI<DayPlan>(dayPrompt, dailyPlanSchema);
        });

        const batchResults = await Promise.all(batchPromises);
        completedDays.push(...batchResults);
        fullItinerary.dailyPlans = [...completedDays].sort((a, b) => a.day - b.day);
        yield { ...fullItinerary };
    }

    fullItinerary.isComplete = true;
    yield { ...fullItinerary };
}
