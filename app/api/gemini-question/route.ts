import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  let { script } = await req.json();
  script = script ?? "";
  if (!script.trim()) {
    return NextResponse.json({ error: "스크립트가 필요합니다." }, { status: 400 });
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const tools = [{ googleSearch: {} }];
  const config = {
    tools,
    responseMimeType: "text/plain",
    systemInstruction: [
      {
        text: `사용자의 입력은 발표 스크립트다. 스크립트를 보고 일반 청중, 혹은 전문가가 할 수 있는 질문을 생성한다. 비전문가 청중의 예상 질문 앞에는 ‘[비전문가]’, 전문가의 예상 질문 앞에는 '[전문가]'를 붙힌다. 질문은 한 두 문장으로 생성한다. 한번에 하나의 질문을 생성한다. 질문의 주제는 발표 내용에 한정되지 않으며, 발표와 관련된 다른 지식을 일부 포함할 수 있다. 이외 다른 출력은 하지 않는다. 질문을 생성한 이후 사용자는 이에 대한 답변을 입력으로 제공한다. 입력된 답변을 미흡, 적절, 훌륭함으로 평가한다. 현장에서 발표하는 것을 상정한다. 다른 외부 정보를 참고하기 어려운 상황에서 사용자의 답변은 본인의 지식 안에서만 답변할 수 있는 점을 유념한다. 정확하지 못하거나 잘 알지 못하는 답변에 대해 적절한 회피는 용인될 수 있다. 다만 알고 있는 지식 내에서 최대한 답변 하는 것을 좋은 답변으로 평가한다. 가령 자신의 경험적 지식으로 답변하거나 비슷한 분야의 답변은 좋은 답변일 수 있다. 답변에 대한 평가 출력은 미흡, 적절, 훌륭함 중 하나를 처음에 출력하고, 다음 줄에는 한 두 문장 정도의 평가 근거를 설명한다. 개선할 필요가 있는 점이 있다면 한 문장을 선택적으로 추가할 수 있다. 만약 미흡하다고 평가한 사용자 답변이 사용자의 지식 범위 밖이라고 판단된다면 회피, 차선책 제공 등의 적절한 대응 방법을 제공하고, 질문에 필요한 간략한 지식을 제공한다.`,
      },
    ],
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
  const question = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  return NextResponse.json({ question });
} 