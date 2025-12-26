export const theme = {
  colors: {
    primary: '#1E40AF',      // Deep Blue - 주요 버튼, 강조색
    primaryLight: '#3B82F6', // Bright Blue - 호버 상태
    primaryDark: '#1E3A8A',  // Dark Blue - 액티브 상태
    secondary: '#60A5FA',    // Sky Blue - 보조 요소
    background: '#F8FAFC',   // Light Gray Blue - 배경
    surface: '#FFFFFF',      // White - 카드, 패널
    text: '#1E293B',         // Dark Slate - 주요 텍스트
    textSecondary: '#64748B',// Slate - 보조 텍스트
    border: '#E2E8F0',       // Light Border
    success: '#10B981',      // Green - 정답 표시
    error: '#EF4444',        // Red - 오답 표시
    warning: '#F59E0B',      // Amber - 경고
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
} as const;
