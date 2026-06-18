"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ProgressBar } from "primereact/progressbar";
import { getReceipts, getReceiptPDF, sendToFirm } from "@/lib/services/receipts.service";

const RRHH_CUILS = ["20306493478", "20363027653"];

export default function ReceiptsPage() {
  const toast = useRef<Toast>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [cuilSearch, setCuilSearch] = useState("");
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [isBossRRHH] = useState(() => RRHH_CUILS.includes(localStorage.getItem("user") ?? ""));

  // Confirm send-to-firm modal
  const [confirmReceipt, setConfirmReceipt] = useState<any>(null);
  const [loadingSendFirm, setLoadingSendFirm] = useState(false);

  useEffect(() => { chargeReceipts(); }, []);

  function handleCuilChange(value: string) {
    setCuilSearch(value);
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => chargeReceipts(value), 1000);
  }

  async function chargeReceipts(cuil = cuilSearch) {
    setLoading(true);
    setErrMessage(null);
    try {
      const resp = await getReceipts(cuil);
      const original: any[] = resp.message.original;
      original.forEach((element: any, index: number) => {
        const year = original[index].year;
        original[index] = Object.values(element);
        (original[index] as any).year = year;
      });
      setReceipts(original);
    } catch (err: any) {
      setErrMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openPDF(receiptData: any) {
    if (loadingAction) return;
    setLoadingAction(true);
    try {
      const buffer = await getReceiptPDF(receiptData.idn, cuilSearch);
      const blob = new Blob([buffer], { type: "application/pdf" });
      window.open(URL.createObjectURL(blob));
    } catch {
      toast.current?.show({ severity: "error", summary: "Hubo un problema", detail: "No existe el archivo de esta liquidación." });
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleSendToFirm() {
    if (!confirmReceipt) return;
    setLoadingSendFirm(true);
    try {
      await sendToFirm(confirmReceipt.idn, cuilSearch);
      toast.current?.show({ severity: "success", summary: "Recibo enviado para firmar", detail: "Ya se le informó a RRHH para que firmen su recibo." });
      setConfirmReceipt(null);
    } catch {
      toast.current?.show({ severity: "info", summary: "Ya se envió el recibo a firmar." });
      setConfirmReceipt(null);
    } finally {
      setLoadingSendFirm(false);
    }
  }

  const filteredReceipts = receipts.filter((r: any) => !yearFilter || String((r as any).year).includes(yearFilter));

  const firmFooter = (
    <div>
      <button disabled={loadingSendFirm} onClick={handleSendToFirm} className="btn btn-primary waves-effect">
        {loadingSendFirm && <i className="mr-1 pi pi-spin pi-spinner" />}
        {loadingSendFirm ? "Enviando" : "Enviar"}
      </button>
      <button disabled={loadingSendFirm} onClick={() => setConfirmReceipt(null)} className="btn btn-default ml-2">Cancelar</button>
      {loadingSendFirm && <ProgressBar mode="indeterminate" style={{ height: "6px" }} className="mt-2" />}
    </div>
  );

  return (
    <>
      <Toast ref={toast} position="bottom-center" />

      <div className="fadeIn animated">
        <div className="row page-titles">
          <div className="col-md-5 align-self-center">
            <h3 className="text-themecolor">Recibos</h3>
          </div>
          <div className="col-md-7 align-self-center">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
              <li className="breadcrumb-item">Recibos</li>
            </ol>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="card card-body">
              {isBossRRHH && (
                <div className="animated fadeIn mb-3 row">
                  <div className="col-12 col-md-5">
                    <label>Buscar recibos por CUIL</label>
                    <input
                      className="form-control form-control-sm"
                      type="number"
                      value={cuilSearch}
                      onChange={(e) => handleCuilChange(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {loading && (
                <div className="animated fadeIn mb-2">
                  <i className="pi pi-spin pi-spinner" /> Cargando recibos
                </div>
              )}

              {/* Year filter */}
              <div className="row mb-2">
                <div className="col-12 col-md-3">
                  <input
                    className="form-control form-control-sm"
                    type="number"
                    placeholder="Filtrar por año"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                  />
                </div>
              </div>

              <table className="table table-sm table-striped fadeIn animated">
                <thead>
                  <tr>
                    <th style={{ width: "22.5%" }}>AÑO</th>
                    <th>MES</th>
                    <th style={{ width: "50%", textAlign: "left" }}>DESCRIPCIÓN</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((receipt: any) =>
                    (receipt as any[]).map((receiptData: any, idx: number) =>
                      receiptData.label ? (
                        <tr key={`${(receipt as any).year}-${idx}`} className="fadeIn animated">
                          <td>{(receipt as any).year}</td>
                          <td>{receiptData.interval}</td>
                          <td style={{ textAlign: "left" }}>{receiptData.label}</td>
                          <td>
                            {receiptData.status == null && (((receipt as any).year == 2022 && receiptData.interval >= 2) || (receipt as any).year > 2022) && (
                              <button disabled={loadingAction} onClick={() => setConfirmReceipt(receiptData)} className="btn btn-secondary btn-circle" title="Solicitar firma">
                                <i className="mdi mdi-feather" />
                              </button>
                            )}
                            {receiptData.status != null && (
                              <button className={`btn btn-circle fadeIn animated mr-1 ${receiptData.status == 0 ? "btn-info" : "btn-success"}`} title={receiptData.status == 0 ? "En espera de firma" : "Firmado"}>
                                <i className={`mdi ${receiptData.status == 0 ? "mdi-timer-sand" : "mdi-check"}`} />
                              </button>
                            )}
                            <button disabled={loadingAction} className="btn btn-secondary btn-circle ml-md-2 mt-1 mt-md-0" onClick={() => openPDF(receiptData)} title="Visualizar">
                              <i className={loadingAction ? "pi pi-spin pi-spinner" : "fa fa-eye"} />
                            </button>
                          </td>
                        </tr>
                      ) : null
                    )
                  )}
                </tbody>
              </table>

              {errMessage && (
                <div className="col-12 col-md-6 fadeIn animated">
                  <i className="fa fa-exclamation-circle text-info" /> {errMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        header="¿Solicitar firma para este recibo?"
        visible={!!confirmReceipt}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "40vw" }}
        onHide={() => setConfirmReceipt(null)}
        footer={firmFooter}
      >
        <p>Se enviará el recibo <strong>{confirmReceipt?.label}</strong> para ser firmado por RRHH.</p>
      </Dialog>
    </>
  );
}
