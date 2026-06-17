"use client";

import { useState, useRef, useCallback } from "react";
import { getInternals } from "@/lib/services/internal.service";

export default function Internal() {
  const [search, setSearch] = useState("");
  const [internals, setInternals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchInternals = useCallback(async (value: string) => {
    if (!value.trim()) {
      setInternals([]);
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const data = await getInternals(value.trim());
      setInternals(data.filter((u: any) => u.internal && u.internal !== 0));
    } catch {
      setInternals([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value !== search) setLoading(true);
    debounceRef.current = setTimeout(() => fetchInternals(value), 1000);
  };

  return (
    <div className="row px-0 px-md-2 row-main">
      <div className="col-md-12" style={{ backgroundColor: "#4B5667", borderRadius: "10px" }}>
        <div className="mt-2 row">

          <div className="col-12 text-center">
            <h5 style={{ color: "#FFF" }}>
              <i className="fa fa-phone mr-2" style={{ fontSize: "14px" }} />
              <span style={{ fontWeight: 700, fontSize: "16px", lineHeight: "18px" }}>AGENDA</span>
            </h5>
          </div>

          <div className="col-12 search-container pt-4" style={{ backgroundColor: "#D8DBE2", borderTopLeftRadius: "15px", borderTopRightRadius: "15px" }}>
            <i className="fa fa-search search-icon" />
            <input
              className="form-control form-control-sm search-with-icon"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyUp={onKeyUp}
              id="inputSearch"
              placeholder="Busque por apellido"
              autoComplete="off"
            />
          </div>

          <div className="col-12 list-internals py-3 scrollable" style={{ backgroundColor: "#D8DBE2", borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px" }}>

            {loading && (
              <p className="animated fadeIn text-center">
                <i className="mr-1 pi pi-spin pi-spinner" style={{ fontWeight: "normal", fontSize: "14px", lineHeight: "16px" }} />
                <small>Buscando en la agenda</small>
              </p>
            )}

            {!loading && !error && (
              <div className="animated fadeIn">
                {internals.map((internal: any, i: number) => {
                  const isLast = i === internals.length - 1;
                  const hasOverflow = internal.internal && String(internal.internal).length > 10;
                  return (
                    <div key={internal.id ?? i} className={`bg-white px-3${!isLast ? " mb-3" : ""}`}>
                      {internals.length > 0 && (
                        <div className={`internal pointer row${internals.length !== i + 1 ? " mb-1" : ""}`}>
                          <div className="col-9">
                            <p className="m-0 p-0">
                              <small><strong>{internal.lastname_name}</strong></small>
                            </p>
                          </div>
                          <div className="col-3 m-0 p-0 text-center text-overflow-container">
                            <div className={hasOverflow ? "text-overflow" : ""}>
                              <small><strong>{internal.internal}</strong></small>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && error && (
              <div className="alert alert-info animated fadeIn">
                No se pudo cargar la agenda.
              </div>
            )}

          </div>
        </div>
      </div>

      <style jsx>{`
        input {
          border: none !important;
        }

        .list-internals {
          overflow-y: auto;
        }

        .text-overflow-container {
          overflow: hidden;
          text-overflow: clip;
        }

        .text-overflow {
          animation: slide 7.5s linear infinite;
          white-space: nowrap;
        }

        @keyframes slide {
          0%   { transform: translateX(0%); }
          50%  { transform: translateX(-25%); }
          100% { transform: translateX(0%); }
        }

        .search-container {
          position: relative;
          width: 100%;
        }

        .search-container .search-icon {
          position: absolute;
          left: 25px;
          top: 55%;
          color: #6b7280;
          font-size: 0.9rem;
          pointer-events: none;
        }

        .search-container input {
          border-radius: 13px;
          padding-left: 38px;
          text-align: left;
        }

        .search-container input::placeholder {
          text-align: left;
        }

        @media (max-width: 1000px) {
          .row-main {
            padding-left: 41px;
            padding-right: 41px;
          }
        }
      `}</style>
    </div>
  );
}
