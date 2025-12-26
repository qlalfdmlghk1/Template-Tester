import type { GradingResult as GradingResultType } from '../types';
import { theme } from '../styles/theme';

interface GradingResultProps {
  result: GradingResultType;
}

export default function GradingResult({ result }: GradingResultProps) {
  const { totalLines, correctLines, accuracy, lineDiffs } = result;

  return (
    <div style={styles.container}>
      {/* 점수 요약 */}
      <div style={styles.summary}>
        <div style={styles.scoreCard}>
          <div style={styles.scoreLabel}>정확도</div>
          <div style={styles.scoreValue}>{accuracy.toFixed(2)}%</div>
        </div>
        <div style={styles.scoreCard}>
          <div style={styles.scoreLabel}>정답 라인</div>
          <div style={styles.scoreValue}>
            {correctLines} / {totalLines}
          </div>
        </div>
      </div>

      {/* 라인별 결과 */}
      <div style={styles.diffContainer}>
        <h3 style={styles.diffTitle}>라인별 상세 결과</h3>
        <div style={styles.diffList}>
          {lineDiffs.map((lineDiff) => (
            <div
              key={lineDiff.lineNumber}
              style={{
                ...styles.diffItem,
                ...(lineDiff.isCorrect ? styles.diffItemCorrect : styles.diffItemWrong),
              }}
            >
              <div style={styles.lineNumber}>{lineDiff.lineNumber}</div>
              <div style={styles.lineContent}>
                <div style={styles.lineRow}>
                  <span style={styles.lineLabel}>정답:</span>
                  <code style={styles.lineCode}>
                    {lineDiff.expected || '(빈 줄)'}
                  </code>
                </div>
                <div style={styles.lineRow}>
                  <span style={styles.lineLabel}>입력:</span>
                  <code style={styles.lineCode}>
                    {lineDiff.actual || '(빈 줄)'}
                  </code>
                </div>

                {/* 틀린 경우 문자 단위 차이 표시 */}
                {!lineDiff.isCorrect && lineDiff.charDiffs && lineDiff.charDiffs.length > 0 && (
                  <div style={styles.charDiffContainer}>
                    <div style={styles.charDiffLabel}>문자 단위 차이:</div>
                    <div style={styles.charDiffList}>
                      {lineDiff.charDiffs.slice(0, 5).map((charDiff, idx) => (
                        <div key={idx} style={styles.charDiff}>
                          위치 {charDiff.index + 1}:
                          <span style={styles.charExpected}> '{charDiff.expected}'</span>
                          →
                          <span style={styles.charActual}> '{charDiff.actual}'</span>
                        </div>
                      ))}
                      {lineDiff.charDiffs.length > 5 && (
                        <div style={styles.charDiffMore}>
                          외 {lineDiff.charDiffs.length - 5}개 차이점...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginTop: theme.spacing.lg,
  },
  summary: {
    display: 'flex',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.border}`,
    textAlign: 'center',
  },
  scoreLabel: {
    fontSize: '14px',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  scoreValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: theme.colors.primary,
  },
  diffContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.border}`,
  },
  diffTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  diffList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    maxHeight: '500px',
    overflowY: 'auto',
  },
  diffItem: {
    display: 'flex',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    border: '1px solid',
  },
  diffItemCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: theme.colors.success,
  },
  diffItemWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: theme.colors.error,
  },
  lineNumber: {
    minWidth: '40px',
    fontWeight: 600,
    color: theme.colors.textSecondary,
    fontSize: '14px',
  },
  lineContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
  },
  lineRow: {
    display: 'flex',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  lineLabel: {
    minWidth: '50px',
    fontSize: '13px',
    fontWeight: 500,
    color: theme.colors.textSecondary,
  },
  lineCode: {
    flex: 1,
    fontSize: '13px',
    fontFamily: 'Courier New, monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  charDiffContainer: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTop: `1px solid ${theme.colors.border}`,
  },
  charDiffLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  charDiffList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  charDiff: {
    fontSize: '12px',
    color: theme.colors.text,
    fontFamily: 'Courier New, monospace',
  },
  charExpected: {
    color: theme.colors.success,
    fontWeight: 600,
  },
  charActual: {
    color: theme.colors.error,
    fontWeight: 600,
  },
  charDiffMore: {
    fontSize: '11px',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
};
