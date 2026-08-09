import { cn } from "@/shared/lib/cn";
import {
  COMPANY_PREFERENCE_CLASSES,
  COMPANY_PREFERENCE_LABELS,
} from "@/entities/company/model/company.type";
import type { CompanyPreference } from "@/entities/company/model/company.type";

interface PreferenceBadgeProps {
  preference?: CompanyPreference;
  /** 등급 문구까지 함께 보여줄지 — 좁은 카드에서는 알파벳만 */
  withLabel?: boolean;
}

/** 지망 등급 배지. 등급이 없으면 아무것도 그리지 않는다(아직 안 정한 상태). */
export function PreferenceBadge({ preference, withLabel }: PreferenceBadgeProps) {
  if (!preference) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-xs font-bold",
        COMPANY_PREFERENCE_CLASSES[preference],
      )}
      title={COMPANY_PREFERENCE_LABELS[preference]}
    >
      {preference}
      {withLabel && (
        <span className="font-medium">{COMPANY_PREFERENCE_LABELS[preference]}</span>
      )}
    </span>
  );
}
