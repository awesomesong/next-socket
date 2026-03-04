import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/lib/session";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.id || !user?.email) {
            return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
        }

        const { imageUrl } = await req.json();
        if (!imageUrl) {
            return NextResponse.json({ message: '이미지 URL이 필요합니다.' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY!;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: { url: imageUrl },
                            },
                            {
                                type: "text",
                                text: `You are a perfume expert. Analyze this image and extract fragrance product information.

First, determine if this image is related to a fragrance/perfume product (bottle, package, advertisement, etc.).

Return ONLY a valid JSON object with these exact fields:
{
  "isFragrance": true or false (boolean — true only if the image is clearly a fragrance/perfume product),
  "brand": "Brand/house name visible in the image (empty string if not visible)",
  "name": "Fragrance name visible in the image (empty string if not visible)",
  "slug": "URL identifier: combine brand and name in lowercase with underscores, e.g. 'diptyque_philosykos' (empty string if brand or name not visible)",
  "description": "Write a poetic Korean description of the scent's story and essence based on the bottle design, brand identity, and any visible text. 2-3 sentences. (empty string if nothing can be inferred)",
  "notes": "Olfactory notes in Korean format: 'TOP: ... HEART: ... BASE: ...' based on brand knowledge. (empty string if not determinable)"
}

If isFragrance is false, set all other fields to empty strings.
Do NOT include any text or markdown outside the JSON object.`,
                            },
                        ],
                    },
                ],
                response_format: { type: "json_object" },
                max_tokens: 800,
                temperature: 0.3,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('[OpenAI Analyze Error]', error);
            return NextResponse.json({ message: 'AI 분석에 실패했습니다.' }, { status: 500 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return NextResponse.json({ message: 'AI 응답이 비어있습니다.' }, { status: 500 });
        }

        const parsed = JSON.parse(content);
        return NextResponse.json({ result: parsed }, { status: 200 });
    } catch (error) {
        console.error('[Fragrance Analyze Error]', error);
        return NextResponse.json({ message: 'AI 분석 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
