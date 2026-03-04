export async function validateFragranceContent(description: string, notes: string): Promise<boolean> {
    try {
        const res = await fetch('/api/fragrance/validate-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, notes }),
        });

        if (!res.ok) return false;

        const data = await res.json();
        return data.isFragrance === true;
    } catch {
        return false;
    }
}
