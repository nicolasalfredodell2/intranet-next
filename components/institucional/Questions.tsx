"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadSurveys, loadSurveysWithMyResponse, sendSurveyAnswer, loadSurveyReport } from "@/lib/services/questions.service";

export default function Questions() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [surveyIndex, setSurveyIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [dataSend, setDataSend] = useState<any>(null);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    setIsLogged(!!localStorage.getItem("token"));
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await loadSurveys();
      if (!data || data.length === 0) { setIsLoading(false); return; }
      const first = data[0];
      setSurveys(data);
      setSurveyIndex(0);
      setQuestionIndex(0);
      setDataSend({ id: first.id, questions: [{ id: first.questions[0]?.id, answers: [] }] });

      const token = localStorage.getItem("token");
      if (token) {
        const withResponse = await loadSurveysWithMyResponse();
        setSurveys((prev) => {
          const updated = [...prev];
          withResponse.forEach((sr: any) => {
            sr.questions.forEach((q: any) => {
              if (q.people_answers?.length > 0) {
                const idx = updated.findIndex((s: any) => s.id === sr.id);
                if (idx !== -1) updated[idx] = { ...updated[idx], isFinishedForUser: true };
              }
            });
          });
          return updated;
        });
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const survey = surveys[surveyIndex];
  if (isLoading || hasError || !survey) return null;

  const question = survey.questions?.[questionIndex];
  const answers = dataSend?.questions?.[questionIndex]?.answers ?? [];

  const setAnswer = (checked: boolean, answer: any) => {
    setDataSend((prev: any) => {
      const qs = [...prev.questions];
      if (checked) qs[questionIndex] = { ...qs[questionIndex], answers: [...qs[questionIndex].answers, answer.answer.id] };
      else qs[questionIndex] = { ...qs[questionIndex], answers: qs[questionIndex].answers.filter((a: any) => a !== answer.answer.id) };
      return { ...prev, questions: qs };
    });
  };

  const nextQuestion = () => {
    const ni = questionIndex + 1;
    setQuestionIndex(ni);
    setDataSend((prev: any) => ({ ...prev, questions: [...prev.questions, { id: survey.questions[ni]?.id, answers: [] }] }));
  };

  const changeSurvey = (offset: number) => {
    let ni = surveyIndex + offset;
    if (ni < 0) ni = surveys.length - 1;
    if (ni >= surveys.length) ni = 0;
    setSurveyIndex(ni);
    setQuestionIndex(0);
    const s = surveys[ni];
    setDataSend({ id: s.id, questions: [{ id: s.questions[0]?.id, answers: [] }] });
  };

  const sendSurvey = async () => {
    setIsSending(true);
    try {
      for (const q of dataSend.questions) {
        for (const answerId of q.answers) {
          await sendSurveyAnswer({ question_id: q.id, answer_id: answerId });
        }
      }
      setSurveys((prev) => prev.map((s, i) => i === surveyIndex ? { ...s, isFinishedForUser: true } : s));
      // Load chart
      setIsLoadingChart(true);
      try {
        const report = await loadSurveyReport(survey.id);
        const charts = report.questions?.map((q: any) => {
          const counts: Record<string, number> = {};
          const labels: string[] = [];
          const data: number[] = [];
          q.people_answers?.forEach((pa: any) => { counts[pa.answer_id] = (counts[pa.answer_id] || 0) + 1; });
          q.question_answers?.forEach((qa: any) => { labels.push(qa.answer.value); data.push(counts[qa.answer.id] || 0); });
          return { title: q.name, labels, data };
        });
        setSurveys((prev) => prev.map((s, i) => i === surveyIndex ? { ...s, charts } : s));
      } catch { /* silent */ }
      setIsLoadingChart(false);
    } catch {
      alert("No se pudieron enviar sus respuestas");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mb-1 parpadeo row px-2">
      <div className="card col-12 p-2 text-white" style={{ backgroundColor: "#4B5667", borderRadius: "15px" }}>
        {!survey.isFinishedForUser ? (
          <div className="row">
            {survey.name?.length < 45 && (
              <div className="col-12 mt-2 text-center">
                <h5 className="h5">{survey.name}</h5>
                <hr />
              </div>
            )}

            <div className="col-12">
              <div className="row">
                <div className="col-12">
                  <h6 className="h6 text-center">
                    {survey.name?.length >= 45 && (
                      <i className="fa fa-bullhorn my-2" title={survey.name} style={{ color: "#ff182b", fontSize: "1.5rem" }} />
                    )}
                    <p><strong dangerouslySetInnerHTML={{ __html: question?.name }} /></p>
                  </h6>
                  <hr />

                  {question?.question_answers?.map((qa: any) => (
                    <div key={qa.id} className="animated col-12 fadeIn d-flex align-items-center mb-1">
                      <input
                        type="checkbox"
                        id={`ans-${qa.id}`}
                        disabled={!isLogged}
                        onChange={(e) => setAnswer(e.target.checked, qa)}
                      />
                      <label htmlFor={`ans-${qa.id}`} className="ml-2 mb-0 text-white" style={{ cursor: "pointer" }}>
                        <small>{qa.answer.value}</small>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="col-12 mt-3">
                  {isLogged && survey.questions?.length !== questionIndex + 1 && (
                    <button
                      disabled={answers.length === 0}
                      className="border-0 btn btn-block"
                      style={{ backgroundColor: "#E2E6EA" }}
                      onClick={nextQuestion}
                    >
                      Siguiente
                    </button>
                  )}
                  {isLogged && survey.questions?.length === questionIndex + 1 && (
                    <button
                      disabled={answers.length === 0}
                      className="border-0 btn btn-block text-white"
                      style={{ backgroundColor: "#ff182b" }}
                      onClick={sendSurvey}
                    >
                      {isSending ? "Enviando sus respuestas" : "Finalizar"}
                    </button>
                  )}
                  {!isLogged && (
                    <button
                      className="border-0 btn btn-block"
                      style={{ backgroundColor: "#E2E6EA" }}
                      onClick={() => { localStorage.setItem("redirect-questions", "/institucional"); router.push("/auth/login"); }}
                    >
                      <small>Haz clic para iniciar sesión <br /> y responder las encuestas</small>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 col-12">
            <div className="row">
              <div className="col-12">
                <h6 className="h6 text-center">Ya respondió esta encuesta</h6>
                <hr />
              </div>

              <div className="animated fadeIn col-12 my-2 text-center">
                {isLoadingChart ? (
                  <p className="animated fadeIn">
                    <i className="mr-1 pi pi-spin pi-spinner" /> Cargando gráfico
                  </p>
                ) : (
                  survey.charts?.map((chart: any, ci: number) => (
                    <div key={ci} className="mb-3">
                      <h6 className="mb-2 text-white" dangerouslySetInnerHTML={{ __html: chart.title }} />
                      <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
                        {chart.labels?.map((label: string, li: number) => (
                          <div key={li} className="d-flex justify-content-between px-2 mb-1">
                            <span>{label}</span>
                            <span className="font-weight-bold">{chart.data[li]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {surveys.length > 1 && (
                <div className="col-12">
                  <div className="row">
                    <div className="col-6">
                      <button className="border-0 btn btn-block" style={{ backgroundColor: "#E2E6EA" }} onClick={() => changeSurvey(-1)}>Anterior</button>
                    </div>
                    <div className="col-6">
                      <button className="border-0 btn btn-block" style={{ backgroundColor: "#E2E6EA" }} onClick={() => changeSurvey(1)}>Siguiente</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
