"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import {
  loadSurveys, createSurvey, updateSurvey, deleteSurvey, enableSurvey, disableSurvey,
  loadSurveyQuestions, createQuestion, updateQuestion, deleteQuestion,
  loadAnswers, createAnswer, updateAnswer, deleteAnswer
} from "@/lib/services/survey.service";

export default function SurveyPage() {
  const toast = useRef<Toast>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Create survey form
  const [showCreate, setShowCreate] = useState(false);
  const [surveyForm, setSurveyForm] = useState({ title: "", description: "" });
  const [surveyTouched, setSurveyTouched] = useState(false);
  const [surveyToEdit, setSurveyToEdit] = useState<any>(null);

  // Questions panel
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [qForm, setQForm] = useState({ text: "" });
  const [qToEdit, setQToEdit] = useState<any>(null);

  // Answers panel
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [aForm, setAForm] = useState({ text: "" });
  const [aToEdit, setAToEdit] = useState<any>(null);

  // Delete dialogs
  const [surveyToDelete, setSurveyToDelete] = useState<any>(null);
  const [qToDelete, setQToDelete] = useState<any>(null);
  const [aToDelete, setAToDelete] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const resp = await loadSurveys();
      setSurveys(Array.isArray(resp) ? [...resp].reverse() : []);
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudieron cargar las encuestas" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSurveySubmit(e: React.FormEvent) {
    e.preventDefault();
    setSurveyTouched(true);
    if (!surveyForm.title) return;
    setLoadingAction(true);
    try {
      if (surveyToEdit) {
        const resp = await updateSurvey(surveyForm, surveyToEdit.id);
        setSurveys((prev) => prev.map((s) => s.id === surveyToEdit.id ? resp.survey ?? resp : s));
        toast.current?.show({ severity: "success", summary: "Encuesta actualizada" });
      } else {
        const resp = await createSurvey(surveyForm);
        setSurveys((prev) => [resp.survey ?? resp, ...prev]);
        toast.current?.show({ severity: "success", summary: "Encuesta creada" });
      }
      setSurveyForm({ title: "", description: "" }); setSurveyTouched(false); setSurveyToEdit(null); setShowCreate(false);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  async function toggleSurvey(survey: any) {
    try {
      if (survey.is_enabled) { await disableSurvey(survey.id); }
      else { await enableSurvey(survey.id); }
      setSurveys((prev) => prev.map((s) => s.id === survey.id ? { ...s, is_enabled: !s.is_enabled } : s));
    } catch {
      toast.current?.show({ severity: "error", summary: "No se pudo cambiar el estado" });
    }
  }

  async function handleDeleteSurvey() {
    if (!surveyToDelete) return;
    try {
      await deleteSurvey(surveyToDelete.id);
      setSurveys((prev) => prev.filter((s) => s.id !== surveyToDelete.id));
      if (selectedSurvey?.id === surveyToDelete.id) { setSelectedSurvey(null); setQuestions([]); }
      toast.current?.show({ severity: "success", summary: "Encuesta eliminada" });
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar" }); }
    finally { setSurveyToDelete(null); }
  }

  async function selectSurvey(survey: any) {
    setSelectedSurvey(survey);
    setSelectedQuestion(null); setAnswers([]);
    setLoadingQ(true);
    try {
      const resp = await loadSurveyQuestions(survey.id);
      setQuestions(resp.questions ?? resp.survey?.questions ?? []);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudieron cargar las preguntas" }); }
    finally { setLoadingQ(false); }
  }

  async function handleQSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!qForm.text || !selectedSurvey) return;
    setLoadingAction(true);
    try {
      if (qToEdit) {
        const resp = await updateQuestion({ text: qForm.text, survey_id: selectedSurvey.id }, qToEdit.id);
        setQuestions((prev) => prev.map((q) => q.id === qToEdit.id ? resp.question ?? resp : q));
        toast.current?.show({ severity: "success", summary: "Pregunta actualizada" });
      } else {
        const resp = await createQuestion({ text: qForm.text, survey_id: selectedSurvey.id });
        setQuestions((prev) => [...prev, resp.question ?? resp]);
        toast.current?.show({ severity: "success", summary: "Pregunta creada" });
      }
      setQForm({ text: "" }); setQToEdit(null);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleDeleteQ() {
    if (!qToDelete) return;
    try {
      await deleteQuestion(qToDelete.id);
      setQuestions((prev) => prev.filter((q) => q.id !== qToDelete.id));
      if (selectedQuestion?.id === qToDelete.id) { setSelectedQuestion(null); setAnswers([]); }
      toast.current?.show({ severity: "success", summary: "Pregunta eliminada" });
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar" }); }
    finally { setQToDelete(null); }
  }

  async function selectQuestion(q: any) {
    setSelectedQuestion(q);
    setLoadingA(true);
    try {
      const resp = await loadAnswers(q.id);
      setAnswers(resp.answers ?? resp ?? []);
    } catch { toast.current?.show({ severity: "error", summary: "No se pudieron cargar las respuestas" }); }
    finally { setLoadingA(false); }
  }

  async function handleASubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!aForm.text || !selectedQuestion) return;
    setLoadingAction(true);
    try {
      if (aToEdit) {
        const resp = await updateAnswer({ text: aForm.text, question_id: selectedQuestion.id }, aToEdit.id);
        setAnswers((prev) => prev.map((a) => a.id === aToEdit.id ? resp.answer ?? resp : a));
        toast.current?.show({ severity: "success", summary: "Respuesta actualizada" });
      } else {
        const resp = await createAnswer({ text: aForm.text, question_id: selectedQuestion.id });
        setAnswers((prev) => [...prev, resp.answer ?? resp]);
        toast.current?.show({ severity: "success", summary: "Respuesta creada" });
      }
      setAForm({ text: "" }); setAToEdit(null);
    } catch (err: any) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleDeleteA() {
    if (!aToDelete) return;
    try {
      await deleteAnswer(aToDelete.id);
      setAnswers((prev) => prev.filter((a) => a.id !== aToDelete.id));
      toast.current?.show({ severity: "success", summary: "Respuesta eliminada" });
    } catch { toast.current?.show({ severity: "error", summary: "No se pudo eliminar" }); }
    finally { setAToDelete(null); }
  }

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Encuestas</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Encuestas</li>
            </ol>
          </div>
        </div>

        <div className="row">
          {/* Surveys list */}
          <div className="col-12 col-lg-4">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Encuestas</h5>
                <button className="btn btn-sm btn-info" onClick={() => { setShowCreate(true); setSurveyToEdit(null); setSurveyForm({ title: "", description: "" }); setSurveyTouched(false); }}>
                  <i className="mdi mdi-plus" /> Nueva
                </button>
              </div>
              <div className="card-body p-0">
                {loading && <ProgressBar mode="indeterminate" style={{ height: "4px" }} />}
                <ul className="list-group list-group-flush">
                  {surveys.map((survey) => (
                    <li key={survey.id} className={`list-group-item d-flex align-items-center justify-content-between ${selectedSurvey?.id === survey.id ? "bg-light" : ""}`}>
                      <div className="flex-grow-1 pointer" onClick={() => selectSurvey(survey)}>
                        <div className="font-weight-bold">{survey.title}</div>
                        <small className="text-muted">{survey.description}</small>
                      </div>
                      <div className="d-flex gap-1 ml-2">
                        <button className={`btn btn-sm ${survey.is_enabled ? "btn-success" : "btn-warning"}`} title={survey.is_enabled ? "Desactivar" : "Activar"} onClick={() => toggleSurvey(survey)}>
                          <i className={`mdi ${survey.is_enabled ? "mdi-check-circle-outline" : "mdi-close-circle-outline"}`} />
                        </button>
                        <button className="btn btn-sm btn-light" onClick={() => { setSurveyToEdit(survey); setSurveyForm({ title: survey.title, description: survey.description ?? "" }); setShowCreate(true); }}>
                          <i className="mdi mdi-pencil-outline" />
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => setSurveyToDelete(survey)}>
                          <i className="mdi mdi-trash-can-outline" />
                        </button>
                      </div>
                    </li>
                  ))}
                  {!loading && surveys.length === 0 && <li className="list-group-item text-center text-muted">No hay encuestas.</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Questions */}
          {selectedSurvey && (
            <div className="col-12 col-lg-4">
              <div className="card">
                <div className="card-header"><h5 className="mb-0">Preguntas — {selectedSurvey.title}</h5></div>
                <div className="card-body">
                  <form className="d-flex gap-2 mb-3" onSubmit={handleQSubmit}>
                    <input type="text" className="form-control form-control-sm" placeholder="Texto de la pregunta" value={qForm.text} onChange={(e) => setQForm({ text: e.target.value })} />
                    <button disabled={loadingAction || !qForm.text} type="submit" className="btn btn-sm btn-info text-nowrap">
                      {qToEdit ? "Guardar" : "Agregar"}
                    </button>
                    {qToEdit && <button type="button" className="btn btn-sm btn-muted" onClick={() => { setQToEdit(null); setQForm({ text: "" }); }}>×</button>}
                  </form>
                  {loadingQ && <ProgressBar mode="indeterminate" style={{ height: "4px" }} />}
                  <ul className="list-group list-group-flush">
                    {questions.map((q) => (
                      <li key={q.id} className={`list-group-item d-flex align-items-center justify-content-between ${selectedQuestion?.id === q.id ? "bg-light" : ""}`}>
                        <span className="flex-grow-1 pointer" onClick={() => selectQuestion(q)}>{q.text}</span>
                        <div className="d-flex gap-1 ml-2">
                          <button className="btn btn-sm btn-light" onClick={() => { setQToEdit(q); setQForm({ text: q.text }); }}><i className="mdi mdi-pencil-outline" /></button>
                          <button className="btn btn-sm btn-danger" onClick={() => setQToDelete(q)}><i className="mdi mdi-trash-can-outline" /></button>
                        </div>
                      </li>
                    ))}
                    {!loadingQ && questions.length === 0 && <li className="list-group-item text-center text-muted">No hay preguntas.</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Answers */}
          {selectedQuestion && (
            <div className="col-12 col-lg-4">
              <div className="card">
                <div className="card-header"><h5 className="mb-0">Respuestas — {selectedQuestion.text}</h5></div>
                <div className="card-body">
                  <form className="d-flex gap-2 mb-3" onSubmit={handleASubmit}>
                    <input type="text" className="form-control form-control-sm" placeholder="Texto de la respuesta" value={aForm.text} onChange={(e) => setAForm({ text: e.target.value })} />
                    <button disabled={loadingAction || !aForm.text} type="submit" className="btn btn-sm btn-info text-nowrap">
                      {aToEdit ? "Guardar" : "Agregar"}
                    </button>
                    {aToEdit && <button type="button" className="btn btn-sm btn-muted" onClick={() => { setAToEdit(null); setAForm({ text: "" }); }}>×</button>}
                  </form>
                  {loadingA && <ProgressBar mode="indeterminate" style={{ height: "4px" }} />}
                  <ul className="list-group list-group-flush">
                    {answers.map((a) => (
                      <li key={a.id} className="list-group-item d-flex align-items-center justify-content-between">
                        <span className="flex-grow-1">{a.text}</span>
                        <div className="d-flex gap-1 ml-2">
                          <button className="btn btn-sm btn-light" onClick={() => { setAToEdit(a); setAForm({ text: a.text }); }}><i className="mdi mdi-pencil-outline" /></button>
                          <button className="btn btn-sm btn-danger" onClick={() => setAToDelete(a)}><i className="mdi mdi-trash-can-outline" /></button>
                        </div>
                      </li>
                    ))}
                    {!loadingA && answers.length === 0 && <li className="list-group-item text-center text-muted">No hay respuestas.</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Survey Dialog */}
      <Dialog
        header={surveyToEdit ? "Editar encuesta" : "Nueva encuesta"}
        visible={showCreate}
        modal draggable={false} resizable={false}
        style={{ width: "40vw" }}
        onHide={() => { setShowCreate(false); setSurveyToEdit(null); setSurveyForm({ title: "", description: "" }); setSurveyTouched(false); }}
      >
        <form onSubmit={handleSurveySubmit} noValidate>
          <div className="form-group">
            <label><small>Título *</small></label>
            <input type="text" className="form-control" value={surveyForm.title} onChange={(e) => setSurveyForm((p) => ({ ...p, title: e.target.value }))} />
            {surveyTouched && !surveyForm.title && <small className="text-danger">* Obligatorio</small>}
          </div>
          <div className="form-group">
            <label><small>Descripción</small></label>
            <textarea className="form-control" value={surveyForm.description} onChange={(e) => setSurveyForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <button disabled={loadingAction} type="submit" className="btn btn-info btn-block mt-3">
            {loadingAction ? "Guardando..." : (surveyToEdit ? "Guardar cambios" : "Crear encuesta")}
          </button>
        </form>
      </Dialog>

      {/* Delete confirmations */}
      <Dialog header="¿Eliminar encuesta?" visible={!!surveyToDelete} modal draggable={false} resizable={false} style={{ width: "35vw" }} onHide={() => setSurveyToDelete(null)}
        footer={<><button className="btn btn-danger mr-2" onClick={handleDeleteSurvey}>Eliminar</button><button className="btn btn-default" onClick={() => setSurveyToDelete(null)}>Cancelar</button></>}>
        <p>¿Eliminar la encuesta <strong>&quot;{surveyToDelete?.title}&quot;</strong>? Esta acción no se puede deshacer.</p>
      </Dialog>
      <Dialog header="¿Eliminar pregunta?" visible={!!qToDelete} modal draggable={false} resizable={false} style={{ width: "35vw" }} onHide={() => setQToDelete(null)}
        footer={<><button className="btn btn-danger mr-2" onClick={handleDeleteQ}>Eliminar</button><button className="btn btn-default" onClick={() => setQToDelete(null)}>Cancelar</button></>}>
        <p>¿Eliminar la pregunta <strong>&quot;{qToDelete?.text}&quot;</strong>?</p>
      </Dialog>
      <Dialog header="¿Eliminar respuesta?" visible={!!aToDelete} modal draggable={false} resizable={false} style={{ width: "35vw" }} onHide={() => setAToDelete(null)}
        footer={<><button className="btn btn-danger mr-2" onClick={handleDeleteA}>Eliminar</button><button className="btn btn-default" onClick={() => setAToDelete(null)}>Cancelar</button></>}>
        <p>¿Eliminar la respuesta <strong>&quot;{aToDelete?.text}&quot;</strong>?</p>
      </Dialog>
    </>
  );
}
