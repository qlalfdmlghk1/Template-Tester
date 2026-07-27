import { useState } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import SyncHelp from "../SyncHelp/SyncHelp";
import type { CalendarSettings } from "@/entities/solve-log/model/solve-log.type";
import type { SyncResult } from "../../model/useCalendarSync";

interface SyncRepoSettingProps {
  settings: CalendarSettings | null;
  isConnected: boolean;
  isSyncing: boolean;
  error: string | null;
  lastResult: SyncResult | null;
  onConnect: (input: string) => Promise<boolean>;
  onResync: (full?: boolean) => Promise<boolean>;
  onDisconnect: () => Promise<void>;
}

const INPUT_CLASS =
  "flex-1 min-w-0 px-3 py-2 text-sm outline outline-1 outline-border rounded-md bg-surface text-text hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all";

export default function SyncRepoSetting({
  settings,
  isConnected,
  isSyncing,
  error,
  lastResult,
  onConnect,
  onResync,
  onDisconnect,
}: SyncRepoSettingProps) {
  const [input, setInput] = useState("");

  const handleDisconnect = () => {
    if (window.confirm("연동을 해제할까요? 이미 저장된 기록은 그대로 남습니다.")) {
      onDisconnect();
    }
  };

  return (
    <section className="bg-surface border border-border rounded-lg p-4 sm:p-5">
      {isConnected && settings ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-text m-0">
              <span className="text-textSecondary">연동 저장소 </span>
              <a
                href={`https://github.com/${settings.repoOwner}/${settings.repoName}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium hover:text-primary transition-colors"
              >
                {settings.repoOwner}/{settings.repoName}
              </a>
            </p>
            <p className="text-xs text-textSecondary mt-1 m-0">
              마지막 동기화{" "}
              {settings.lastSyncedAt
                ? settings.lastSyncedAt.toLocaleString("ko-KR")
                : "기록 없음"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AppButton variant="solid" size="sm" onClick={() => onResync()} loading={isSyncing}>
              동기화
            </AppButton>
            <AppButton
              variant="outline"
              color="gray"
              size="sm"
              onClick={() => onResync(true)}
              disabled={isSyncing}
              title="전체 히스토리를 다시 훑습니다. 기록이 어긋났을 때 사용하세요."
            >
              전체 다시 읽기
            </AppButton>
            <AppButton
              variant="ghost"
              color="gray"
              size="sm"
              onClick={handleDisconnect}
              disabled={isSyncing}
            >
              해제
            </AppButton>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-text m-0 mb-1">GitHub 저장소 연동</h3>
            <p className="text-xs text-textSecondary m-0">
              BaekjoonHub 확장이 풀이를 자동 커밋하는 <strong>공개 저장소</strong> 경로를
              입력하세요. 커밋 기록을 읽어 달력을 채웁니다. 로그인·토큰은 필요하지 않습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="owner/repo (예: qlalfdmlghk1/Algorism_Python)"
              className={INPUT_CLASS}
              onKeyDown={(event) => {
                if (event.key === "Enter") onConnect(input);
              }}
            />
            <AppButton
              variant="solid"
              size="md"
              onClick={() => onConnect(input)}
              disabled={input.trim().length === 0}
              loading={isSyncing}
            >
              연동하고 불러오기
            </AppButton>
          </div>
        </div>
      )}

      {isSyncing && (
        <p className="text-xs text-textSecondary mt-3 m-0">
          커밋을 읽어오는 중입니다. 첫 연동은 전체 히스토리를 훑어 조금 걸릴 수 있습니다.
        </p>
      )}

      {error && (
        <p className="text-xs text-error mt-3 m-0" role="alert">
          {error}
        </p>
      )}

      {!error && !isSyncing && lastResult && (
        <p className="text-xs text-textSecondary mt-3 m-0">
          커밋 {lastResult.scanned}개를 확인해 풀이 기록 {lastResult.saved}건을 반영했습니다.
        </p>
      )}

      {/*
        연동 후에도 "이건 왜 안 잡히지?" 질문이 남으므로 두 상태 모두에서 열어둔다.
        음수 마진으로 카드 패딩을 상쇄해 구분선을 카드 폭 끝까지 빼고, 위아래 여백을
        py-3 으로 같게 맞춘다. 카드 하단 패딩(16/20px)을 그대로 두면 아래쪽만 넓어
        줄이 떠 보인다.
      */}
      <div className="mt-4 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-3 border-t border-border">
        <SyncHelp />
      </div>
    </section>
  );
}
