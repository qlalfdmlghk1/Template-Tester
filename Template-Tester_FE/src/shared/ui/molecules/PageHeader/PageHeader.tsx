import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 mb-4 min-h-[40px] sm:min-h-[48px]">
        <h2 className="hidden sm:block text-lg sm:text-xl md:text-2xl font-bold text-text m-0">{title}</h2>
        {actions}
      </div>
      {description && <p className="text-sm text-textSecondary m-0">{description}</p>}
    </div>
  );
}
