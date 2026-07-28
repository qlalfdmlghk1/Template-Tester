import { useState } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * 연동 조건 도움말.
 *
 * hover 툴팁이 아니라 눌러서 펼치는 패널로 둔다. 담을 내용이 툴팁 한 칸에
 * 들어가지 않고, 터치 기기에는 hover가 없어 정작 필요한 곳에서 안 보인다.
 */
export default function SyncHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1 text-xs text-textSecondary hover:text-primary transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        어떤 기록이 달력에 잡히나요?
        <svg
          className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 p-3 sm:p-4 bg-background border border-border rounded-md space-y-4">
          <p className="text-xs text-textSecondary m-0">
            <strong className="text-text">프로그래머스·백준에서 채점을 통과한 풀이</strong>가 달력에 쌓입니다.
            GitHub 저장소에 자동으로 남은 커밋을 읽어 푼 날짜·문제·난이도를 복원합니다.
          </p>

          <section>
            <h4 className="text-xs font-semibold text-text m-0 mb-1.5">준비물</h4>
            <ul className="text-xs text-textSecondary space-y-1 list-disc pl-4 m-0">
              <li>
                프로그래머스·백준 풀이가{" "}
                <a
                  href="https://github.com/BaekjoonHub/BaekjoonHub"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  BaekjoonHub
                </a>{" "}
                확장으로 저장소에 자동 커밋되고 있어야 합니다
              </li>
              <li>그 저장소가 <strong>공개(public)</strong>여야 합니다 — 로그인·토큰 없이 읽기 때문입니다</li>
            </ul>
            <p className="text-xs text-textSecondary mt-1.5 m-0">
              저장소를 따로 손볼 필요는 없습니다. 확장이 만드는 형식을 그대로 읽습니다.
            </p>
          </section>

          <section>
            <h4 className="text-xs font-semibold text-text m-0 mb-1.5">읽는 것</h4>
            <p className="text-xs text-textSecondary m-0 mb-2">
              메시지가 <code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">-BaekjoonHub</code>로 끝나는
              자동 커밋만 읽습니다. 커밋 시각이 푼 날짜가 되고, 나머지 정보는 메시지와 폴더 경로에서 가져옵니다.
            </p>
            <p className="text-[11px] font-medium text-text m-0 mb-1">프로그래머스</p>
            <pre className="text-[11px] text-textSecondary bg-gray-100 rounded p-2 overflow-x-auto m-0">
              {`[level 2] Title: 의상, Time: 0.23 ms, Memory: 44.1 MB -BaekjoonHub
프로그래머스/2/42578. 의상/의상.js`}
            </pre>

            <p className="text-[11px] font-medium text-text mt-2 mb-1">백준</p>
            <pre className="text-[11px] text-textSecondary bg-gray-100 rounded p-2 overflow-x-auto m-0">
              {`[Bronze V] Title: A+B, Time: 80 ms, Memory: 42660 KB -BaekjoonHub
백준/Bronze/1000. A+B/A+B.py`}
            </pre>

            <p className="text-xs text-textSecondary mt-2 m-0">
              플랫폼은 난이도 표기로 갈립니다 —{" "}
              <code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">level 2</code>처럼 적혀 있으면
              프로그래머스, <code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">Silver III</code> 같은
              티어면 백준으로 봅니다.
            </p>
          </section>

          <section>
            <h4 className="text-xs font-semibold text-text m-0 mb-1.5">안 잡히는 것</h4>
            <ul className="text-xs text-textSecondary space-y-1 list-disc pl-4 m-0">
              <li>
                직접 올린 커밋 (<code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">250102 업로드</code> 같은
                묶음 커밋) — 커밋 날짜가 실제 푼 날짜와 달라 제외합니다
              </li>
              <li>확장이 만든 폴더에서 옮기거나 이름을 바꾼 풀이</li>
              <li>비공개 저장소, 다른 확장이나 손으로 정리한 저장소</li>
            </ul>
            <p className="text-xs text-textSecondary mt-1.5 m-0">
              이런 기록은 날짜를 선택하고 <strong>+ 직접 추가</strong>로 남길 수 있습니다.
            </p>
          </section>

          <section>
            <h4 className="text-xs font-semibold text-text m-0 mb-1.5">문제 제목에 링크가 없다면</h4>
            <p className="text-xs text-textSecondary m-0 mb-1.5">
              문제 번호는 커밋 메시지가 아니라 폴더 경로에서 찾습니다. 그 번호로 프로그래머스는 lesson 주소를,
              백준은 문제 주소를 만듭니다.
            </p>
            <ul className="text-xs text-textSecondary space-y-1 list-disc pl-4 m-0">
              <li>
                최상단 폴더가 <code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">프로그래머스</code> 또는{" "}
                <code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">백준</code>이 아니면 번호를 찾지
                못합니다
              </li>
              <li>
                문제 폴더 이름이 <code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">42578. 의상</code>{" "}
                처럼 <strong>번호 + 제목</strong> 형태여야 합니다
              </li>
            </ul>
            <p className="text-xs text-textSecondary mt-1.5 m-0">
              폴더가 지워졌거나 이름이 바뀌었으면 기록은 남지만 원문 링크가 비어 있습니다.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
