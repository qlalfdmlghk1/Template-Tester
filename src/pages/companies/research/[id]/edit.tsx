import { useParams } from "react-router-dom";
import { CompanyResearchFormPage } from "@/features/recruitment/ui/CompanyResearchFormPage/CompanyResearchFormPage";

export default function CompanyResearchEdit() {
  const { id } = useParams<{ id: string }>();

  return <CompanyResearchFormPage companyId={id} />;
}
