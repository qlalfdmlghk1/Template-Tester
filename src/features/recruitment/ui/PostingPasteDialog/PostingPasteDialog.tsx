import { useCallback, useEffect, useRef, useState } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import AppIcon from "@/shared/ui/atoms/AppIcon/AppIcon";
import { cn } from "@/shared/lib/cn";
import {
  READ_IMAGE_MESSAGES,
  pickImageFiles,
  readImageFile,
} from "@/shared/lib/clipboardImage";
import type { ReadImageFailure } from "@/shared/lib/clipboardImage";
import {
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
  SUPPORTED_IMAGE_TYPES,
} from "@/entities/job-application/api/posting.api";
import type { PostingImage } from "@/entities/job-application/api/posting.api";

interface PostingPasteDialogProps {
  companyName: string;
  postingTitle?: string;
  /** 링크로 읽기를 시도했다가 실패해서 열린 경우 그 사유 */
  reason?: string;
  extracting: boolean;
  onExtract: (input: { pastedText?: string; images?: PostingImage[] }) => void;
  onClose: () => void;
}

/** 본문만 붙여넣을 때 필요한 최소 길이 — 링크나 제목만 붙인 걸 걸러낸다 */
const MIN_TEXT_LENGTH = 50;

/** 입력 방식 — 둘은 대안이라 한 번에 하나만 쓴다 */
const MODES = ["image", "text"] as const;

type Mode = (typeof MODES)[number];

const MODE_LABELS: Record<Mode, string> = {
  image: "화면 캡처",
  text: "공고 본문",
};

interface Attached extends PostingImage {
  dataUrl: string;
}

/**
 * 공고 내용 붙여넣기 — 화면 캡처 우선.
 *
 * 공기업·대기업 채용 페이지는 자동 접근을 막아 링크로 못 읽고, 모집요강을 이미지 한 장으로
 * 올리는 곳이 많아 텍스트 복사도 안 된다. 그래서 **화면 캡처를 기본 탭**으로 두고
 * 텍스트 붙여넣기는 글자를 긁을 수 있는 공고용 대안으로 둔다.
 */
