import type { GradingResult, LineDiff, WordDiff } from '@/entities/submission/model/submission.type';

function removeComments(line: string): string {
  const trimmed = line.trim();

  if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
    return '';
  }

  let result = line;

  const hashIndex = result.indexOf('#');
  if (hashIndex !== -1) {
    result = result.substring(0, hashIndex);
  }

  const slashIndex = result.indexOf('//');
  if (slashIndex !== -1) {
    result = result.substring(0, slashIndex);
  }

  return result;
}

export function gradeAnswer(expected: string, actual: string): GradingResult {
  const expectedLines = expected
    .split('\n')
    .map(removeComments)
    .filter(line => line.trim() !== '');

  const actualLines = actual
    .split('\n')
    .map(removeComments)
    .filter(line => line.trim() !== '');

  const maxLines = Math.max(expectedLines.length, actualLines.length);
  const lineDiffs: LineDiff[] = [];
  let correctLines = 0;
  let totalNonEmptyLines = 0;

  for (let i = 0; i < maxLines; i++) {
    const expectedLine = expectedLines[i] || '';
    const actualLine = actualLines[i] || '';

    const expectedNormalized = expectedLine
      .replace(/\s+/g, '')
      .replace(/"/g, "'");
    const actualNormalized = actualLine
      .replace(/\s+/g, '')
      .replace(/"/g, "'");
    const isCorrect = expectedNormalized === actualNormalized;

    totalNonEmptyLines++;
    if (isCorrect) {
      correctLines++;
    }

    const lineDiff: LineDiff = {
      lineNumber: i + 1,
      isCorrect,
      expected: expectedLine,
      actual: actualLine,
    };

    if (!isCorrect) {
      lineDiff.wordDiffs = getWordDiffs(expectedLine, actualLine);
    }

    lineDiffs.push(lineDiff);
  }

  const accuracy = totalNonEmptyLines > 0 ? (correctLines / totalNonEmptyLines) * 100 : 0;

  return {
    totalLines: totalNonEmptyLines,
    correctLines,
    accuracy: Math.round(accuracy * 100) / 100,
    lineDiffs,
  };
}

function getWordDiffs(expected: string, actual: string): WordDiff[] {
  const wordDiffs: WordDiff[] = [];

  const expectedWords = expected.split(/(\s+)/);
  const actualWords = actual.split(/(\s+)/);

  const maxLength = Math.max(expectedWords.length, actualWords.length);

  for (let i = 0; i < maxLength; i++) {
    const expectedWord = expectedWords[i] || '';
    const actualWord = actualWords[i] || '';

    if (expectedWord !== actualWord) {
      wordDiffs.push({
        index: i,
        expected: expectedWord || '(없음)',
        actual: actualWord || '(없음)',
      });
    }
  }

  return wordDiffs;
}
