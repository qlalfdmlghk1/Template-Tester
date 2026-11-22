import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AppModal from "./AppModal";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { AppTextarea } from "@/shared/ui/atoms/AppTextarea";

const meta: Meta<typeof AppModal> = {
  title: "shared/ui/molecules/AppModal",
  component: AppModal,
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text", description: "제목 (dialog 이름)" },
    description: { control: "text", description: "제목 아래 보조 문구" },
    size: { control: "select", options: ["sm", "md", "lg", "xl"], description: "너비 sm 400 · md 560 · lg 800 · xl 1000" },
    closeOnOverlay: { control: "boolean", description: "바깥 클릭으로 닫기 (기본 true)" },
    busy: { control: "boolean", description: "저장·분석 중 — Esc·닫기(X)·바깥 클릭을 무시 (X는 보이지만 눌러도 닫히지 않음)" },
    formId: { control: "text", description: "본문을 감쌀 form id — footer submit 버튼은 form={formId}" },
    toolbar: { control: false, description: "본문 맨 위 도구 줄(오른쪽 정렬)" },
    footer: { control: false, description: "아래 고정 버튼 영역" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "DS `AppModal` 어댑터. 포커스를 안에 가두고 Esc로 닫히며, 닫으면 열기 전 요소로 포커스를 돌려준다. 머리말·버튼은 고정, 본문만 스크롤.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppModal>;

function FormDemo({ size = "sm" as const }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const [open, setOpen] = useState(false);
  const [memo, setMemo] = useState("");
  return (
    <>
      <AppButton size="sm" onClick={() => setOpen(true)}>
        모달 열기
      </AppButton>
      <AppModal
        open={open}
        size={size}
        title="자소서"
        description="한화금융"
        onClose={() => setOpen(false)}
        formId="story-modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        toolbar={
          <AppButton type="button" variant="ghost" size="xs">
            캡처·본문으로 채우기
          </AppButton>
        }
        footer={
          <>
            <AppButton type="button" variant="outline" color="gray" size="sm" onClick={() => setOpen(false)}>
              취소
            </AppButton>
            <AppButton type="submit" form="story-modal-form" size="sm">
              저장
            </AppButton>
          </>
        }
      >
        <AppTextarea aria-label="메모" rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모" />
      </AppModal>
    </>
  );
}

export const FormModal: Story = {
  render: () => <FormDemo />,
  parameters: {
    docs: {
      source: {
        code: `<AppModal
  size="sm"
  title="자소서"
  description="한화금융"
  onClose={onClose}
  formId="stage-edit-form"
  onSubmit={handleSubmit}
  footer={
    <>
      <AppButton type="button" variant="outline" color="gray" size="sm" onClick={onClose}>취소</AppButton>
      <AppButton type="submit" form="stage-edit-form" size="sm">저장</AppButton>
    </>
  }
>
  ...
</AppModal>`,
      },
    },
  },
};

export const Large: Story = {
  render: () => <FormDemo size="lg" />,
  parameters: { docs: { source: { code: `<AppModal size="lg" ... />` } } },
};
