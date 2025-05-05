'use client';
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";

export default function Home() {
  const router = useRouter();
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [questionCount, setQuestionCount] = useState(10);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAuto = localStorage.getItem("autoNext");
      setAutoNext(savedAuto === "true");
      const savedCount = localStorage.getItem("questionCount");
      if (savedCount) setQuestionCount(Math.max(1, Math.min(10, parseInt(savedCount, 10))));
    }
  }, []);

  const handleCountChange = (v: number) => {
    const value = Math.max(1, Math.min(10, v));
    setQuestionCount(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("questionCount", value.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (script.trim().length === 0) return;
    setLoading(true);
    // 질문 questionCount개를 한 번에 생성
    const res = await fetch("/api/gemini-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script, count: questionCount }),
    });
    const data = await res.json();
    setLoading(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("presentation_script", script);
      localStorage.setItem("question_list", JSON.stringify(data.questions ?? []));
      localStorage.setItem("qa_history", "[]");
      localStorage.setItem("autoNext", autoNext ? "true" : "false");
      localStorage.setItem("questionCount", questionCount.toString());
    }
    router.push(`/question`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-2xl p-12 flex flex-col items-center gap-8 shadow-xl relative min-h-[400px]">
        <h1 className="text-4xl font-bold mb-4 text-center">발표 스크립트 입력</h1>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
          <Textarea
            className="text-2xl min-h-[200px] p-6"
            placeholder="여기에 발표 스크립트를 입력하세요..."
            value={script}
            onChange={e => setScript(e.target.value)}
            required
            autoFocus
            disabled={loading}
          />
          <div className="flex flex-row items-center gap-4 justify-center">
            <span className="text-xl">질문 개수</span>
            <button type="button" className="text-2xl px-3 py-1 border rounded" onClick={() => handleCountChange(questionCount-1)} disabled={loading || questionCount<=1}>-</button>
            <input
              type="number"
              min={1}
              max={10}
              value={questionCount}
              onChange={e => handleCountChange(Number(e.target.value))}
              className="w-16 text-center text-2xl border rounded"
              disabled={loading}
            />
            <button type="button" className="text-2xl px-3 py-1 border rounded" onClick={() => handleCountChange(questionCount+1)} disabled={loading || questionCount>=10}>+</button>
            <span className="text-lg text-muted-foreground">(1~10개 선택 가능)</span>
          </div>
          <Button type="submit" className="text-2xl py-6" disabled={loading}>
            {loading ? "질문 생성 중..." : "질문 생성 시작"}
          </Button>
        </form>
        <div className="w-full max-w-2xl flex flex-row items-center justify-center gap-4 mt-4">
          <Switch id="auto-next-switch" checked={autoNext} onCheckedChange={setAutoNext} />
          <label htmlFor="auto-next-switch" className="text-xl select-none cursor-pointer">
            답변 평가 후 자동으로 다음 질문 생성
          </label>
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
