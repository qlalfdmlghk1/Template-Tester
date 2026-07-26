import Navbar from "@/widgets/Navbar/Navbar";
import PageHeader from "@/shared/ui/molecules/PageHeader/PageHeader";
import AppFallback from "@/shared/ui/molecules/AppFallback/AppFallback";

export default function Companies() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageHeader title="기업 조사" description="지원 기업의 채용 정보와 조사 내용을 정리하는 공간입니다." />
        <AppFallback
          type="empty"
          title="준비 중인 기능입니다."
          description="기업 조사 기능은 곧 제공될 예정입니다."
          hideButton
        />
      </div>
    </div>
  );
}
