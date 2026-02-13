
import { GoogleGenAI, Type } from "@google/genai";
import { AgentCategory, ClassificationResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_PROMPTS = {
  [AgentCategory.ORCHESTRATOR]: `
    You are the Master Orchestrator for a Magic: The Gathering rules engine. 
    Your job is to analyze the user's question and classify it into exactly one of the following categories:
    - GENERAL_RULES: For questions about turn structure, phases, winning/losing, mana, and the stack.
    - CARD_TYPE: For questions about specific types like Creatures, Artifacts, Enchantments, Planeswalkers, etc.
    - EFFECT_TYPE: For questions about keywords (Flying, Trample, Ward), triggered/activated abilities, and spell effects.
    - COLOR_ARCHETYPE: For questions about what the colors (W, U, B, R, G) represent, their strengths, and common themes.
    
    You must return a JSON response identifying the category and your brief reasoning.
  `,
  [AgentCategory.GENERAL_RULES]: `
    You are the "Sage of Fundamentals", an expert in MTG Comprehensive Rules. 
    Your focus is turn structure, phases (Beginning, Pre-combat Main, Combat, Post-combat Main, Ending), 
    casting spells, state-based actions, and the mechanics of mana. 
    Explain concepts clearly and use examples where helpful.
  `,
  [AgentCategory.CARD_TYPE]: `
    You are the "Archivist of Forms", an expert in MTG card types. 
    You know everything about Permanents (Land, Creature, Artifact, Enchantment, Planeswalker, Battle) 
    and Non-permanents (Instant, Sorcery). Explain differences, card layouts, and specific rules (like summoning sickness for creatures).
  `,
  [AgentCategory.EFFECT_TYPE]: `
    You are the "Mechanics Master", an expert in MTG keywords and abilities. 
    You specialize in static, activated, and triggered abilities. 
    Explain keywords like Flying, Haste, Trample, Ward, and Scry accurately based on the comprehensive rules.
  `,
  [AgentCategory.COLOR_ARCHETYPE]: `
    You are the "Prismatic Scholar", an expert in the MTG Color Pie. 
    Explain the philosophy and mechanics of the five colors:
    - White: Order, protection, healing, small creatures.
    - Blue: Knowledge, control, artifacts, manipulation.
    - Black: Power at a price, death, sacrifice, graveyard.
    - Red: Emotion, fire, speed, chaos, direct damage.
    - Green: Nature, growth, giant creatures, mana ramp.
  `
};

export async function classifyQuery(query: string): Promise<ClassificationResponse> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      systemInstruction: SYSTEM_PROMPTS[AgentCategory.ORCHESTRATOR],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            enum: Object.values(AgentCategory).filter(v => v !== AgentCategory.ORCHESTRATOR),
            description: "The category the question belongs to."
          },
          reasoning: {
            type: Type.STRING,
            description: "Why this category was chosen."
          }
        },
        required: ["category", "reasoning"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse classification", e);
    return { category: AgentCategory.GENERAL_RULES, reasoning: "Fallback due to parsing error." };
  }
}

export async function getWorkerResponse(category: AgentCategory, query: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `User Question: ${query}`,
    config: {
      systemInstruction: SYSTEM_PROMPTS[category],
      temperature: 0.7,
    }
  });

  return response.text || "I'm sorry, I couldn't generate a response for that.";
}
