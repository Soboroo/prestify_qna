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
  const [index, setIndex] = useState(0);
  const [qlist, setQlist] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(5);
  const [nextQuestion, setNextQuestion] = useState("");
  const [autoNext, setAutoNext] = useState(true);

  // 쿼리스트링/로컬스토리지에서 값 읽기
  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      const idx = parseInt(search.get("index") ?? "0", 10);
      setIndex(idx);
      const qlistArr = JSON.parse(localStorage.getItem("question_list") ?? "[]");
      setQlist(qlistArr);
      const qaHistory = JSON.parse(localStorage.getItem("qa_history") ?? "[]");
      setQuestion(qlistArr[idx] ?? "");
      setAnswer(qaHistory[idx]?.answer ?? "");
      setScript(localStorage.getItem("presentation_script") ?? "");
    }
  }, []);

  // autoNext 값 로드
  useEffect(() => {
    if (typeof window !== "undefined") {
      setAutoNext(localStorage.getItem("autoNext") === "true");
    }
  }, []);

  // 값이 모두 준비된 후에만 평가 API 호출
  useEffect(() => {
    if (!question || !script) return;
    setLoading(true);
    let qaHistory: {question: string, answer: string}[] = [];
    if (typeof window !== "undefined") {
      qaHistory = JSON.parse(localStorage.getItem("qa_history") ?? "[]");
    }
    // 컨텍스트 누적
    const contents = [
      { role: "user", parts: [{ text: script }] },
      ...qaHistory.slice(0, index).flatMap((qa: {question: string, answer: string}, i: number) => [
        { role: "model", parts: [{ text: `Q${i+1}: ${qlist[i]}` }] },
        { role: "user", parts: [{ text: `A${i+1}: ${qa.answer}` }] }
      ]),
      { role: "model", parts: [{ text: `Q${index+1}: ${question}` }] },
      { role: "user", parts: [{ text: `A${index+1}: ${answer}` }] },
    ];
    fetch("/api/gemini-evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, index: index+1 }),
    })
      .then(res => res.json())
      .then(data => setResult(data.result))
      .finally(() => setLoading(false));
  }, [question, answer, script, index, qlist]);

  useEffect(() => {
    if (loading || !result) return;
    if (autoNext) {
      if (timer === 0) {
        router.push(`/question?index=${index + 1}`);
      }
      if (timer > 0 && !loading && result) {
        const t = setTimeout(() => setTimer(timer - 1), 1000);
        return () => clearTimeout(t);
      }
    }
  }, [timer, router, loading, result, script, index, autoNext]);

  // 평가 결과가 나오면 다음 질문을 미리 생성
  useEffect(() => {
    if (!result) return;
    let script = "";
    if (typeof window !== "undefined") {
      script = localStorage.getItem("presentation_script") ?? "";
    }
    if (!script) return;
    fetch("/api/gemini-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
    })
      .then(res => res.json())
      .then(data => {
        setNextQuestion(data.question);
        if (typeof window !== "undefined") {
          localStorage.setItem("next_question", data.question ?? "");
        }
      });
  }, [result]);

  // 평가 결과를 localStorage에 저장
  useEffect(() => {
    if (!result) return;
    if (typeof window !== "undefined") {
      const evalList = JSON.parse(localStorage.getItem("evaluation_list") ?? "[]");
      evalList[index] = result;
      localStorage.setItem("evaluation_list", JSON.stringify(evalList));
    }
  }, [result, index]);

  const handleContinue = () => {
    if (loading) return;
    router.push(`/question?index=${index + 1}`);
  };
  const handleExit = () => {
    if (loading) return;
    router.push("/report");
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-3xl p-12 flex flex-col items-center gap-8 shadow-xl min-h-[40vh] justify-center relative">
        <h2 className="text-3xl font-bold mb-4 text-center">답변 평가</h2>
        <div className="text-2xl text-center min-h-[3em]">
          {loading ? "평가 중입니다..." : result}
        </div>
        <div className="flex gap-8 mt-8 w-full justify-center">
          {!autoNext && (index < qlist.length - 1) && (
            <Button onClick={handleContinue} className="text-2xl py-6 flex items-center gap-2" disabled={loading}>
              <span>계속</span>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" stroke="#888" strokeWidth="4" />
                <text x="16" y="22" textAnchor="middle" fontSize="16" fill="#888">{timer}</text>
              </svg>
            </Button>
          )}
          <Button variant="outline" onClick={handleExit} className="text-2xl py-6" disabled={loading}>나가기</Button>
        </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <Progress className="w-32 h-32" value={100} />
          </div>
        )}
      </Card>
      <div className="w-full flex flex-col items-center justify-center py-8 bg-background">
        <div className="w-full max-w-3xl flex flex-col gap-2">
          <div className="text-xl font-bold text-center mb-2">진행 상황: {index + 1} / {qlist.length}</div>
          <Progress className="w-full h-6" value={qlist.length ? ((index + 1) / qlist.length) * 100 : 0} />
        </div>
      </div>
    </div>
  );
} 