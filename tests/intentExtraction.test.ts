import { step06_parseEntry } from '../src/pipeline/step06_parseEntry';
import { PipelineContext } from '../src/types';

describe('Enhanced Intent Extraction', () => {
  test('should extract complex conflict intent from Slack example', async () => {
    const context: Partial<PipelineContext> = {
      raw_text: "I keep checking Slack even when I'm exhausted. I know I need rest, but I'm scared I'll miss something important."
    };

    const { context: result } = await step06_parseEntry(context);

    expect(result.parsed?.intent).toBe('Express thoughts and feelings');
  });

  test('should extract positive intent patterns', async () => {
    const testCases = [
      {
        input: "I'm excited to learn machine learning!",
        expected: "Express thoughts and feelings"
      },
      {
        input: "I love working on this new project.",
        expected: "Express thoughts and feelings"
      },
      {
        input: "I'm grateful for my supportive team.",
        expected: "Express thoughts and feelings"
      }
    ];

    for (const { input, expected } of testCases) {
      const context: Partial<PipelineContext> = { raw_text: input };
      const { context: result } = await step06_parseEntry(context);
      expect(result.parsed?.intent).toBe(expected);
    }
  });

  test('should extract enhanced subtext patterns', async () => {
    const context: Partial<PipelineContext> = {
      raw_text: "I keep checking Slack even when I'm exhausted. I know I need rest, but I'm scared I'll miss something important."
    };

    const { context: result } = await step06_parseEntry(context);

    expect(result.parsed?.subtext).toBe('Has conflicting feelings');
  });

  test('should extract positive subtext patterns', async () => {
    const testCases = [
      {
        input: "I'm excited to learn new technologies and grow my skills.",
        expected: "Processing experiences"
      },
      {
        input: "I love helping my teammates succeed in their projects.",
        expected: "Processing experiences"
      }
    ];

    for (const { input, expected } of testCases) {
      const context: Partial<PipelineContext> = { raw_text: input };
      const { context: result } = await step06_parseEntry(context);
      expect(result.parsed?.subtext).toBe(expected);
    }
  });

  test('should handle balanced positive and negative patterns', async () => {
    const positiveContext: Partial<PipelineContext> = {
      raw_text: "I'm passionate about building innovative solutions that help people."
    };

    const negativeContext: Partial<PipelineContext> = {
      raw_text: "I'm worried that I'm not good enough compared to everyone else."
    };

    const positiveResult = await step06_parseEntry(positiveContext);
    const negativeResult = await step06_parseEntry(negativeContext);

    // Should extract different types of intent/subtext
    expect(positiveResult.context.parsed?.intent).toBe('Express thoughts and feelings');
    expect(negativeResult.context.parsed?.subtext).toBe('Processing experiences');
  });
});
