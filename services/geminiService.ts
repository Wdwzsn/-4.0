
import { GoogleGenAI } from "@google/genai";

export const getAICompanionResponse = async (userMessage: string) => {
  try {
    // Lazy initialization to prevent crash if API key is missing
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      console.warn('Gemini API key is missing or invalid');
      return "抱歉，我的连接暂时有些问题。";
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userMessage,
      config: {
        systemInstruction: `你是一个温柔、耐心、体贴的数字陪伴助手，专门为中国的老年人设计。
        你的语气应该是尊重的、亲切的，就像他们的一个孝顺晚辈或老朋友。
        使用简单的中文。
        如果老人家感到孤独，请给予情感慰藉和倾听。
        如果他们询问健康或运动（如太极、八段锦），可以提供一些基础建议，但要提醒量力而行。
        多鼓励他们，多赞美他们分享的生活点滴。`,
        temperature: 0.7,
        topP: 0.8,
      },
    });

    return response.text || "对不起，我刚才走神了，您能再说一遍吗？";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "抱歉，我现在连接不顺畅，但我一直在您身边。";
  }
};
