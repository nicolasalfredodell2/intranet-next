"use client";

import { useState, useEffect, useCallback } from "react";
import { formatTimeAgo } from "@/lib/utils/time";
import { likeShort, dislikeShort } from "@/lib/services/shorts.service";

interface ShortsProps {
  shorts: any[];
}

export default function Shorts({ shorts: initialShorts }: ShortsProps) {
  const [shorts, setShorts] = useState(initialShorts.map((s) => ({ ...s, isPlaying: false, isExpanded: false, user_liked: s.user_liked ?? false })));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [numVisible, setNumVisible] = useState(3);

  const checkScreenSize = useCallback(() => {
    const w = window.innerWidth;
    const nv = w <= 560 ? 1 : w <= 992 ? 2 : 3;
    setNumVisible(nv);
    setCurrentIndex((i) => Math.max(0, Math.min(i, shorts.length - nv)));
  }, [shorts.length]);

  useEffect(() => {
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [checkScreenSize]);

  useEffect(() => {
    setShorts(initialShorts.map((s) => ({ ...s, isPlaying: false, isExpanded: false, user_liked: s.user_liked ?? false })));
  }, [initialShorts]);

  if (!shorts || shorts.length === 0) return null;

  const visibleShorts = shorts.slice(currentIndex, currentIndex + numVisible);
  const dotsCount = Math.max(0, shorts.length - numVisible + 1);

  const stopAll = () => setShorts((prev) => prev.map((s) => ({ ...s, isPlaying: false })));

  const next = () => {
    stopAll();
    setCurrentIndex((i) => (i < shorts.length - numVisible ? i + 1 : 0));
  };

  const prev = () => {
    stopAll();
    setCurrentIndex((i) => (i > 0 ? i - 1 : shorts.length - numVisible));
  };

  const playVideo = (id: string) => {
    setShorts((prev) => prev.map((s) => ({ ...s, isPlaying: s.id === id })));
  };

  const toggleExpand = (id: string) => {
    setShorts((prev) =>
      prev.map((s) => s.id === id ? { ...s, isExpanded: !s.isExpanded } : s)
    );
  };

  const hoverExpand = (id: string) => {
    setShorts((prev) => prev.map((s) => s.id === id ? { ...s, isExpanded: true } : s));
  };

  const hoverCollapse = (id: string) => {
    setShorts((prev) => prev.map((s) => s.id === id ? { ...s, isExpanded: false } : s));
  };

  const toggleLike = async (short: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (short.isProcessing) return;

    setShorts((prev) => prev.map((s) => s.id === short.id ? { ...s, isProcessing: true } : s));
    try {
      if (short.user_liked) {
        await dislikeShort(short.id);
        setShorts((prev) => prev.map((s) => s.id === short.id ? { ...s, user_liked: false, likes_count: Math.max(0, (s.likes_count || 1) - 1), isProcessing: false } : s));
      } else {
        await likeShort(short.id);
        setShorts((prev) => prev.map((s) => s.id === short.id ? { ...s, user_liked: true, likes_count: (s.likes_count || 0) + 1, isProcessing: false } : s));
      }
    } catch {
      setShorts((prev) => prev.map((s) => s.id === short.id ? { ...s, isProcessing: false } : s));
    }
  };

  return (
    <div className="shorts-carousel-container position-relative py-3">
      {shorts.length > numVisible && (
        <button className="nav-btn left" onClick={prev}>
          <i className="fas fa-chevron-left" />
        </button>
      )}

      <div className="row row-main">
        {visibleShorts.map((short: any) => (
          <div key={short.id} className="animated col-12 col-sm-6 col-lg-4 fadeIn mx-0 px-3 px-lg-2 short-item-container">
            <div className="card w-100 short-card border" style={{ boxShadow: "rgba(255,255,255,0.1) 0px 1px 1px 0px inset, rgba(50,50,93,0.25) 0px 50px 100px -20px, rgba(0,0,0,0.3) 0px 30px 60px -30px" }}>
              <div className="card-body p-2 d-flex flex-column h-100 bg-white">

                <div className="media-container" style={{ aspectRatio: short.isExpanded ? "4/4" : "4/5" }}>
                  {!short.isPlaying ? (
                    <div className="thumbnail-wrapper h-100 w-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        onClick={() => playVideo(short.id)}
                        className="img-new w-100 h-100 pointer"
                        style={{ objectFit: "cover" }}
                        src={short.image_url}
                        alt={short.title}
                      />
                      <i className="fa-solid fa-circle-play play-icon" />
                    </div>
                  ) : (
                    <video className="w-100 h-100" style={{ objectFit: "fill" }} controls autoPlay>
                      <source src={short.video_url} type="video/mp4" />
                      Tu navegador no soporta el elemento de video.
                    </video>
                  )}
                </div>

                <div className="text-content-wrapper p-3 d-flex flex-column flex-grow-1">
                  <h2
                    onClick={() => toggleExpand(short.id)}
                    onMouseEnter={() => hoverExpand(short.id)}
                    onMouseLeave={() => hoverCollapse(short.id)}
                    className={`h5 mt-1 mb-4 pointer title-text text-dark ${short.isExpanded ? "card-title-expanded" : "card-title-collapsed"}`}
                  >
                    {short.description}
                  </h2>

                  {!short.isExpanded && (
                    <div className="mt-auto row">
                      <div className="col-3">
                        <button
                          type="button"
                          onClick={(e) => toggleLike(short, e)}
                          disabled={short.isProcessing}
                          className={`border-0 btn mr-3 text-white short-like-button${short.user_liked ? " liked" : ""}${short.isProcessing ? " opacity-50" : ""}`}
                          style={{ backgroundColor: "#D8DBE2", width: "50px", height: "50px", borderRadius: "50%", padding: 0, transition: "all 0.3s ease" }}
                        >
                          <i className={`fa-${short.isProcessing ? "solid fa-spinner fa-spin" : "regular fa-thumbs-up"}`} style={{ fontSize: "1rem" }} />
                        </button>
                      </div>

                      <div className="col-9 text-muted text-right d-flex justify-content-end card-more pt-2">
                        <i className="fa-regular fa-clock mr-1 mt-1" />
                        <span style={{ fontFamily: "'Inter' !important", fontWeight: 400, lineHeight: "24px", letterSpacing: "0px" }}>{formatTimeAgo(short.created_at)}</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

      {shorts.length > numVisible && (
        <button className="nav-btn right" onClick={next}>
          <i className="fas fa-chevron-right" />
        </button>
      )}

      {shorts.length > numVisible && (
        <div className="carousel-indicators-custom">
          {Array.from({ length: dotsCount }).map((_, i) => (
            <span
              key={i}
              className={`dot${i === currentIndex ? " active" : ""}`}
              onClick={() => { stopAll(); setCurrentIndex(i); }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .bg-dark-card { background-color: #4B5667 !important; }
        .short-card {
          border-radius: 12px !important;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .short-item-container {
          border-bottom-left-radius: 10px !important;
          border-bottom-right-radius: 10px !important;
          display: flex;
          align-items: stretch;
        }
        .media-container {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-radius: 10px !important;
        }
        .play-icon {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-size: 3.5rem;
          color: rgba(255,255,255,0.9);
          text-shadow: 0px 4px 10px rgba(0,0,0,0.5);
          pointer-events: none;
          width: 56px;
          height: 56px;
        }
        .text-content-wrapper {
          overflow-y: auto;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        .text-content-wrapper::-webkit-scrollbar { width: 4px; }
        .text-content-wrapper::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.15);
          border-radius: 4px;
        }
        .title-text {
          font-family: 'Montserrat' !important;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .short-like-button {
          max-width: 32px;
          max-height: 32px;
          border-radius: 50% !important;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .short-like-button.liked {
          background: linear-gradient(to bottom right, #4285F4, #1A5BC9) !important;
          color: white !important;
        }
        .card-title-collapsed {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 0 0 auto;
        }
        .card-title-expanded {
          display: block;
          overflow: visible;
          white-space: normal;
          flex: 1 1 auto;
        }
        .thumbnail-wrapper {
          opacity: 0.75;
          transition: opacity 0.3s ease-in-out;
        }
        .short-card:hover .thumbnail-wrapper { opacity: 1; }
        .shorts-carousel-container { padding-bottom: 25px; }
        .nav-btn {
          position: absolute;
          top: 45%;
          transform: translateY(-50%);
          background: rgba(54,120,231,0.85);
          border: none;
          color: white;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 20;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
        }
        .nav-btn.left { left: 20px; }
        .nav-btn.right { right: 20px; }
        .carousel-indicators-custom {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
        }
        .dot {
          width: 8px; height: 8px;
          background-color: rgba(0,0,0,0.25);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .dot.active {
          background-color: #4285F4;
          width: 20px;
          border-radius: 10px;
        }
        @media (max-width: 576px) {
          .row-main { margin-left: 10px !important; margin-right: 10px !important; }
        }
      `}</style>
    </div>
  );
}
