export interface FragranceAnalysis {
    isFragrance: boolean;
    brand: string;
    name: string;
    slug: string;
    description: string;
    notes: string;
}

export async function analyzeFragranceImage(imageUrl: string): Promise<FragranceAnalysis | null> {
    try {
        const res = await fetch('/api/fragrance/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl }),
        });

        if (!res.ok) {
            try {
                const errorData = await res.json();
                if (errorData?.code) {
                    const err = new Error(errorData.message);
                    (err as Error & { code?: string }).code = errorData.code;
                    throw err;
                }
            } catch (e: unknown) {
                if (e instanceof Error && 'code' in e) throw e;
            }
            return null;
        }

        const data = await res.json();
        return data.result as FragranceAnalysis;
    } catch (e: unknown) {
        if (e instanceof Error && 'code' in e) throw e;
        return null;
    }
}
