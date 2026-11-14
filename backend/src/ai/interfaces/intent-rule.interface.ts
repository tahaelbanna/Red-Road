export interface IntentRule {
    exactMatches: string[];
    ambiguousMatches?: string[];
    matchMode?: 'includes' | 'exact';
    action: string;
    payload?: any;
    clarificationPrompt?: string;
}