export function PostingPasteDialog({
  companyName,
  postingTitle,
  reason,
  extracting,
  onExtract,
  onClose,
}: PostingPasteDialogProps) {
  const [mode, setMode] = useState<Mode>("image");
  const [text, setText] = useState("");
  const [images, setImages] = useState<Attached[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  /**
   * 붙어 있는 캡처의 정본.
   *
   * 상한 판정에 state 를 쓸 수 없다 — 비동기로 파일을 읽는 동안 두 번 붙여넣으면
   * 두 호출이 같은 `images.length` 를 보고 상한을 넘긴다. state 업데이터 안에서
   * 판정하는 것도 안 된다: 업데이터는 렌더 시점까지 미뤄질 수 있어, 바깥에서
   * 안내 문구를 쓰는 시점에는 아직 판정 전이다(붙인 캡처가 조용히 버려진다).
   * ref 는 즉시 반영되므로 판정과 안내를 같은 시점에 끝낼 수 있다.
   */
  const imagesRef = useRef<Attached[]>([]);

  /** ref 를 정본으로 두고 state 를 맞춘다 */
  const commitImages = useCallback((next: Attached[]) => {
    imagesRef.current = next;
    setImages(next);
  }, []);

  const trimmed = text.trim();
  const textTooShort = trimmed.length > 0 && trimmed.length < MIN_TEXT_LENGTH;
  // 보내는 것은 지금 보고 있는 탭의 내용뿐이다
  const canSubmit =
    mode === "image" ? images.length > 0 : trimmed.length >= MIN_TEXT_LENGTH;

  // 탭을 열면 그 탭의 입력부로 포커스를 옮긴다 — 캡처 탭은 곧바로 Ctrl+V 가 먹게
  useEffect(() => {
    if (mode === "image") dropRef.current?.focus();
    else textRef.current?.focus();
  }, [mode]);

  /** 읽어 들인 캡처를 목록에 더한다. 상한을 넘긴 만큼은 버리고 그 사실을 알린다 */
  // ref 와 setter 만 참조하므로 의존성이 없다 — 덕분에 아래 paste 리스너를 한 번만 등록한다
  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // 자리가 없으면 읽지 않는다 — 어차피 버릴 파일을 base64 로 읽을 이유가 없다.
      // 안내는 탭 패널 밖에 렌더되므로 어느 탭에서 붙여넣어도 보인다.
      if (imagesRef.current.length >= MAX_IMAGES) {
        setImageError(`캡처는 최대 ${MAX_IMAGES}장까지 붙일 수 있습니다.`);
        return;
      }

      const results = await Promise.all(
        files.slice(0, MAX_IMAGES).map((file) =>
          readImageFile(file, {
            allowedTypes: SUPPORTED_IMAGE_TYPES,
            maxBytes: MAX_IMAGE_BYTES,
          }),
        ),
      );

      const added = results.filter(
        (item): item is Attached => typeof item !== "string",
      );
      const failure = results.find(
        (item): item is ReadImageFailure => typeof item === "string",
      );

      // 읽기가 끝난 지금 시점의 정본으로 자리를 계산한다
      const room = Math.max(0, MAX_IMAGES - imagesRef.current.length);
      const accepted = added.slice(0, room);
      const overflowed = files.length > MAX_IMAGES || added.length > accepted.length;

      if (accepted.length > 0) {
        commitImages([...imagesRef.current, ...accepted]);
        // 본문 탭에서 캡처를 붙여넣었으면 그쪽으로 데려간다 — 붙였는데 안 보이면 안 된다
        setMode("image");
      }

      setImageError(
        failure
          ? READ_IMAGE_MESSAGES[failure]
          : overflowed
            ? `캡처는 최대 ${MAX_IMAGES}장까지 붙일 수 있습니다.`
            : null,
      );
    },
    [commitImages],
  );

  /**
   * 붙여넣기는 문서 전체에서 받는다.
   *
   * paste 이벤트는 포커스된 요소로 가는데, 창을 막 열었을 땐 포커스가 어디에 있을지
   * 장담할 수 없다. 특정 요소에만 걸어 두면 "붙여넣었는데 아무 일도 없다"가 된다.
   * 텍스트 붙여넣기는 가로채지 않으므로 본문 입력은 그대로 동작한다.
   */
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = pickImageFiles(event.clipboardData?.items ?? null);
      if (files.length === 0) return;

      // 이미지가 들어왔으면 텍스트 영역에 깨진 문자가 찍히지 않게 막는다
      event.preventDefault();
      void addFiles(files);
    };

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);

    const files = Array.from(event.dataTransfer?.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    void addFiles(files);
  };

  /** 좌우 화살표로 탭 이동 — 탭 위젯의 기본 동작이다 */
  const handleTabKey = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    setMode(next);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    onExtract(
      mode === "image"
        ? { images: images.map(({ mediaType, data }) => ({ mediaType, data })) }
        : { pastedText: trimmed },
    );
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="posting-paste-title"
        className="relative flex flex-col w-full max-w-[560px] max-h-[90vh] bg-surface border border-border rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
      >
        {/* 캡처를 여러 장 붙이면 길어진다 — 버튼이 밀려 올라가지 않게 푸터를 고정한다 */}
        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto p-5">
          <header>
            <p className="m-0 text-xs text-textSecondary">
              {companyName}
              {postingTitle && ` · ${postingTitle}`}
            </p>
            <h2
              id="posting-paste-title"
              className="m-0 text-base font-semibold text-text"
            >
              공고 내용 붙여넣기
            </h2>
            {reason && (
              <p className="m-0 mt-1 text-xs text-yellow-800 bg-yellow-100 px-2 py-1 rounded-sm">
                {reason}
              </p>
            )}
          </header>

          <div
            role="tablist"
            aria-label="입력 방식"
            className="flex gap-1 border-b border-border"
          >
            {MODES.map((item) => {
              const selected = mode === item;
              // 다른 탭에 넣어 둔 내용이 조용히 무시되지 않게 표시한다
              const filled =
                item === "image" ? images.length > 0 : trimmed.length > 0;

              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  id={`posting-tab-${item}`}
                  aria-selected={selected}
                  aria-controls={`posting-panel-${item}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setMode(item)}
                  onKeyDown={handleTabKey}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 -mb-px text-sm border-b-2 transition-colors",
                    selected
                      ? "border-primary text-text font-semibold"
                      : "border-transparent text-textSecondary hover:text-text",
                  )}
                >
                  {MODE_LABELS[item]}
                  {item === "image" && images.length > 0 && (
                    <span className="px-1.5 rounded-full text-xs bg-primary text-white">
                      {images.length}
                    </span>
                  )}
                  {item === "text" && filled && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      aria-label="내용 있음"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {mode === "image" ? (
            <section
              role="tabpanel"
              id="posting-panel-image"
              aria-labelledby="posting-tab-image"
              className="flex flex-col gap-1.5"
            >
              <button
                ref={dropRef}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-6 border-2 border-dashed rounded-md transition-colors",
                  "focus:outline-none focus:border-blue-400 focus:bg-blue-50/50",
                  dragging
                    ? "border-blue-400 bg-blue-50/50"
                    : "border-border hover:border-blue-300",
                )}
              >
                <AppIcon
                  name="photo"
                  size={24}
                  className="text-textSecondary"
                />
                <span className="text-sm text-text">
                  여기에{" "}
                  <kbd className="px-1 border border-border rounded-sm">
                    Ctrl+V
                  </kbd>{" "}
                  로 붙여넣기
                </span>
                <span className="text-xs text-textSecondary">
                  끌어다 놓거나, 눌러서 이미지 파일을 고를 수도 있습니다
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept={SUPPORTED_IMAGE_TYPES.join(",")}
                multiple
                hidden
                onChange={(event) => {
                  void addFiles(Array.from(event.target.files ?? []));
                  // 같은 파일을 다시 고를 수 있게 비운다
                  event.target.value = "";
                }}
              />

              <span className="text-xs text-textSecondary">
                <kbd className="px-1 border border-border rounded-sm">
                  Win+Shift+S
                </kbd>{" "}
                로 공고 화면을 캡처한 뒤 붙여넣으세요. 모집요강이 이미지로 된
                공고도 읽습니다. 길면 나눠서 최대 {MAX_IMAGES}장까지 됩니다.
              </span>

              {images.length > 0 && (
                <ul className="flex flex-wrap gap-2 m-0 mt-1 p-0 list-none">
                  {images.map((image, index) => (
                    <li key={image.dataUrl} className="relative">
                      <img
                        src={image.dataUrl}
                        alt={`붙여넣은 캡처 ${index + 1}`}
                        className="w-24 h-24 object-cover border border-border rounded-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          commitImages(
                            imagesRef.current.filter((_, i) => i !== index),
                          )
                        }
                        aria-label={`캡처 ${index + 1} 제거`}
                        className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 bg-surface border border-border rounded-full text-textSecondary hover:text-text"
                      >
                        <AppIcon name="x-mark" size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

            </section>
          ) : (
            <section
              role="tabpanel"
              id="posting-panel-text"
              aria-labelledby="posting-tab-text"
              className="flex flex-col gap-1.5"
            >
              <span className="text-xs text-textSecondary">
                공고 페이지에서{" "}
                <kbd className="px-1 border border-border rounded-sm">
                  Ctrl+A
                </kbd>{" "}
                →{" "}
                <kbd className="px-1 border border-border rounded-sm">
                  Ctrl+C
                </kbd>{" "}
                한 내용을 붙여넣으세요. 메뉴나 푸터가 섞여도 됩니다. 글자가
                선택되지 않는 공고라면 캡처 탭을 쓰세요.
              </span>
              <textarea
                ref={textRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={12}
                className="w-full px-2 py-1.5 text-sm text-text bg-background border border-border rounded-sm resize-y focus:outline-none focus:border-blue-400"
              />
              {textTooShort && (
                <span className="text-xs text-red-600">
                  본문이 너무 짧습니다. 공고 내용을 더 붙여넣어 주세요.
                </span>
              )}
            </section>
          )}

          {/* 탭 패널 밖에 둔다 — 캡처가 꽉 찬 상태로 본문 탭에서 붙여넣으면 탭 전환이
              일어나지 않아, 패널 안에 두면 방금 띄운 안내가 아무 데도 보이지 않는다 */}
          {imageError && (
            <span className="text-xs text-red-600">{imageError}</span>
          )}
        </div>

        <footer className="flex justify-end gap-2 shrink-0 px-5 py-4 border-t border-border">
          <AppButton
            type="button"
            variant="outline"
            color="gray"
            size="sm"
            onClick={onClose}
            disabled={extracting}
          >
            취소
          </AppButton>
          <AppButton
            type="submit"
            size="sm"
            disabled={extracting || !canSubmit}
          >
            {extracting
              ? "분석 중…"
              : mode === "image"
                ? `캡처 ${images.length}장으로 채우기`
                : "본문으로 채우기"}
          </AppButton>
        </footer>
      </form>
    </div>
  );
}
