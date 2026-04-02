
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const apiKey = process.env.VITE_GEMINI_API_KEY || "AIzaSyA8-Y8SEAFGBV7w-kz59-hMfII0qf6gfuA";
    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const models = await ai.models.list();
        console.log("Available Models:");
        models.forEach(m => console.log(m.name, m.supportedMethods));
    } catch (e) {
        console.error("Failed to list models:", e);
    }
}

listModels();
