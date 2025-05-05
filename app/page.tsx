'use client';
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (script.trim().length === 0) return;
    setLoading(true);
    // 긴 스크립트는 POST로 전달, 질문 생성 후 /question으로 이동
    const res = await fetch("/api/gemini-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
    });
    const data = await res.json();
    setLoading(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("presentation_script", script);
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
          <Button type="submit" className="text-2xl py-6" disabled={loading}>
            {loading ? "질문 생성 중..." : "질문 생성 시작"}
          </Button>
        </form>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <Progress className="w-32 h-32" value={100} />
          </div>
        )}
      </Card>
    </div>
  );
}
