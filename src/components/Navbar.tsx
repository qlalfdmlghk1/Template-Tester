import type { Category } from '../types';
import { theme } from '../styles/theme';

interface NavbarProps {
  currentCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const categories: { value: Category; label: string }[] = [
  { value: 'algorithm', label: '알고리즘' },
  { value: 'english', label: '영어' },
  { value: 'cs', label: 'CS' },
  { value: 'interview', label: '면접 대비' },
];

export default function Navbar({ currentCategory, onCategoryChange }: NavbarProps) {
  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <span style={styles.logoText}>템플릿 테스터</span>
        </div>
        <div style={styles.tabs}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              style={{
                ...styles.tab,
                ...(currentCategory === cat.value ? styles.tabActive : {}),
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    backgroundColor: theme.colors.surface,
    borderBottom: `1px solid ${theme.colors.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 700,
    color: theme.colors.primary,
  },
  tabs: {
    display: 'flex',
    gap: theme.spacing.sm,
  },
  tab: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    border: 'none',
    background: 'transparent',
    color: theme.colors.textSecondary,
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: theme.borderRadius.md,
    transition: 'all 0.2s ease',
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.surface,
  },
};
