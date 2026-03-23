import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  topic: string;
  difficulty: string;
  count: number;
  type: string;
  contextText?: string;
  courseInfo?: { title: string; description: string };
  objectives?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError("Missing Authorization header", 401);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return jsonError("Invalid or expired JWT token", 401);
    }

    // Only mentors and admins can generate quizzes
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'mentor' && profile.role !== 'admin')) {
      return jsonError("Forbidden: Only Mentors/Admins can generate quizzes", 403);
    }

    // Parse and validate request body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const { topic, difficulty, count, type, contextText, courseInfo, objectives } = body;

    if (!topic || !difficulty || !count || count < 1 || count > 50) {
      return jsonError("Invalid parameters: topic, difficulty, and count (1-50) are required", 400);
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return jsonError("AI service not configured", 500);
    }

    const systemPrompt = `You are an expert pedagogical assessment generator.
Generate a quiz with EXACTLY ${count} questions.
Difficulty level: ${difficulty}.
Question format: ${type === 'multiple-choice' ? 'Multiple Choice (MCQ) with 4 options each' : 'Mixed (MCQ and short answer)'}.
${courseInfo ? `Course: "${courseInfo.title}" - ${courseInfo.description}` : ''}
${topic ? `Topic focus: "${topic}"` : ''}
${objectives ? `Learning objectives: ${objectives}` : ''}

For each question, generate a UUID-style id, set points to 10, and include a Bloom's Taxonomy level.
Return ONLY valid JSON matching this exact structure:
{
  "questions": [
    {
      "id": "unique-id-string",
      "type": "multiple-choice",
      "question": "Question text?",
      "correctAnswer": "Correct option text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "points": 10,
      "bloomsTaxonomy": "Remembering"
    }
  ]
}`;

    const userMessage = contextText
      ? `KNOWLEDGE SOURCE MATERIALS:\n${contextText.substring(0, 8000)}\n\nGenerate ${count} questions based on this material. ${topic ? `Focus on: ${topic}` : ''}`
      : `Generate ${count} questions about: ${topic}`;

    // Call Gemini API with retry logic
    let response: Response;
    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: userMessage }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
                maxOutputTokens: 8192,
              }
            })
          }
        );

        if (response.ok) break;

        if (response.status === 429 || response.status >= 500) {
          retries++;
          if (retries <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
            continue;
          }
        }

        const errorBody = await response.text();
        console.error("Gemini API error:", response.status, errorBody);
        return jsonError(`AI service error: ${response.status}`, 502);

      } catch (fetchError) {
        retries++;
        if (retries > maxRetries) {
          console.error("Gemini fetch failed:", fetchError);
          return jsonError("AI service unavailable", 503);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }

    const data = await response!.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error("No content from Gemini:", JSON.stringify(data));
      return jsonError("AI generated no content", 502);
    }

    // Parse and validate generated questions
    let parsedResult;
    try {
      parsedResult = JSON.parse(generatedText);
    } catch {
      console.error("Failed to parse Gemini output:", generatedText.substring(0, 500));
      return jsonError("Failed to parse AI output", 502);
    }

    if (!parsedResult.questions || !Array.isArray(parsedResult.questions)) {
      return jsonError("AI output missing questions array", 502);
    }

    // Ensure each question has required fields
    const questions = parsedResult.questions.map((q: Record<string, unknown>, i: number) => ({
      id: q.id || `ai-${Date.now()}-${i}`,
      type: q.type || 'multiple-choice',
      question: q.question || '',
      correctAnswer: q.correctAnswer || '',
      options: q.options || [],
      points: typeof q.points === 'number' ? q.points : 10,
      bloomsTaxonomy: q.bloomsTaxonomy || 'Remembering',
      difficultyTag: difficulty,
    }));

    return jsonResponse({ data: questions }, 200);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("generate-quiz error:", error);
    return jsonError(message, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}
