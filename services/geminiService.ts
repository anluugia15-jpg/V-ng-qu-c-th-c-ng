import { GoogleGenAI, Type } from "@google/genai";
import { Entity } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize AI only if key exists to prevent immediate crash, handle checks later
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateAnimalFact = async (entity: Entity): Promise<string> => {
  if (!ai) return `Bạn cần chăm sóc ${entity.name} thật tốt nhé! (Thiếu API Key)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Hãy cho tôi một sự thật thú vị, ngắn gọn (dưới 30 từ) về loài ${entity.species} bằng tiếng Việt. Giọng điệu vui vẻ, thân thiện.`,
    });
    return response.text || "Chăm sóc thú cưng giúp bạn thư giãn!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Thú cưng của bạn đang cảm thấy rất vui!";
  }
};

export const generateRandomEvent = async (): Promise<{ message: string; coins: number }> => {
  if (!ai) return { message: "Bạn tìm thấy một đồng xu may mắn!", coins: 10 };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Hãy tạo ra một sự kiện ngẫu nhiên ngắn gọn trong game nuôi thú (ví dụ: tìm thấy kho báu, khách tham quan tặng quà). Trả về JSON gồm 'message' (string tiếng Việt) và 'coins' (integer từ 10 đến 100).",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            coins: { type: Type.INTEGER },
          },
          required: ["message", "coins"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response text");
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { message: "Hôm nay là một ngày đẹp trời!", coins: 10 };
  }
};

export const generateName = async (species: string): Promise<string> => {
    if (!ai) return `${species} Con`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Đặt một cái tên cute, ngắn gọn (1 từ hoặc 2 từ) cho một con ${species}. Chỉ trả về cái tên.`,
        });
        return response.text.trim();
    } catch (e) {
        return `${species} Yêu`;
    }
}
