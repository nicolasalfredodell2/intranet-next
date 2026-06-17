"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAreaInfo } from "@/lib/services/areas.service";

export default function AreaPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [area, setArea] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [carouselIndices, setCarouselIndices] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!id) return;
    getAreaInfo(id)
      .then((data) => { setArea(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const goBack = () => { window.scrollTo(0, 0); router.push("/institucional"); };

  const getMediaItems = (info: any) => {
    const images = (info?.images || []).map((img: any) => ({ ...img, type: "image" }));
    const videos = (info?.videos || []).map((vid: any) => ({ ...vid, type: "video" }));
    return [...images, ...videos];
  };

  const setCarouselIdx = (infoIdx: number, fn: (i: number, max: number) => number) => {
    const info = area?.info_areas?.[infoIdx];
    const media = getMediaItems(info);
    setCarouselIndices((prev) => ({ ...prev, [infoIdx]: fn(prev[infoIdx] ?? 0, media.length) }));
  };

  return (
    <div className="row text-justify">
      {loading && (
        <div className="animate__animated animate__fadeIn area col-12 mb-3 p-4 rounded">
          {[32, 20, 350, 20, 20, 20].map((h, i) => (
            <div key={i} className="skeleton mb-2" style={{ height: h, width: i === 1 ? 180 : "100%" }} />
          ))}
        </div>
      )}

      {!loading && area && (
        <div className="animate__animated animate__fadeIn area col-12 mb-3 p-4 rounded">
          <div className="d-lg-flex row">
            {area.info_areas?.map((info: any, infoIdx: number) => {
              const media = getMediaItems(info);
              const cidx = carouselIndices[infoIdx] ?? 0;

              return (
                <div key={infoIdx} className="col-12 mb-2 mb-lg-0">
                  <h2 className="h2 mb-2 area-title text-dark">{area.title}</h2>
                  <h3 className="h6 my-4 text-dark area-intro">{info?.introduction}</h3>

                  {media.length > 0 && (
                    <div className="my-5 row">
                      <div className="col-12">
                        <div style={{ position: "relative" }}>
                          <div className="d-flex justify-content-center align-items-center w-100">
                            {media[cidx]?.type === "image" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={media[cidx].url} alt={info?.title} className="carousel-img" />
                            ) : (
                              <video className="carousel-video" controls>
                                <source src={media[cidx].url} type="video/mp4" />
                                Tu navegador no soporta el elemento de video.
                              </video>
                            )}
                          </div>

                          {media.length > 1 && (
                            <>
                              <button
                                className="carousel-ctrl left"
                                onClick={() => setCarouselIdx(infoIdx, (i, max) => (i > 0 ? i - 1 : max - 1))}
                              >
                                <span className="carousel-control-prev-icon" />
                              </button>
                              <button
                                className="carousel-ctrl right"
                                onClick={() => setCarouselIdx(infoIdx, (i, max) => (i < max - 1 ? i + 1 : 0))}
                              >
                                <span className="carousel-control-next-icon" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className="text-justify text-note px-2 px-lg-0 text-dark new-description"
                    dangerouslySetInnerHTML={{ __html: info?.text }}
                  />

                  {infoIdx < area.info_areas.length - 1 && <hr />}
                </div>
              );
            })}
          </div>

          <div className="mt-5 row">
            <div className="col-12 d-flex justify-content-end">
              <button
                onClick={goBack}
                className="border-0 btn btn-back px-4 py-2 text-dark mt-3 mt-md-0"
                style={{ backgroundColor: "#E2E6EA", borderRadius: 25 }}
              >
                <strong>
                  <i className="mdi mdi-arrow-left mr-2" style={{ fontSize: "1.25rem" }} />
                  Volver
                </strong>
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !area && (
        <div className="col-12 alert alert-info">
          <h5>No se pudo cargar la información del área.</h5>
          <button onClick={goBack} className="border-0 btn px-4 py-2 text-dark mt-2" style={{ backgroundColor: "#E2E6EA", borderRadius: 25 }}>
            <strong><i className="mdi mdi-arrow-left mr-2" />Volver</strong>
          </button>
        </div>
      )}

      <style jsx>{`
        .skeleton { background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .area-title { font-size: clamp(24px, 3vw, 38px) !important; font-weight: 700 !important; line-height: clamp(28px, 3.5vw, 42px) !important; }
        .area-intro { font-size: clamp(20px, 2vw, 15px) !important; font-weight: 500 !important; line-height: clamp(28px, 3.5vw, 25px) !important; }
        .text-note { font-size: clamp(16px, 2vw, 16px) !important; font-weight: 400 !important; line-height: clamp(25px, 2.5vw, 25px) !important; }
        .carousel-img { width: 100%; aspect-ratio: 16/9; height: auto; border-radius: 8px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .carousel-video { width: 100%; aspect-ratio: 16/9; height: auto; border-radius: 8px; border: 1px solid #e2e8f0; object-fit: contain; background-color: #000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .carousel-ctrl {
          position: absolute;
          top: 50%; transform: translateY(-50%);
          background-color: rgba(101,113,135,1);
          border-radius: 50%;
          border: none;
          cursor: pointer;
          width: 45px; height: 45px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.3s;
          margin: 0 20px;
        }
        .carousel-ctrl.left { left: 0; }
        .carousel-ctrl.right { right: 0; }
        .carousel-ctrl:hover { transform: translateY(-50%) scale(1.1); }
        .btn-back { box-shadow: rgba(99,99,99,0.2) 0px 2px 8px 0px; }
        hr { border: 0; border-top: 1px solid #4B5667; opacity: 1; margin: 2rem 0; }
      `}</style>
    </div>
  );
}
