import { GoogleGenAI, Type } from "@google/genai";
import { Message, User } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateChatSuggestions(
  messages: Message[],
  currentUser: User,
  otherUser: User,
  personalityMode: string = 'friendly'
) {
  const model = "gemini-3-flash-preview";
  
  const conversationContext = messages
    .slice(-20)
    .map(m => `${m.senderId === currentUser.id ? 'Me' : otherUser.name}: ${m.text}`)
    .join('\n');

  const systemInstruction = `
    You are an AI assistant that mimics the user's personality.
    User Name: ${currentUser.name}
    Personality Mode: ${personalityMode}
    
    Task: Generate 3 short, human-like chat reply suggestions based on the conversation history.
    Style Guidelines:
    - Match the user's tone (informal, professional, etc.)
    - Use a mix of Hindi and English if the history shows it.
    - Keep replies concise and natural.
    - Do not sound like a robot.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Conversation history:\n${conversationContext}\n\nGenerate 3 suggestions for my next reply.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The suggested reply text" }
            },
            required: ["text"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}
