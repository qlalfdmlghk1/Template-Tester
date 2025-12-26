import type { GradingResult, LineDiff, CharDiff } from '../types';

/**
 * 두 문자열을 비교하여 채점 결과 생성
 */
export function gradeAnswer(expected: string, actual: string): GradingResult {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');

  const maxLines = Math.max(expectedLines.length, actualLines.length);
  const lineDiffs: LineDiff[] = [];
  let correctLines = 0;
  let totalNonEmptyLines = 0;

  for (let i = 0; i < maxLines; i++) {
    const expectedLine = expectedLines[i] || '';
    const actualLine = actualLines[i] || '';

    // 양쪽 모두 빈 줄인 경우 판단에서 제외 (UI에도 표시 안 함)
    const isBothEmpty = expectedLine.trim() === '' && actualLine.trim() === '';
    if (isBothEmpty) {
      continue;
    }

    // 주석 줄인 경우 판단에서 제외 (Python: #, JavaScript: //)
    const expectedTrimmed = expectedLine.trim();
    const actualTrimmed = actualLine.trim();
    const isExpectedComment = expectedTrimmed.startsWith('#') || expectedTrimmed.startsWith('//');
    const isActualComment = actualTrimmed.startsWith('#') || actualTrimmed.startsWith('//');

    // 한쪽이라도 주석이면 제외
    if (isExpectedComment || isActualComment) {
      continue;
    }

    // 줄 끝 공백을 제거한 후 비교 (trailing space 무시)
    const isCorrect = expectedLine.trimEnd() === actualLine.trimEnd();

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

    // 틀린 경우 문자 단위 diff 계산
    if (!isCorrect) {
      lineDiff.charDiffs = getCharDiffs(expectedLine, actualLine);
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
 * 두 문자열의 문자 단위 차이 계산
 */
function getCharDiffs(expected: string, actual: string): CharDiff[] {
  const charDiffs: CharDiff[] = [];
  const maxLength = Math.max(expected.length, actual.length);

  for (let i = 0; i < maxLength; i++) {
    const expectedChar = expected[i] || '';
    const actualChar = actual[i] || '';

    if (expectedChar !== actualChar) {
      charDiffs.push({
        index: i,
        expected: expectedChar || '(없음)',
        actual: actualChar || '(없음)',
      });
    }
  }

  return charDiffs;
}
