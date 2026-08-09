import { useParams } from "react-router-dom";
import Navbar from "@/widgets/Navbar/Navbar";
import { CompanyResearchDetail } from "@/features/recruitment/ui/CompanyResearchDetail/CompanyResearchDetail";

export default function CompanyResearchDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* 목록·편집과 같은 폭 — 화면을 오갈 때 폭이 출렁이지 않게 맞춘다 */}
      <div className="max-w-[1400px] mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <CompanyResearchDetail companyId={id} />
      </div>
    </div>
  );
}
