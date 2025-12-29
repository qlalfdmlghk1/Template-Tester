import { useState, useEffect } from "react";
import { getRecentSubmissions, type Submission } from "../firebase/services";
import Button from "./ui/Button";

export default function SubmissionHistory() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecentSubmissions(10);
      setSubmissions(data);
    } catch (err) {
      setError("제출 기록을 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="bg-surface p-6 rounded-lg border border-border">
        <h3 className="text-xl font-bold text-text mb-4">최근 제출 기록</h3>
        <p className="text-textSecondary">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface p-6 rounded-lg border border-border">
        <h3 className="text-xl font-bold text-text mb-4">최근 제출 기록</h3>
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadSubmissions} variant="secondary">
          다시 시도
        </Button>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-surface p-6 rounded-lg border border-border">
        <h3 className="text-xl font-bold text-text mb-4">최근 제출 기록</h3>
        <p className="text-textSecondary">아직 제출 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-lg border border-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-text">최근 제출 기록</h3>
        <Button onClick={loadSubmissions} variant="secondary" className="text-sm">
          새로고침
        </Button>
      </div>

      <div className="space-y-3">
        {submissions.map((submission) => (
          <div key={submission.id} className="bg-background p-4 rounded border border-border">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-text">{submission.templateTitle}</h4>
                <p className="text-sm text-textSecondary">{submission.category}</p>
              </div>
              <span className={`text-2xl font-bold ${getScoreColor(submission.score)}`}>
                {submission.score.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-textSecondary">
              <span>
                정답: {submission.correctLines}/{submission.totalLines} 줄
              </span>
              <span className="mx-2">•</span>
              <span>{formatDate(submission.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
