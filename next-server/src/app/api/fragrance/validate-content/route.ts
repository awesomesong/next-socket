import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/lib/session";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.id || !user?.email) {
            return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
        }

        const { description, notes } = await req.json();
        if (!description && !notes) {
            return NextResponse.json({ isFragrance: false }, { status: 200 });
        }

        const apiKey = process.env.OPENAI_API_KEY!;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a fragrance content validator. Your only job is to determine if the given text describes a fragrance/perfume product. Respond ONLY with a JSON object: {\"isFragrance\": true} or {\"isFragrance\": false}.",
                    },
                    {
                        role: "user",
                        content: `Does the following text describe a fragrance or perfume product?\n\nDescription: ${description}\n\nNotes: ${notes}`,
                    },
                ],
                response_format: { type: "json_object" },
                max_tokens: 20,
                temperature: 0,
            }),
        });

        if (!response.ok) {
            console.error('[OpenAI Validate Error]', await response.json());
            return NextResponse.json({ message: 'AI 검증에 실패했습니다.' }, { status: 500 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content);

        return NextResponse.json({ isFragrance: parsed.isFragrance === true }, { status: 200 });
    } catch (error) {
        console.error('[Validate Content Error]', error);
        return NextResponse.json({ message: '내용 검증 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
