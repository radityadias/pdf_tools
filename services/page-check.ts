export type OcrReason = "empty" | "garbled";

const MIN_CHARS: number = 20;
const MIN_READABLE_RATIO: number = 0.6;

export function checkPageText(text: string): {needsOcr: boolean, reason?: OcrReason} {
    const compact = text.replace(/\s/g, "");

    if (compact.length < MIN_CHARS) return { needsOcr: true, reason: "empty" };

    const readable = compact.match(/[\p{L}\p{N}\p{P}]/gu)?.length ?? 0;
    
    if (readable / compact.length < MIN_READABLE_RATIO) {
        return { needsOcr: true, reason: "garbled" }
    };

    return { needsOcr: false };
}