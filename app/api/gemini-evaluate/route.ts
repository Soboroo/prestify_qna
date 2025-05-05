import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  const { contents, index } = await req.json();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const tools = [{ googleSearch: {} }];
  const systemInstruction = [
    {
      text: `아래는 발표 스크립트와 지금까지의 QnA 히스토리, 그리고 ${index}번째 질문과 답변이다. 각 QnA는 Q1, A1, Q2, A2 ... 형식으로 주어진다. 지금 평가할 답변은 A${index}이다. 질문이 '[비전문가]'로 시작하면 관련 지식이 부족한 청중이 발표 주제를 쉽게 이해할 수 있도록 설명하는 답변을 선호한다. 질문이 '[전문가]'로 시작하면 해당 분야에 대한 심화적 이해, 비판, 응용, 한계, 최신 동향 등 전문적 관점에서 깊이 있는 답변을 선호한다. 이 답변을 미흡, 적절, 훌륭함 중 하나로 평가하고, 한두 문장으로 근거를 설명한다. 필요시 개선점을 한 문장 추가한다. 답변이 지식 범위 밖이면 회피, 차선책, 간략 지식도 안내한다. 다른 출력은 하지 않는다.`,
    },
  ];
  const config = {
    tools,
    responseMimeType: "text/plain",
    systemInstruction,
  };
  const model = "gemini-2.5-flash-preview-04-17";
  const response = await ai.models.generateContent({
    model,
    config,
    contents,
  });
  const result = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  return NextResponse.json({ result });
} 