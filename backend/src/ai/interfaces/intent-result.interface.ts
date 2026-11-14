export interface IntentResult {
    matched: boolean;
    confident: boolean;
    action?: string;
    payload?: any;
    clarificationPrompt?: string;
}
