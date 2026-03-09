import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import pdfParse from "pdf-parse";

// Increase max payload size for file uploads if needed
export const maxDuration = 60; // For Vercel max duration
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const { data: settingsData, error: settingsError } = await supabase
            .from('bot_settings')
            .select('value')
            .eq('key', 'openrouter_api_key')
            .single();

        if (settingsError || !settingsData?.value) {
            return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
        }

        const openRouterKey = settingsData.value;
        const fileName = file.name;
        const fileType = file.type;
        const isPdf = fileType === 'application/pdf';

        // 1. Upload file to Supabase Storage bucket 'training-screenshots'
        const fileExt = fileName.split('.').pop();
        const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('training-screenshots')
            .upload(uniqueFileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
        }

        const { data: publicUrlData } = supabase
            .storage
            .from('training-screenshots')
            .getPublicUrl(uniqueFileName);

        const fileUrl = publicUrlData.publicUrl;

        // 2. Analyze with OpenRouter
        let analysisText = "";

        try {
            if (isPdf) {
                // Buffer extraction for PDF
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const pdfData = await pdfParse(buffer);

                const textContent = pdfData.text.substring(0, 8000); // Limit context size

                const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${openRouterKey}`,
                        "HTTP-Referer": "https://bajajbot.com",
                        "X-Title": "Bajaj EMI Bot",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: process.env.AI_MODEL || "anthropic/claude-3-haiku",
                        messages: [{
                            role: "user",
                            content: `Analyze this document text from the Bajaj EMI card process.
                        1) What state is this conversation/document relating to?
                        2) What is the key information?
                        3) What did the customer ask/provide?
                        4) What is the ideal bot response?
                        Text: ${textContent}
                        
                        Return JSON only:
                        { "state": "string", "botMessage": "string", "customerMessage": "string", "idealResponse": "string", "suggestedPromptUpdate": "string" }`
                        }],
                        response_format: { type: "json_object" }
                    })
                });
                const orData = await orRes.json();
                analysisText = orData.choices?.[0]?.message?.content || "{}";

            } else {
                // Image analysis using Vision support
                const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${openRouterKey}`,
                        "HTTP-Referer": "https://bajajbot.com",
                        "X-Title": "Bajaj EMI Bot",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "anthropic/claude-3-haiku", // assuming vision support or specify a vision model if available in openrouter like gpt-4o for images
                        messages: [{
                            role: "user",
                            content: [
                                { type: "image_url", image_url: { url: fileUrl } },
                                {
                                    type: "text", text: `This is a Bajaj EMI card bot Messenger screenshot. Analyze:
                            1) What state is this conversation in?
                            2) What did the bot say?
                            3) What did the customer say?
                            4) What is the ideal bot response?
                            Return JSON only:
                            { "state": "string", "botMessage": "string", "customerMessage": "string", "idealResponse": "string", "suggestedPromptUpdate": "string" }` }
                            ]
                        }],
                        response_format: { type: "json_object" }
                    })
                });

                const orData = await orRes.json();
                analysisText = orData.choices?.[0]?.message?.content || "{}";
            }
        } catch (aiError) {
            console.error("AI Analysis error:", aiError);
            // Fallback analysis if API fails
            analysisText = JSON.stringify({
                state: "unknown",
                botMessage: "Error analyzing.",
                customerMessage: "Error analyzing.",
                idealResponse: "Manual review required.",
                suggestedPromptUpdate: "Review image manually."
            });
        }

        let analysisObj = {};
        try {
            // Strip markdown blocks if present
            const cleanText = analysisText.replace(/```json\n|\n```|```/g, '').trim();
            analysisObj = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse JSON from AI", e);
            analysisObj = { error: "Failed to parse AI response", raw: analysisText };
        }

        // 3. Save to database
        const { data: insertedDb, error: dbInsertError } = await supabase
            .from('training_docs')
            .insert({
                file_url: fileUrl,
                file_name: fileName,
                file_type: fileType,
                analysis: analysisObj,
                applied: false
            })
            .select()
            .single();

        if (dbInsertError) {
            console.error("DB Insert error:", dbInsertError);
            return NextResponse.json({ error: 'Failed to save analysis to database' }, { status: 500 });
        }

        return NextResponse.json({ success: true, doc: insertedDb });

    } catch (error) {
        console.error('Upload training doc error:', error);
        return NextResponse.json({ error: 'SystemError' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabase
            .from('training_docs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: 'SystemError' }, { status: 500 });
    }
}
