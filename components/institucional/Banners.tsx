"use client";

import { useEffect, useRef, useState } from "react";

interface BannersProps {
  banners: any[];
}

export default function Banners({ banners }: BannersProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSmall, setIsSmall] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const currentIndexRef = useRef(0);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    const check = () => setIsSmall(window.innerWidth < 1200);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function goTo(newIndex: number, dir: "next" | "prev") {
    const oldIndex = currentIndexRef.current;
    if (newIndex === oldIndex) return;
    setDirection(dir);
    setPrevIndex(oldIndex);
    setCurrentIndex(newIndex);
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => setPrevIndex(null), 500);
  }

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!banners || banners.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      const i = currentIndexRef.current;
      goTo(i < banners.length - 1 ? i + 1 : 0, "next");
    }, 10000);
    return () => clearInterval(interval);
  }, [banners, isHovered]);

  if (!banners || banners.length === 0) return null;

  const banner = banners[currentIndex];
  const imgSrc = isSmall ? banner.image_horizontal_url : banner.image_vertical_url;
  const isClickable = banner.external_url || banner.note;
  const ctaLabel = banner.note ? "Ver nota interna" : banner.external_url ? "Ver enlace externo" : null;

  const handleClick = () => {
    if (banner.external_url) window.open(banner.external_url, "_blank", "noopener,noreferrer");
    else if (banner.note) window.open(`/institucional/noticia/${banner.note.id}`, "_blank", "noopener,noreferrer");
  };

  const prev = () => goTo(currentIndexRef.current > 0 ? currentIndexRef.current - 1 : banners.length - 1, "prev");
  const next = () => goTo(currentIndexRef.current < banners.length - 1 ? currentIndexRef.current + 1 : 0, "next");

  const outgoingBanner = prevIndex !== null ? banners[prevIndex] : null;
  const outgoingImgSrc = outgoingBanner ? (isSmall ? outgoingBanner.image_horizontal_url : outgoingBanner.image_vertical_url) : null;

  return (
    <div className="row">
      <div className="col-md-12 mb-3 pl-xs-2 pr-md-3 pl-xl-2 pr-xl-2">
        <div
          className="banner-container position-relative animated fadeIn"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {banners.length > 1 && (
            <button className="nav-btn left" onClick={prev}>
              <i className="fas fa-chevron-left" />
            </button>
          )}

          <div className="banner-slide-viewport">
            {outgoingImgSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`out-${prevIndex}`}
                src={outgoingImgSrc}
                alt=""
                className={`banner-img ${direction === "next" ? "slide-exit-next" : "slide-exit-prev"}`}
              />
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={`in-${currentIndex}`}
              onClick={isClickable ? handleClick : undefined}
              src={imgSrc}
              alt={banner.name}
              className={`banner-img ${direction === "next" ? "slide-enter-next" : "slide-enter-prev"}${isClickable ? " pointer" : ""}`}
            />
          </div>

          {banners.length > 1 && (
            <button className="nav-btn right" onClick={next}>
              <i className="fas fa-chevron-right" />
            </button>
          )}

          {ctaLabel && (
            <button className="cta-btn" onClick={handleClick}>
              {ctaLabel}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .banner-container {
          overflow: hidden;
          border-radius: 10px;
        }
        .banner-slide-viewport {
          position: relative;
          width: 100%;
          aspect-ratio: 9 / 16;
          overflow: hidden;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .banner-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .slide-enter-next {
          animation: slideInFromRight 0.45s ease forwards;
        }
        .slide-enter-prev {
          animation: slideInFromLeft 0.45s ease forwards;
        }
        .slide-exit-next {
          animation: slideOutToLeft 0.45s ease forwards;
        }
        .slide-exit-prev {
          animation: slideOutToRight 0.45s ease forwards;
        }
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOutToLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        @keyframes slideOutToRight {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(54, 120, 231, 0.85);
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
          box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .nav-btn:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.25);
        }
        .nav-btn.left { left: 10px; }
        .nav-btn.right { right: 10px; }
        .cta-btn {
          position: absolute;
          bottom: 15px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(54, 120, 231, 0.9);
          color: #fff;
          border: none;
          border-radius: 20px;
          padding: 6px 16px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          z-index: 20;
          box-shadow: 0 2px 10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15);
          white-space: nowrap;
          transition: background 0.2s ease, box-shadow 0.2s ease;
        }
        .cta-btn:hover {
          background: rgba(54, 120, 231, 1);
          box-shadow: 0 4px 14px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.25);
        }
        @media (max-width: 1199px) {
          .banner-slide-viewport {
            height: 150px !important;
            aspect-ratio: auto;
          }
          .nav-btn { width: 25px; height: 25px; font-size: 0.8rem; }
          .nav-btn.left { left: 20px; }
          .nav-btn.right { right: 20px; }
        }
        @media (max-width: 576px) {
          .banner-slide-viewport { height: 80px !important; }
        }
      `}</style>
    </div>
  );
}
