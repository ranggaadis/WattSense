"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateEnergyTips(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result?.response?.text() || "";
    const lines = text
      .split("\n")
      .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    return lines;
  } catch (err) {
    console.error("Gemini tips generation failed:", err?.message || err);
    return [];
  }
}
