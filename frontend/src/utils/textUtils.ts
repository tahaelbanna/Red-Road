export function cleanTextForSpeech(text: string): string {
    if (!text) return text;
    let cleaned = text;

    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    cleaned = cleaned.replace(/```[a-z]*\n?/g, '');
    cleaned = cleaned.replace(/```/g, '');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
    cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

    cleaned = cleaned.replace(/^(#{1,6})\s+/gm, '');

    cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '');
    cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '');

    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');

    cleaned = cleaned.replace(/\n\s*\n/g, '. ');
    cleaned = cleaned.replace(/\n/g, ', ');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');

    cleaned = cleaned.replace(/,\s*\./g, '.');
    cleaned = cleaned.replace(/\.\s*,/g, '.');
    cleaned = cleaned.replace(/,\s*,/g, ',');
    cleaned = cleaned.replace(/\.\s*\./g, '.');
    cleaned = cleaned.replace(/\s+\./g, '.');
    cleaned = cleaned.replace(/\s+,/g, ',');

    return cleaned.trim();
}
