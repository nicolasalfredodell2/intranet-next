"use client";

interface SurveyCreateQuestionProps {
  survey: any;
  onNewQuestion: (question: any) => void;
}

export default function SurveyCreateQuestion({ survey, onNewQuestion }: SurveyCreateQuestionProps) {
  void survey;
  void onNewQuestion;

  return (
    <p className="mb-0" style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
      Falta migrar el componente Angular <code>app-create-question</code>.
    </p>
  );
}