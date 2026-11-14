export interface CopilotResponse {
    text: string;
    updates?: any;
    action?: string;
    fallback?: boolean;
    error?: boolean;
}
