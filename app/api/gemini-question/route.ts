import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  const { script, count } = await req.json();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const tools = [{ googleSearch: {} }];
  const systemInstruction = [
    {
      text: count
        ? `사용자의 입력은 발표 스크립트다. 이 스크립트를 바탕으로 예상 질문 ${count}개를 한 번에 생성한다.\n질문이 2개 이상이면, 절반은 '[비전문가]'로 시작하는 질문(기초적, 상식적, 발표 내용을 쉽게 이해하려는 관점), 나머지는 '[전문가]'로 시작하는 질문(심화, 비판, 응용, 발표의 한계, 최신 동향 등 전문적 관점)으로 생성한다. 홀수일 경우 비전문가 질문이 1개 더 많게 한다.\n각 질문은 서로 주제가 겹치지 않게 다양하게 작성한다. 각 질문은 한두 문장으로 작성하고, 한 줄씩 개행하여 출력한다. 질문 외 다른 출력은 하지 않는다.`
        : `사용자의 입력은 발표 스크립트다. 스크립트를 보고 일반 청중, 혹은 전문가가 할 수 있는 질문을 생성한다. 비전문가 청중의 예상 질문 앞에는 '[비전문가]', 전문가의 예상 질문 앞에는 '[전문가]'를 붙힌다. 질문은 한 두 문장으로 생성한다. 한번에 하나의 질문을 생성한다. 이외 다른 출력은 하지 않는다.`,
    },
  ];
  const config = {
    tools,
    responseMimeType: "text/plain",
    systemInstruction,
  };
  const model = "gemini-2.5-flash-preview-04-17";
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: script,
        },
      ],
    },
  ];
  const response = await ai.models.generateContent({
    model,
    config,
    contents,
  });
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (count) {
    // count개 질문을 배열로 파싱
    const questions = text
      .split(/\n+/)
      .map(q => q.replace(/^\[[^\]]+\]\s*/, "").trim())
      .filter(q => q.length > 0)
      .slice(0, count);
    return NextResponse.json({ questions });
  } else {
    return NextResponse.json({ question: text });
  }
} 