import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeminiApiClientUseCase {
    private readonly logger = new Logger(GeminiApiClientUseCase.name);

    async generateContent(params: {
        apiKey: string;
        model: string;
        systemPrompt: string;
        input: string;
        tools: any[];
    }): Promise<any> {
        const { apiKey, model, systemPrompt, input, tools } = params;
        let response: Response | undefined;
        let lastErrorMsg = '';
        let attempt = 0;
        const maxRetries = 3;

        while (attempt < maxRetries) {
            attempt++;
            response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        contents: [{ role: 'user', parts: [{ text: input }] }],
                        tools,
                    }),
                },
            );

            if (response.ok) {
                break;
            }

            let errorDetails = response.statusText;
            let errorCode = 'UNKNOWN';
            let errorStatus = 'UNKNOWN';
            try {
                const errorBody = await response.json();
                if (errorBody && errorBody.error) {
                    const sanitizedMessage = errorBody.error.message
                        ? errorBody.error.message.replace(apiKey || '', '***')
                        : '';
                    errorCode = errorBody.error.code || 'UNKNOWN';
                    errorStatus = errorBody.error.status || 'UNKNOWN';
                    errorDetails = `${errorStatus} (${errorCode}): ${sanitizedMessage}`;
                }
            } catch {
                // Ignore JSON parse error if body is not JSON
            }

            if (response.status === 400) {
                throw new Error(
                    `Invalid Gemini API request. Check model name (${model}) or API key validity.`,
                );
            }

            if (
                response.status === 429 &&
                (errorStatus === 'RESOURCE_EXHAUSTED' ||
                    errorDetails.toLowerCase().includes('quota'))
            ) {
                throw new Error(
                    `Gemini API error 429: Billing or free-tier quota exhausted. Please check your Google AI Studio account.`,
                );
            }

            lastErrorMsg = `Gemini API error: ${response.status} ${errorDetails}`;

            if (
                (response.status === 429 || response.status >= 500) &&
                attempt < maxRetries
            ) {
                const backoffMs =
                    Math.floor(Math.random() * 500) +
                    Math.pow(2, attempt) * 1000;
                this.logger.warn(
                    `Transient error (${response.status}). Retrying in ${backoffMs}ms...`,
                );
                await new Promise((resolve) => setTimeout(resolve, backoffMs));
                continue;
            }

            if (response.status >= 500) {
                throw new Error(
                    `Gemini API error: ${response.status} UNAVAILABLE. The service is currently experiencing high demand. Please try again later.`,
                );
            }
            throw new Error(lastErrorMsg);
        }

        if (!response) {
            throw new Error(
                'Gemini API failed to return a response after retries.',
            );
        }

        return response.json();
    }
}
