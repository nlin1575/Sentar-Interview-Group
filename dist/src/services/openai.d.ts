export declare const isOpenAIAvailable = false;
export declare function generateEmbedding(text: string): Promise<{
    embedding: number[];
    tokens: number;
    cost: number;
    type: 'real' | 'mock';
}>;
export declare function generateGPTResponse(parsed: any, profile: any, carry_in: boolean, emotion_flip: boolean): Promise<{
    response: string;
    tokens: number;
    cost: number;
    type: 'real' | 'mock';
}>;
//# sourceMappingURL=openai.d.ts.map