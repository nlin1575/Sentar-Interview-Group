export declare const isOpenAIAvailable: boolean;
export declare function generateEmbedding(text: string): Promise<{
    embedding: number[];
    tokens: number;
    cost: number;
    type: 'openai' | 'local' | 'mock';
}>;
export declare function generateGPTResponse(parsed: any, profile: any, carry_in: boolean, emotion_flip: boolean): Promise<{
    response: string;
    tokens: number;
    cost: number;
    type: 'openai' | 'local' | 'mock';
}>;
//# sourceMappingURL=openai.d.ts.map