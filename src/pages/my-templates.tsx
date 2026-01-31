import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import { getUserTemplatesByCategory, deleteUserTemplate } from "../firebase/services";
import type { Category, Template } from "../types";

function MyTemplates() {
  const navigate = useNavigate();
  const [currentCategory] = useState<Category>("algorithm");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [currentCategory]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await getUserTemplatesByCategory(currentCategory);
      setTemplates(data);
    } catch (error) {
      console.error("템플릿 로드 실패:", error);
      alert("템플릿을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (templateId: string) => {
    navigate(`/template-registration?id=${templateId}`);
  };

  const handleDelete = async (templateId: string, title: string) => {
    if (!confirm(`"${title}" 템플릿을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteUserTemplate(templateId);
      alert("템플릿이 삭제되었습니다.");
      loadTemplates();
    } catch (error) {
      console.error("템플릿 삭제 실패:", error);
      alert("템플릿 삭제에 실패했습니다.");
    }
  };

  const handleCreateNew = () => {
    navigate("/template-registration");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageHeader title="내 템플릿 관리" description="등록한 템플릿을 확인하고 수정/삭제할 수 있습니다." />

        <div className="mb-6 flex justify-end">
          <Button onClick={handleCreateNew} variant="primary">
            새 템플릿 등록
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-textSecondary">템플릿을 불러오는 중...</div>
        ) : templates.length === 0 ? (
          <div className="bg-surface p-12 rounded-lg border border-border text-center">
            <p className="text-textSecondary mb-4">등록된 템플릿이 없습니다.</p>
            <Button onClick={handleCreateNew} variant="primary">
              템플릿 등록하기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-surface p-6 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text m-0">{template.title}</h3>
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                        {template.type === "paragraph" ? "줄글형" : "문제형"}
                      </span>
                    </div>
                    {template.description && <p className="text-sm text-textSecondary mb-3">{template.description}</p>}
                    <div className="text-xs text-textSecondary">
                      등록일: {template.createdAt?.toLocaleDateString("ko-KR")}
                    </div>
                  </div>

                  <div className="flex">
                    <Button onClick={() => handleEdit(template.id)} variant="ghost" size="sm">
                      수정
                    </Button>
                    <Button onClick={() => handleDelete(template.id, template.title)} variant="ghost" size="sm">
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTemplates;
