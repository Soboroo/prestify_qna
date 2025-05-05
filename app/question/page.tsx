"use client";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function QuestionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hasRequested = useRef(false);
  const [totalQuestions, setTotalQuestions] = useState(1);

  // script는 localStorage에서만 읽음
  useEffect(() => {
    if (hasRequested.current || question) return;
    let questions: string[] = [];
    let idx = 0;
    if (typeof window !== "undefined") {
      const qlist = localStorage.getItem("question_list");
      if (qlist) questions = JSON.parse(qlist);
      const search = new URLSearchParams(window.location.search);
      idx = parseInt(search.get("index") ?? "0", 10);
    }
    if (!questions.length) {
      setError("질문 목록이 없습니다. 처음부터 다시 시작해 주세요.");
      router.replace("/");
      return;
    }
    if (idx >= questions.length) {
      // 모든 질문이 끝났을 때 결과 페이지 등으로 이동
      router.replace("/");
      return;
    }
    setQuestion(questions[idx]);
    setQuestionIndex(idx);
    hasRequested.current = true;
  }, [question, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const qlist = localStorage.getItem("question_list");
      if (qlist) setTotalQuestions(JSON.parse(qlist).length);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setLoading(true);
    // qa_history 누적
    let qaHistory = [];
    if (typeof window !== "undefined") {
      qaHistory = JSON.parse(localStorage.getItem("qa_history") ?? "[]");
      qaHistory.push({ question, answer });
      localStorage.setItem("qa_history", JSON.stringify(qaHistory));
    }
    router.push(`/evaluate?index=${questionIndex}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex items-center justify-center bg-background">
        <Card className="w-full max-w-3xl p-12 flex flex-col items-center gap-8 shadow-xl min-h-[40vh] justify-center relative">
          <h2 className="text-3xl font-bold mb-4 text-center">질문</h2>
          <div className="text-2xl text-center min-h-[3em]">
            {loading ? "질문을 생성 중입니다..." : question}
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <Progress className="w-32 h-32" value={100} />
            </div>
          )}
          <div className="text-red-600 text-center min-h-[2em]">
            {error}
            {error && (
              <button
                className="mt-4 px-4 py-2 bg-red-100 rounded text-lg"
                onClick={() => window.location.reload()}
              >
                새로고침
              </button>
            )}
          </div>
        </Card>
      </div>
      <div className="flex-1 flex items-center justify-center bg-background">
        <Card className="w-full max-w-3xl p-12 flex flex-col items-center gap-8 shadow-xl min-h-[40vh] justify-center">
          <h2 className="text-3xl font-bold mb-4 text-center">답변 입력</h2>
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
            <Textarea
              className="text-2xl min-h-[120px] p-6"
              placeholder="여기에 답변을 입력하세요..."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              required
              autoFocus
              disabled={loading || !question}
            />
            <Button type="submit" className="text-2xl py-6" disabled={loading || !question}>답변 제출</Button>
          </form>
        </Card>
      </div>
      <div className="w-full flex flex-col items-center justify-center py-8 bg-background">
        <div className="w-full max-w-3xl flex flex-col gap-2">
          <div className="text-xl font-bold text-center mb-2">진행 상황: {questionIndex + 1} / {totalQuestions}</div>
          <Progress className="w-full h-6" value={((questionIndex + 1) / totalQuestions) * 100} />
        </div>
      </div>
    </div>
  );
} 