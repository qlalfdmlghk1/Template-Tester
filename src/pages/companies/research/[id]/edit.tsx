import { useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/widgets/Navbar/Navbar";
import { AiKeyDialog } from "@/features/ai-key/ui/AiKeyDialog/AiKeyDialog";
import { CompanyResearchEditor } from "@/features/recruitment/ui/CompanyResearchEditor/CompanyResearchEditor";

export default function CompanyResearchEdit() {
  const { id } = useParams<{ id: string }>();
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* 신규 등록 화면과 같은 폭 — 등록·수정을 오갈 때 폭이 바뀌지 않게 맞춘다 */}
      <div className="max-w-[1400px] mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <CompanyResearchEditor
          companyId={id}
          onOpenKeySettings={() => setKeyDialogOpen(true)}
        />
      </div>

      {keyDialogOpen && <AiKeyDialog onClose={() => setKeyDialogOpen(false)} />}
    </div>
  );
}
