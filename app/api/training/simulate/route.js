import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { message, history } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        // 1. Get Settings (Prompt + API Key)
        const { data: settingsData, error: settingsError } = await supabase
            .from('bot_settings')
            .select('key, value')
            .in('key', ['openrouter_api_key', 'system_prompt']);

        if (settingsError || !settingsData) {
            return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 });
        }

        const openRouterKeyOption = settingsData.find(s => s.key === 'openrouter_api_key');
        const systemPromptOption = settingsData.find(s => s.key === 'system_prompt');

        if (!openRouterKeyOption?.value) {
            return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
        }

        const systemPrompt = systemPromptOption?.value || "You are a helpful assistant.";

        // 2. Convert History to OpenRouter format
        const formattedHistory = (history || []).map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));

        // 3. Call OpenRouter
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKeyOption.value}`,
                "HTTP-Referer": "https://bajajbot.com",
                "X-Title": "Bajaj EMI Bot Simulator",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL || "anthropic/claude-3-haiku",
                max_tokens: 150,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...formattedHistory,
                    { role: "user", content: message }
                ]
            })
        });

        const orData = await orRes.json();

        if (orData.error) {
            console.error("OpenRouter simulator error:", orData.error);
            return NextResponse.json({ error: orData.error.message || 'AI request failed' }, { status: 500 });
        }

        const reply = orData.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";

        return NextResponse.json({ reply });

    } catch (error) {
        console.error('Simulate training error:', error);
        return NextResponse.json({ error: 'SystemError' }, { status: 500 });
    }
}
