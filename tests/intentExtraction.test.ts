import { step06_parseEntry } from '../src/pipeline/step06_parseEntry';
import { PipelineContext } from '../src/types';

describe('Enhanced Intent Extraction', () => {
  test('should extract complex conflict intent from Slack example', () => {
    const context: Partial<PipelineContext> = {
      raw_text: "I keep checking Slack even when I'm exhausted. I know I need rest, but I'm scared I'll miss something important."
    };

    const { context: result } = step06_parseEntry(context);
    
    expect(result.parsed?.intent).toBe('Find rest without fear of missing out');
  });

  test('should extract positive intent patterns', () => {
    const testCases = [
      {
        input: "I'm excited to learn machine learning!",
        expected: "Pursue passion for learn machine learning"
      },
      {
        input: "I love working on this new project.",
        expected: "Cultivate joy through working on this new project"
      },
      {
        input: "I'm grateful for my supportive team.",
        expected: "Appreciate and nurture my supportive team"
      }
    ];

    testCases.forEach(({ input, expected }) => {
      const context: Partial<PipelineContext> = { raw_text: input };
      const { context: result } = step06_parseEntry(context);
      expect(result.parsed?.intent).toBe(expected);
    });
  });

  test('should extract enhanced subtext patterns', () => {
    const context: Partial<PipelineContext> = {
      raw_text: "I keep checking Slack even when I'm exhausted. I know I need rest, but I'm scared I'll miss something important."
    };

    const { context: result } = step06_parseEntry(context);
    
    expect(result.parsed?.subtext).toBe('Fears being seen as less committed or dedicated');
  });

  test('should extract positive subtext patterns', () => {
    const testCases = [
      {
        input: "I'm excited to learn new technologies and grow my skills.",
        expected: "Driven by genuine curiosity and desire for growth"
      },
      {
        input: "I love helping my teammates succeed in their projects.",
        expected: "Motivated by desire to serve and contribute to others"
      }
    ];

    testCases.forEach(({ input, expected }) => {
      const context: Partial<PipelineContext> = { raw_text: input };
      const { context: result } = step06_parseEntry(context);
      expect(result.parsed?.subtext).toBe(expected);
    });
  });

  test('should handle balanced positive and negative patterns', () => {
    const positiveContext: Partial<PipelineContext> = {
      raw_text: "I'm passionate about building innovative solutions that help people."
    };

    const negativeContext: Partial<PipelineContext> = {
      raw_text: "I'm worried that I'm not good enough compared to everyone else."
    };

    const positiveResult = step06_parseEntry(positiveContext);
    const negativeResult = step06_parseEntry(negativeContext);

    // Should extract different types of intent/subtext
    expect(positiveResult.context.parsed?.intent).toContain('passion');
    expect(negativeResult.context.parsed?.subtext).toContain('imposter syndrome');
  });
});
