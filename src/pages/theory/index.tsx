import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppFallback from "@/shared/ui/molecules/AppFallback/AppFallback";

export default function Theory() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageHeader title="개념 학습" description="이론 개념을 정리하고 반복 학습하는 공간입니다." />
        <AppFallback
          type="empty"
          title="준비 중인 기능입니다."
          description="개념 학습 기능은 곧 제공될 예정입니다."
          hideButton
        />
      </div>
    </div>
  );
}
