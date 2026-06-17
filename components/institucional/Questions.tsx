"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { loadSurveys, loadSurveysWithMyResponse, sendSurveyAnswer, loadSurveyReport } from "@/lib/services/questions.service";

ChartJS.register(ArcElement, Tooltip, Legend);

const BG_COLORS = [
  "rgba(196,122,192,0.2)", "rgba(255,199,89,0.2)", "rgba(35,206,107,0.2)", "rgba(231,29,54,0.2)",
  "rgba(65,34,52,0.2)", "rgba(184,180,45,0.2)", "rgba(156,175,183,0.2)", "rgba(241,171,134,0.2)",
];
const BORDER_COLORS = [
  "rgb(196,122,192)", "rgb(255,199,89)", "rgb(35,206,107)", "rgb(231,29,54)",
  "rgb(65,34,52)", "rgb(184,180,45)", "rgb(156,175,183)", "rgb(241,171,134)",
];

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: "top" as const, labels: { usePointStyle: true } },
  },
};

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsLogged(!!localStorage.getItem("token"));
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await loadSurveys();
      console.log("[Questions] loadSurveys response:", data);
      if (!data || data.length === 0) { setIsLoading(false); return; }
      const first = data[0];
      setSurveys(data);
      setSurveyIndex(0);
      setQuestionIndex(0);
      setDataSend({ id: first.id, questions: [{ id: first.questions[0]?.id, answers: [] }] });

      if (localStorage.getItem("token")) {
        try {
          const withResponse = await loadSurveysWithMyResponse();
          const finishedIds = new Set<any>();
          withResponse.forEach((sr: any) => {
            sr.questions?.forEach((q: any) => {
              if (q.people_answers?.length > 0) finishedIds.add(sr.id);
            });
          });
          if (finishedIds.size > 0) {
            setSurveys((prev) => {
              const updated = [...prev];
              finishedIds.forEach((id) => {
                const idx = updated.findIndex((s: any) => s.id === id);
                if (idx !== -1) updated[idx] = { ...updated[idx], isFinishedForUser: true };
              });
              return updated;
            });
            finishedIds.forEach((id) => addReport(id));
          }
        } catch { /* no bloquear si falla la carga de respuestas del usuario */ }
      }
    } catch (err) {
      console.error("[Questions] loadData error:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const addReport = async (surveyId: string) => {
    setIsLoadingChart(true);
    try {
      const report = await loadSurveyReport(surveyId);

      const questions: any[] = report.questions ?? report.data?.questions ?? [];
      const charts = questions.map((q: any) => {
        const labelMap: Record<string, number> = {};
        q.people_answers?.forEach((pa: any) => {
          const label = pa.answer?.value ?? String(pa.answer_id);
          labelMap[label] = (labelMap[label] || 0) + 1;
        });
        const labels = Object.keys(labelMap);
        const data = Object.values(labelMap);
        return {
          title: q.name,
          itemsChart: {
            labels,
            datasets: [{ label: "Veces seleccionada", data, backgroundColor: BG_COLORS.slice(0, labels.length), borderColor: BORDER_COLORS.slice(0, labels.length), borderWidth: 1 }],
          },
        };
      });
      setSurveys((prev) => prev.map((s) => String(s.id) === String(surveyId) ? { ...s, charts } : s));
    } catch (err) {
      console.error("[Questions] addReport error:", err);
      setSurveys((prev) => prev.map((s) => String(s.id) === String(surveyId) ? { ...s, charts: [] } : s));
    }
    setIsLoadingChart(false);
  };

  const survey = surveys[surveyIndex];
  if (isLoading) return null;
  if (hasError) return (
    <div className="mb-1 row px-2">
      <div className="card col-12 p-2 text-white" style={{ backgroundColor: "#4B5667", borderRadius: "15px" }}>
        <small className="text-center py-2">No se pudieron cargar las encuestas</small>
      </div>
    </div>
  );
  if (!survey) return null;

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
      await addReport(survey.id);
    } catch {
      showToast("No se pudieron enviar sus respuestas de la encuesta");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {toastMsg && (
        <div style={{ position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#ff182b", color: "#fff", padding: "12px 24px", borderRadius: "8px", zIndex: 9999, fontSize: "0.9rem" }}>
          {toastMsg}
        </div>
      )}

      <div className="mb-1 parpadeo row px-2">
        <div className="card col-12 p-2 pb-4 text-white" style={{ backgroundColor: "#4B5667", borderRadius: "15px", position: "relative" }}>
          {surveys.length > 1 && (
            <button className="survey-arrow survey-arrow-left" onClick={() => changeSurvey(-1)}>
              <i className="fa fa-chevron-left" />
            </button>
          )}
          {surveys.length > 1 && (
            <button className="survey-arrow survey-arrow-right" onClick={() => changeSurvey(1)}>
              <i className="fa fa-chevron-right" />
            </button>
          )}

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
                      <br />
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
                      <button disabled={answers.length === 0} className="border-0 btn btn-block" style={{ backgroundColor: "#E2E6EA" }} onClick={nextQuestion}>
                        Siguiente
                      </button>
                    )}
                    {isLogged && survey.questions?.length === questionIndex + 1 && (
                      <button disabled={answers.length === 0} className="border-0 btn btn-block text-white" style={{ backgroundColor: "#ff182b" }} onClick={sendSurvey}>
                        {isSending ? "Enviando sus respuestas" : "Finalizar"}
                      </button>
                    )}
                    {!isLogged && (
                      <button className="border-0 btn btn-block" style={{ backgroundColor: "#E2E6EA" }} onClick={() => { localStorage.setItem("redirect-questions", "/institucional"); router.push("/auth/login"); }}>
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
                  {(isLoadingChart || !survey.charts) ? (
                    <p className="animated fadeIn">
                      <i className="mr-1 pi pi-spin pi-spinner" /> Cargando gráfico
                    </p>
                  ) : survey.charts.length === 0 ? (
                    <p className="animated fadeIn"><small>Sin resultados disponibles</small></p>
                  ) : (
                    survey.charts.map((chart: any, ci: number) => (
                      <div key={ci} className="chart-container">
                        <h6 className="mb-3 pb-0 text-white" dangerouslySetInnerHTML={{ __html: chart.title }} />
                        <Pie data={chart.itemsChart} options={CHART_OPTIONS} />
                      </div>
                    ))
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .chart-container {
          position: relative;
          width: 100%;
          height: auto;
          margin-bottom: 20px;
        }
        .survey-arrow {
          position: absolute;
          top: 50px;
          transform: translateY(-50%);
          z-index: 10;
          background: rgba(255,255,255,0.15);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s;
          padding: 0;
        }
        .survey-arrow:hover {
          background: rgba(255,255,255,0.3);
        }
        .survey-arrow-left  { left: 6px; }
        .survey-arrow-right { right: 6px; }
      `}</style>
    </>
  );
}
