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
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hasRequested = useRef(false);

  // script는 localStorage에서만 읽음
  useEffect(() => {
    if (hasRequested.current || question) return;
    let script = "";
    if (typeof window !== "undefined") {
      script = localStorage.getItem("presentation_script") ?? "";
    }
    if (!script) {
      router.replace("/");
      return;
    }
    setLoading(true);
    setError("");
    hasRequested.current = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10초

    fetch("/api/gemini-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error("질문 생성에 실패했습니다.");
        return res.json();
      })
      .then(data => setQuestion(data.question))
      .catch(err => setError("질문 생성에 실패했습니다. 다시 시도해 주세요."))
      .finally(() => {
        setLoading(false);
        clearTimeout(timeout);
      });

    return () => clearTimeout(timeout);
  }, [question, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setLoading(true);
    // 평가 요청 없이 화면 이동만 수행
    router.push(`/evaluate?question=${encodeURIComponent(question)}&answer=${encodeURIComponent(answer)}`);
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
    </div>
  );
} 