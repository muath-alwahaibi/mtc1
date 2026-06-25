import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ContentArchitectOutput {
  linguistic_check: string;
  content_output: {
    headline: string;
    body: string[];
    expert_insight: string;
    cta: string;
    hashtags: string[];
    technical_briefing: string;
  };
  visual_engine: {
    image_prompt: string;
    ratio: string;
  };
}

export interface GenerationParams {
  topic: string;
  field: string;
  platform: 'LinkedIn' | 'Instagram' | 'X';
  language: 'Arabic' | 'English';
}

export function generateImage(prompt: string, width: number = 1024, height: number = 1024) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true`;
}

export async function generateContent(params: { 
  topic: string; 
  trainerName?: string;
  field: string; 
  platform: string; 
  style: string; 
  language: string;
  eventPhase: 'START' | 'MID' | 'END';
  duration: number;
  startDate: string;
}): Promise<ContentArchitectOutput> {
  const model = "gemini-3-flash-preview";

  const phaseInstructions = {
    START: "Tone: High energy, anticipation, and welcoming. Focus: Welcoming the new cohort, goals of the workshop, and first impressions. Sample opening: 'And so it begins... We are thrilled to welcome our new trainees today.'",
    MID: "Tone: Educational, focus on hard work, and 'in-the-moment' action. Focus: Skills being mastered, practical exercises, and the dynamic atmosphere inside the studio.",
    END: "Tone: Prestigious, celebratory, and proud. Focus: Achievements, certificates, final projects, and future career impact. Sample opening: 'A new chapter begins... Congratulations to our newest media graduates.'"
  };

  const systemInstruction = `Role: Strategic Content Architect & Media Training Expert. 
Goal: High-impact content for ${params.platform} in ${params.language}. 
Field: ${params.field}. 
Style: ${params.style}.
Event Phase: ${params.eventPhase}.
Event Duration: ${params.duration} day(s) starting from ${params.startDate}.

Phase-Specific Instructions:
${phaseInstructions[params.eventPhase]}

Output requirements:
1. Headline: Catchy and phase-aligned.
2. Body: Provide 3 different concise, summarized caption options for social media. They must be formal, detailed yet summarized, engaging, and reflecting the ${params.eventPhase} phase atmosphere. CRUCIAL: If the language is Arabic, they MUST follow this exact formal PR style: "تعزيزًا لـ [الهدف]، نفّذ #مركز_التدريب_الإعلامي برنامج «[الموضوع]» للمدرب ${params.trainerName ? params.trainerName : '[اسم المدرب إن وجد]'}، والذي ركّز على [أبرز المحاور مختصرة]." Important: Make ONE of the 3 options INTERACTIVE. It MUST start with an engaging, interactive sentence or question to hook the audience, followed by the formal PR news structure described above. The other two options should remain strictly formal without asking the audience for participation. Format the 3 options clearly.
3. Expert Insight: Strategic observation about the training field.
4. CTA: Goal-oriented and phase-appropriate.
5. Technical briefing: Metadata or technical notes.

Visual: Describe a cinematic 3D render representing the topic in a ${params.style} aesthetic, tailored to the ${params.eventPhase} stage and event context.
Format: STRICT JSON only.`;

  const userPrompt = `Generate a Content Architecture for Topic (Program Name): "${params.topic}"${params.trainerName ? ` presented by Trainer: "${params.trainerName}"` : ''} on ${params.platform} in ${params.language} during the ${params.eventPhase} phase of a ${params.duration}-day event starting ${params.startDate}. Style: ${params.style}.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          linguistic_check: { type: Type.STRING },
          content_output: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              body: { type: Type.ARRAY, items: { type: Type.STRING } },
              expert_insight: { type: Type.STRING },
              cta: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              technical_briefing: { type: Type.STRING }
            },
            required: ["headline", "body", "expert_insight", "cta", "hashtags", "technical_briefing"]
          },
          visual_engine: {
            type: Type.OBJECT,
            properties: {
              image_prompt: { type: Type.STRING },
              ratio: { type: Type.STRING }
            },
            required: ["image_prompt", "ratio"]
          }
        },
        required: ["linguistic_check", "content_output", "visual_engine"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse AI response as JSON", e);
    throw new Error("The AI returned content in an invalid format.");
  }
}

export interface AuditOutput {
  corrected_text: string;
  explanation: string;
  is_perfect: boolean;
}

export async function auditContent(content: string, language: string): Promise<AuditOutput> {
  const model = "gemini-3-flash-preview";

  const systemInstruction = `Role: Expert Linguistic Auditor. 
Goal: Perform a comprehensive spelling and linguistic audit of the provided text in ${language}.
Focus: Grammar, spelling, punctuation, styling, and tone.
Output: The corrected version of the text, an explanation of changes made, and a boolean indicating if the original was already perfect.
Format: STRICT JSON only.`;

  const userPrompt = `Audit the following content: "${content}" in ${language}.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          corrected_text: { type: Type.STRING },
          explanation: { type: Type.STRING },
          is_perfect: { type: Type.BOOLEAN }
        },
        required: ["corrected_text", "explanation", "is_perfect"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse Audit response as JSON", e);
    throw new Error("The AI returned audit content in an invalid format.");
  }
}
