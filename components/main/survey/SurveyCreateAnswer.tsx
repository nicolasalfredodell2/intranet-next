"use client";

interface SurveyCreateAnswerProps {
  question: any;
  onNewAnswer: (answer: any) => void;
}

export default function SurveyCreateAnswer({ question, onNewAnswer }: SurveyCreateAnswerProps) {
  void question;
  void onNewAnswer;

  return (
    <p className="mb-0" style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
      Falta migrar el componente Angular <code>app-create-answer</code>.
    </p>
  );
}