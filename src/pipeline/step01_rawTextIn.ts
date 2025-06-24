import { RawText } from '../types';

export function rawTextIn(transcript: string): RawText {
  const rawText = transcript.trim();

  console.log(
    `[RAW_TEXT_IN] input=<${rawText}> | output=<${rawText}> | note=accepted`
  );

  return rawText;
}
