import type { GradingResult, LineDiff, WordDiff } from '../types';

/**
 * 주석을 제거하는 함수
 */
function removeComments(line: string): string {
  const trimmed = line.trim();

  // 줄 전체가 주석인 경우 빈 문자열 반환
  if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
    return '';
  }

  // 인라인 주석 제거 (코드 뒤의 # 또는 // 주석)
  let result = line;

  // Python 스타일 주석 (#) 제거
  const hashIndex = result.indexOf('#');
  if (hashIndex !== -1) {
    result = result.substring(0, hashIndex);
  }

  // JavaScript 스타일 주석 (//) 제거
  const slashIndex = result.indexOf('//');
  if (slashIndex !== -1) {
    result = result.substring(0, slashIndex);
  }

  return result;
}

/**
 * 두 문자열을 비교하여 채점 결과 생성
 */
export function gradeAnswer(expected: string, actual: string): GradingResult {
  // 주석 제거 및 빈 줄 제거
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

    // 모든 공백을 제거하고 따옴표 통일 후 비교
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

    // 틀린 경우 단어 단위 diff 계산
    if (!isCorrect) {
      lineDiff.wordDiffs = getWordDiffs(expectedLine, actualLine);
    }

    lineDiffs.push(lineDiff);
  }

  const accuracy = totalNonEmptyLines > 0 ? (correctLines / totalNonEmptyLines) * 100 : 0;

  return {
    totalLines: totalNonEmptyLines,
    correctLines,
    accuracy: Math.round(accuracy * 100) / 100, // 소수점 둘째 자리까지
    lineDiffs,
  };
}

/**
 * 두 문자열의 단어 단위 차이 계산
 */
function getWordDiffs(expected: string, actual: string): WordDiff[] {
  const wordDiffs: WordDiff[] = [];

  // 공백 기준으로 단어 분리
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
