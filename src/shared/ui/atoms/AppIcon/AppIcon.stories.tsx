import type { Meta, StoryObj } from "@storybook/react";
import AppIcon from "./AppIcon";

const meta: Meta<typeof AppIcon> = {
  title: "shared/ui/atoms/AppIcon",
  component: AppIcon,
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "text",
      description: "아이콘 이름 (kebab-case 또는 PascalCase)",
    },
    type: {
      control: "select",
      options: ["heroicons", "material"],
      description: "아이콘 타입",
    },
    variant: {
      control: "select",
      options: ["solid", "outline"],
      description: "Heroicons 스타일 (solid/outline)",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", 16, 20, 24, 32, 48],
      description: "아이콘 크기 (sm: 16px, md: 20px, lg: 24px 또는 숫자)",
    },
    color: {
      control: "color",
      description: "아이콘 색상",
    },
    materialWeight: {
      control: "select",
      options: [undefined, "light", "regular"],
      description: "Material 아이콘 굵기 (미지정 시 사이즈 기반 자동 선택)",
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
통합 아이콘 컴포넌트입니다. Heroicons, Material Symbols를 지원합니다.

## 사용 방법

\`\`\`tsx
import { AppIcon } from '@/shared/ui/atoms/AppIcon';

{/* Heroicons (기본) */}
<AppIcon name="check" />
<AppIcon name="home" variant="solid" />

{/* Material Symbols */}
<AppIcon name="drag-indicator" type="material" />
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | string | (required) | 아이콘 이름 |
| type | 'heroicons' \\| 'material' | 'heroicons' | 아이콘 타입 |
| variant | 'solid' \\| 'outline' | 'outline' | Heroicons 스타일 |
| size | 'sm' \\| 'md' \\| 'lg' \\| number | 'md' | 아이콘 크기 |
| color | string | 'currentColor' | 아이콘 색상 |
| materialWeight | 'light' \\| 'regular' | undefined | Material 아이콘 굵기 |

## 아이콘 타입별 특징

### Heroicons (type="heroicons")
- 기본 아이콘 라이브러리
- \`variant\` prop으로 solid/outline 선택 가능
- 아이콘 목록: https://heroicons.com/

### Material Symbols (type="material")
- Google Material Symbols 아이콘
- 기본 동작: 사이즈 기반 자동 선택
  - 20px 이하: \`material-symbols-light\` (가는 선)
  - 21px 이상: \`material-symbols\` (기본)
- \`materialWeight\` prop으로 수동 지정 가능
- 아이콘 목록: https://fonts.google.com/icons
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppIcon>;

export const Default: Story = {
  args: {
    name: "check",
    type: "heroicons",
    variant: "outline",
    size: "md",
    color: "currentColor",
  },
  parameters: {
    docs: {
      source: {
        code: `<AppIcon name="check" />`,
      },
    },
  },
};

export const HeroiconsOutline: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <AppIcon name="home" variant="outline" />
      <AppIcon name="user" variant="outline" />
      <AppIcon name="cog-6-tooth" variant="outline" />
      <AppIcon name="bell" variant="outline" />
      <AppIcon name="magnifying-glass" variant="outline" />
      <AppIcon name="arrow-left" variant="outline" />
      <AppIcon name="check" variant="outline" />
      <AppIcon name="x-mark" variant="outline" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `
<AppIcon name="home" variant="outline" />
<AppIcon name="user" variant="outline" />
<AppIcon name="cog-6-tooth" variant="outline" />
<AppIcon name="bell" variant="outline" />
<AppIcon name="magnifying-glass" variant="outline" />
        `.trim(),
      },
    },
  },
};

export const HeroiconsSolid: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <AppIcon name="home" variant="solid" />
      <AppIcon name="user" variant="solid" />
      <AppIcon name="cog-6-tooth" variant="solid" />
      <AppIcon name="bell" variant="solid" />
      <AppIcon name="magnifying-glass" variant="solid" />
      <AppIcon name="arrow-left" variant="solid" />
      <AppIcon name="check" variant="solid" />
      <AppIcon name="x-mark" variant="solid" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `
<AppIcon name="home" variant="solid" />
<AppIcon name="user" variant="solid" />
<AppIcon name="cog-6-tooth" variant="solid" />
        `.trim(),
      },
    },
  },
};

export const MaterialSymbols: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <AppIcon name="drag-indicator" type="material" />
      <AppIcon name="more-vert" type="material" />
      <AppIcon name="expand-more" type="material" />
      <AppIcon name="expand-less" type="material" />
      <AppIcon name="edit" type="material" />
      <AppIcon name="delete" type="material" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `
<AppIcon name="drag-indicator" type="material" />
<AppIcon name="more-vert" type="material" />
<AppIcon name="expand-more" type="material" />
        `.trim(),
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      <div className="text-center">
        <AppIcon name="home" size="sm" />
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          sm (16px)
        </div>
      </div>
      <div className="text-center">
        <AppIcon name="home" size="md" />
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          md (20px)
        </div>
      </div>
      <div className="text-center">
        <AppIcon name="home" size="lg" />
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          lg (24px)
        </div>
      </div>
      <div className="text-center">
        <AppIcon name="home" size={32} />
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          32px
        </div>
      </div>
      <div className="text-center">
        <AppIcon name="home" size={48} />
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          48px
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `
<AppIcon name="home" size="sm" />  {/* 16px */}
<AppIcon name="home" size="md" />  {/* 20px */}
<AppIcon name="home" size="lg" />  {/* 24px */}
<AppIcon name="home" size={32} />  {/* 32px */}
<AppIcon name="home" size={48} />  {/* 48px */}
        `.trim(),
      },
    },
  },
};

export const Colors: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <AppIcon name="heart" variant="solid" color="#ef4444" size="lg" />
      <AppIcon name="star" variant="solid" color="#eab308" size="lg" />
      <AppIcon name="check-circle" variant="solid" color="#22c55e" size="lg" />
      <AppIcon
        name="information-circle"
        variant="solid"
        color="#3b82f6"
        size="lg"
      />
      <AppIcon
        name="exclamation-circle"
        variant="solid"
        color="#f97316"
        size="lg"
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `
<AppIcon name="heart" variant="solid" color="#ef4444" size="lg" />
<AppIcon name="star" variant="solid" color="#eab308" size="lg" />
<AppIcon name="check-circle" variant="solid" color="#22c55e" size="lg" />
        `.trim(),
      },
    },
  },
};

export const OutlineVsSolid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6" style={{ maxWidth: 400 }}>
      <div className="text-center">
        <div className="font-semibold mb-3 text-gray-700">Outline</div>
        <div className="flex gap-3 justify-center">
          <AppIcon name="heart" variant="outline" size="lg" />
          <AppIcon name="star" variant="outline" size="lg" />
          <AppIcon name="bell" variant="outline" size="lg" />
        </div>
      </div>
      <div className="text-center">
        <div className="font-semibold mb-3 text-gray-700">Solid</div>
        <div className="flex gap-3 justify-center">
          <AppIcon name="heart" variant="solid" size="lg" />
          <AppIcon name="star" variant="solid" size="lg" />
          <AppIcon name="bell" variant="solid" size="lg" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `
{/* Outline (기본) */}
<AppIcon name="heart" variant="outline" />

{/* Solid */}
<AppIcon name="heart" variant="solid" />
        `.trim(),
      },
    },
  },
};

export const MaterialOpticalSize: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-semibold mb-2 text-gray-700">
          20px 이하: material-symbols-light (가는 선) - 자동
        </div>
        <div className="flex gap-3 items-center">
          <AppIcon name="drag-indicator" type="material" size={16} />
          <AppIcon name="drag-indicator" type="material" size={20} />
        </div>
      </div>
      <div>
        <div className="font-semibold mb-2 text-gray-700">
          21px 이상: material-symbols (기본) - 자동
        </div>
        <div className="flex gap-3 items-center">
          <AppIcon name="drag-indicator" type="material" size={24} />
          <AppIcon name="drag-indicator" type="material" size={32} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `
{/* 20px 이하: 가는 선 스타일 */}
<AppIcon name="drag-indicator" type="material" size={16} />
<AppIcon name="drag-indicator" type="material" size={20} />

{/* 21px 이상: 기본 스타일 */}
<AppIcon name="drag-indicator" type="material" size={24} />
        `.trim(),
      },
    },
  },
};

export const MaterialWeightStory: Story = {
  name: "MaterialWeight",
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-semibold mb-2 text-gray-700">
          16px + materialWeight 미지정 (자동: light)
        </div>
        <div className="flex gap-3 items-center">
          <AppIcon name="drag-indicator" type="material" size={16} />
        </div>
      </div>
      <div>
        <div className="font-semibold mb-2 text-gray-700">
          16px + materialWeight="regular" (강제: 두꺼운 선)
        </div>
        <div className="flex gap-3 items-center">
          <AppIcon
            name="drag-indicator"
            type="material"
            size={16}
            materialWeight="regular"
          />
        </div>
      </div>
      <div>
        <div className="font-semibold mb-2 text-gray-700">
          24px + materialWeight="light" (강제: 가는 선)
        </div>
        <div className="flex gap-3 items-center">
          <AppIcon
            name="drag-indicator"
            type="material"
            size={24}
            materialWeight="light"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `
{/* 16px에서 두꺼운 선 스타일 강제 */}
<AppIcon name="drag-indicator" type="material" size={16} materialWeight="regular" />

{/* 24px에서 가는 선 스타일 강제 */}
<AppIcon name="drag-indicator" type="material" size={24} materialWeight="light" />
        `.trim(),
      },
    },
  },
};
