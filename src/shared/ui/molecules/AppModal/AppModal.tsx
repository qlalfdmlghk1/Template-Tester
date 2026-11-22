import { AppModal } from "@choi/ds";
import { cn } from "@/shared/lib/cn";
import type { FormEvent, ReactNode } from "react";

export type AppModalSize = "sm" | "md" | "lg" | "xl";

export interface AppModalProps {
  /** 기본 true — 대부분 부모가 조건부로 렌더한다 */
  open?: boolean;
  /** 닫기 버튼·Esc·바깥 클릭(closeOnOverlay)에서 부른다 */
  onClose: () => void;
  title: ReactNode;
  /** 제목 아래 보조 문구 (회사명·안내 등) */
  description?: ReactNode;
  /** 너비. sm 400 · md 560 · lg 800 · xl 1000px */
  size?: AppModalSize;
  /** 본문 맨 위 도구 줄(오른쪽 정렬) — DS 머리말에 버튼 자리가 없어 본문 첫 줄에 둔다 */
  toolbar?: ReactNode;
  /** 아래 고정 영역(취소·저장 버튼). 본문만 스크롤된다 */
  footer?: ReactNode;
  children?: ReactNode;
  /**
   * 넘기면 본문을 이 id의 form으로 감싼다. 기본 제출은 어댑터가 항상 막는다. footer는 form 밖에 그려지므로
   * 저장 버튼은 `type="submit" form={formId}`로 연결한다.
   */
  formId?: string;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /** 바깥(어두운 영역) 클릭으로 닫기. 기본 true — 기존 모달 동작 유지 */
  closeOnOverlay?: boolean;
  /** 본문 래퍼 클래스. 기본 세로 간격 gap-3 */
  bodyClassName?: string;
}

const DS_SIZE: Record<AppModalSize, "sm" | "md" | "lg"> = { sm: "sm", md: "md", lg: "lg", xl: "lg" };

/**
 * 모달 — DS `AppModal` 어댑터.
 * body에 띄우고 포커스를 안에 가두며, 닫으면 열기 전 요소로 포커스를 돌려준다. Esc로 닫히고
 * 모달이 겹치면 맨 위 것만 반응한다. 머리말·아래 버튼 영역은 고정되고 본문만 스크롤된다.
 * xl은 DS에 없어 lg 위에 index.css `.app-modal--xl`로 너비를 넓힌다.
 */
function AppModalAdapter({
  open = true,
  onClose,
  title,
  description,
  size = "md",
  toolbar,
  footer,
  children,
  formId,
  onSubmit,
  closeOnOverlay = true,
  bodyClassName,
}: AppModalProps) {
  const body = (
    <>
      {/* 0·"" 같은 값이 그대로 찍히지 않게 노드가 있을 때만 그린다 */}
      {toolbar != null && toolbar !== false && toolbar !== "" && (
        <div className="flex flex-wrap justify-end gap-1">{toolbar}</div>
      )}
      {children}
    </>
  );
  const bodyClass = cn("flex flex-col gap-3", bodyClassName);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size={DS_SIZE[size]}
      className={size === "xl" ? "app-modal--xl" : undefined}
      closeOnOverlay={closeOnOverlay}
      footer={footer}
    >
      {formId ? (
        <form
          id={formId}
          // 브라우저 기본 제출(현재 URL로 GET → 새로고침, name 붙은 값이 쿼리에 실림)은 항상 막는다
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit?.(event);
          }}
          className={bodyClass}
        >
          {body}
        </form>
      ) : (
        <div className={bodyClass}>{body}</div>
      )}
    </AppModal>
  );
}

AppModalAdapter.displayName = "AppModal";

export default AppModalAdapter;
