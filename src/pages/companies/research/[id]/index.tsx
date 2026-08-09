import { useParams } from "react-router-dom";
import { CompanyResearchDetailPage } from "@/features/recruitment/ui/CompanyResearchDetailPage/CompanyResearchDetailPage";

export default function CompanyResearchDetail() {
  const { id } = useParams<{ id: string }>();

  return <CompanyResearchDetailPage companyId={id} />;
}
