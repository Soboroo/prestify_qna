"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EvaluatePage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [script, setScript] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(5);

  // 쿼리스트링/로컬스토리지에서 값 읽기
  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      setQuestion(search.get("question") || "");
      setAnswer(search.get("answer") || "");
      setScript(localStorage.getItem("presentation_script") ?? "");
    }
  }, []);

  // 값이 모두 준비된 후에만 평가 API 호출
  useEffect(() => {
    if (!question || !answer || !script) return;
    setLoading(true);
    fetch("/api/gemini-evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script, question, answer }),
    })
      .then(res => res.json())
      .then(data => setResult(data.result))
      .finally(() => setLoading(false));
  }, [question, answer, script]);

  useEffect(() => {
    if (loading || !result) return;
    if (timer === 0) {
      router.push(`/question`);
    }
    if (timer > 0 && !loading && result) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer, router, loading, result, script]);

  const handleContinue = () => {
    if (loading) return;
    router.push(`/question`);
  };
  const handleExit = () => {
    if (loading) return;
    router.push("/");
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-3xl p-12 flex flex-col items-center gap-8 shadow-xl min-h-[40vh] justify-center relative">
        <h2 className="text-3xl font-bold mb-4 text-center">답변 평가</h2>
        <div className="text-2xl text-center min-h-[3em]">
          {loading ? "평가 중입니다..." : result}
        </div>
        <div className="flex gap-8 mt-8 w-full justify-center">
          <Button onClick={handleContinue} className="text-2xl py-6 flex items-center gap-2" disabled={loading}>
            <span>계속</span>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" stroke="#888" strokeWidth="4" />
              <text x="16" y="22" textAnchor="middle" fontSize="16" fill="#888">{timer}</text>
            </svg>
          </Button>
          <Button variant="outline" onClick={handleExit} className="text-2xl py-6" disabled={loading}>나가기</Button>
        </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <Progress className="w-32 h-32" value={100} />
          </div>
        )}
      </Card>
    </div>
  );
} 