"use client";

import { useEffect, useState } from "react";
import { getN8nHistory } from "@/lib/services/n8n.service";

interface GroupedContact {
  phone: string;
  messages: { id: number; content: string; type: string }[];
}

function groupByPhone(messages: any[]): GroupedContact[] {
  const grouped: GroupedContact[] = [];
  messages.forEach((item) => {
    const existing = grouped.find((g) => g.phone === item.session_id);
    const msg = { id: item.id, content: item.message.content, type: item.message.type };
    if (existing) existing.messages.push(msg);
    else grouped.push({ phone: item.session_id, messages: [msg] });
  });
  return grouped;
}

export default function N8nPage() {
  const [contacts, setContacts] = useState<GroupedContact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const resp = await getN8nHistory();
      setContacts(groupByPhone(resp));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animated fadeIn">
      <div className="row page-titles">
        <div className="align-self-center col-md-5">
          <h3 className="text-themecolor">Historial N8N</h3>
        </div>
        <div className="align-self-center col-md-7">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="javascript:void(0)">Inicio</a></li>
            <li className="breadcrumb-item">Historial N8N</li>
          </ol>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="card card-body">
            {loading ? (
              <div className="animated fadeIn">
                <i className="pi pi-spin pi-spinner" /> Cargando historial de mensajes
              </div>
            ) : (
              <div className="animated fadeIn accordion" id="n8nAccordion">
                {contacts.map((contact) => (
                  <div key={contact.phone} className="animated fadeIn card m-0 p-0">
                    <div className="card-header" style={{ backgroundColor: "#657187", borderRadius: 0 }}>
                      <h2 className="mb-0">
                        <button
                          className="btn btn-link btn-block text-left text-white"
                          style={{ textDecoration: "none" }}
                          type="button"
                          data-toggle="collapse"
                          data-target={`#item-${contact.phone}`}
                          aria-expanded="false"
                        >
                          Teléfono {contact.phone}
                        </button>
                      </h2>
                    </div>

                    <div id={`item-${contact.phone}`} className="collapse" data-parent="#n8nAccordion">
                      {contact.messages.map((msg, idx) => (
                        <div key={msg.id} className={`card-body mb-0 pb-0 ${idx > 0 ? "mt-0 pt-0" : ""}`}>
                          <p className="my-0 py-0"><strong>ID Mensaje: </strong>{msg.id}</p>
                          <p className="my-0 py-0"><strong>Tipo: </strong>{msg.type}</p>
                          <p className="my-0 py-0"><strong>Contenido: </strong><span style={{ whiteSpace: "pre-line" }}>{msg.content}</span></p>
                          {idx < contact.messages.length - 1 && <hr />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
