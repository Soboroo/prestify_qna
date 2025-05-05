"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SCORE_LABELS = ["미흡", "적절", "훌륭함"] as const;
type ScoreType = typeof SCORE_LABELS[number];
const SCORE_COLORS: Record<ScoreType, string> = {
  "미흡": "text-red-600 border-red-400 bg-red-100",
  "적절": "text-orange-600 border-orange-400 bg-orange-100",
  "훌륭함": "text-blue-700 border-blue-400 bg-blue-100",
};

function parseEvaluation(evaluation: string) {
  if (!evaluation) return { score: "(평가 없음)", reason: "", suggestion: "" };
  const [score, reason, suggestion] = evaluation.split(/\n+/);
  return { score: score?.trim() ?? "", reason: reason?.trim() ?? "", suggestion: suggestion?.trim() ?? "" };
}

export default function ReportPage() {
  const [script, setScript] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [qaHistory, setQaHistory] = useState<{question: string, answer: string, evaluation?: string}[]>([]);
  const [evaluations, setEvaluations] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setScript(localStorage.getItem("presentation_script") ?? "");
      setQuestions(JSON.parse(localStorage.getItem("question_list") ?? "[]"));
      setQaHistory(JSON.parse(localStorage.getItem("qa_history") ?? "[]"));
      setEvaluations(JSON.parse(localStorage.getItem("evaluation_list") ?? "[]"));
    }
  }, []);

  // QnA와 평가를 합쳐서 보여주기
  const merged = questions.map((q, i) => {
    const evalStr = evaluations[i] ?? qaHistory[i]?.evaluation ?? "";
    const parsed = parseEvaluation(evalStr);
    // 점수 타입 보정
    const score = SCORE_LABELS.includes(parsed.score as ScoreType) ? parsed.score as ScoreType : "미흡";
    return {
      question: q,
      answer: qaHistory[i]?.answer ?? "(미응답)",
      ...parsed,
      score,
    };
  });

  // 점수별 개수 집계
  const scoreCounts = { "미흡": 0, "적절": 0, "훌륭함": 0 };
  merged.forEach(item => {
    if (SCORE_LABELS.includes(item.score as any)) {
      scoreCounts[item.score as keyof typeof scoreCounts]++;
    }
  });
  const total = merged.length;

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-3xl p-12 flex flex-col items-center gap-8 shadow-xl min-h-[40vh] justify-center relative mt-8">
        <h1 className="text-4xl font-bold mb-4 text-center">전체 QnA 보고서</h1>
        {/* 점수별 그래프 */}
        <div className="w-full mb-8">
          <h2 className="text-2xl font-bold mb-2">평가 점수 분포</h2>
          <div className="flex flex-row gap-4 items-end w-full mb-2">
            {SCORE_LABELS.map(label => (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div className={`text-2xl font-bold mb-1 ${SCORE_COLORS[label]}`}>{scoreCounts[label]}</div>
                <div className={`w-full h-4 rounded ${SCORE_COLORS[label]}`} style={{height: `${(scoreCounts[label]/(total||1))*40+8}px`}} />
                <div className="text-lg mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
        {/* QnA 세부 내역 */}
        <Accordion className="w-full" type="single" collapsible>
          {merged.map((item, idx) => (
            <AccordionItem key={idx} value={`q${idx+1}`}>
              <AccordionTrigger>
                <span>Q{idx+1}</span>
                <span className={`ml-auto text-2xl font-bold px-4 py-1 rounded ${SCORE_COLORS[item.score]}`}>{item.score}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="mb-2">
                  <span className="font-bold">질문:</span> {item.question}
                </div>
                <div className="mb-2">
                  <span className="font-bold">답변:</span> {item.answer}
                </div>
                <div className="mb-2">
                  <span className="font-bold">평가:</span>
                  <div className={`text-2xl font-bold my-2 ${SCORE_COLORS[item.score]}`}>{item.score}</div>
                  <div className="text-lg mb-1 whitespace-pre-line">{item.reason}</div>
                  {item.suggestion && <div className="text-base text-blue-700">{item.suggestion}</div>}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <Button className="text-2xl py-6 mt-8" onClick={() => router.push("/")}>홈으로 돌아가기</Button>
      </Card>
    </div>
  );
} 