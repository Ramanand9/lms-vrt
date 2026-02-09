
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  // Always use process.env.API_KEY directly for initializing GoogleGenAI
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const summarizeLesson = async (lessonTitle: string, notes: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize the following lesson notes for an entrepreneur. 
      Focus on actionable takeaways and key definitions.
      Lesson: ${lessonTitle}
      Notes: ${notes}`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Summarization failed", error);
    return "Failed to generate summary.";
  }
};

export const generateFeedback = async (studentName: string, worksheetTitle: string, submissionText: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide constructive, encouraging feedback for a student named ${studentName} who submitted their worksheet: ${worksheetTitle}. 
      Submission Content: ${submissionText}. 
      Give 3 pros and 1 area for improvement.`,
    });
    return response.text;
  } catch (error) {
    return "AI was unable to generate feedback at this time.";
  }
};

export const getAIChatResponse = async (history: { role: 'user' | 'model', text: string }[], userInput: string) => {
  try {
    const ai = getAI();
    const contents = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));
    
    contents.push({
      role: 'user',
      parts: [{ text: userInput }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: "You are the VRT Growth Assistant, an elite AI advisor for the Entrepreneur Growth Alliance (EGA). Your tone is professional, encouraging, and strategic. You help students understand business scaling, leadership, and how to use the VRT platform. Keep responses concise and high-impact.",
        temperature: 0.8,
        topK: 40,
        topP: 0.9,
      },
    });

    return response.text;
  } catch (error) {
    console.error("AI Chat failed", error);
    return "I'm currently recalibrating my strategic processors. Please try again in a moment.";
  }
};

export const getDiscoverySuggestions = async (lessonTitle: string, notes: string, availableVRTThemes: string[]) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following entrepreneurship lesson and suggest related growth resources.
      
      Lesson Title: ${lessonTitle}
      Lesson Notes: ${notes}
      
      Available Internal Course Themes: ${availableVRTThemes.join(', ')}
      
      Provide:
      1. 2 high-level external resources (books, frameworks, or industry standards).
      2. 1 internal theme from the provided list that best complements this lesson.
      3. A brief strategic rationale for each.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            externalResources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'e.g., Book, Framework, Article' }
                },
                required: ["title", "description", "type"]
              }
            },
            internalRecommendation: {
              type: Type.OBJECT,
              properties: {
                theme: { type: Type.STRING },
                rationale: { type: Type.STRING }
              },
              required: ["theme", "rationale"]
            }
          },
          required: ["externalResources", "internalRecommendation"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Discovery suggestions failed", error);
    return null;
  }
};
