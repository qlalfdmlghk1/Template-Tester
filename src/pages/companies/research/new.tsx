import { useState } from "react";
import Navbar from "@/widgets/Navbar/Navbar";
import { AiKeyDialog } from "@/features/ai-key/ui/AiKeyDialog/AiKeyDialog";
import { CompanyResearchEditor } from "@/features/recruitment/ui/CompanyResearchEditor/CompanyResearchEditor";

export default function CompanyResearchNew() {
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* 목록·코테달력과 같은 폭 — 조사 내용을 2열로 펼치려면 넓이가 필요하다 */}
      <div className="max-w-[1400px] mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <CompanyResearchEditor onOpenKeySettings={() => setKeyDialogOpen(true)} />
      </div>

      {keyDialogOpen && <AiKeyDialog onClose={() => setKeyDialogOpen(false)} />}
    </div>
  );
}
