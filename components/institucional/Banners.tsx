"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BannersProps {
  banners: any[];
}

export default function Banners({ banners }: BannersProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSmall, setIsSmall] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsSmall(window.innerWidth < 1200);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!banners || banners.length === 0) return null;

  const banner = banners[currentIndex];
  const imgSrc = isSmall ? banner.image_horizontal_url : banner.image_vertical_url;
  const isClickable = banner.external_url || banner.note;

  const handleClick = () => {
    if (banner.external_url) window.open(banner.external_url, "_blank");
    else if (banner.note) router.push(`/institucional/noticia/${banner.note.id}`);
  };

  const prev = () => setCurrentIndex((i) => (i > 0 ? i - 1 : banners.length - 1));
  const next = () => setCurrentIndex((i) => (i < banners.length - 1 ? i + 1 : 0));

  return (
    <div className="row">
      <div className="col-md-12 mb-3 pl-xs-2 pr-md-3 pl-xl-2 pr-xl-2">
        <div className="banner-container position-relative animated fadeIn">
          {banners.length > 1 && (
            <button className="nav-btn left" onClick={prev}>
              <i className="fas fa-chevron-left" />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            onClick={isClickable ? handleClick : undefined}
            src={imgSrc}
            alt={banner.name}
            className={`w-100 banner-img${isClickable ? " pointer" : ""}`}
          />

          {banners.length > 1 && (
            <button className="nav-btn right" onClick={next}>
              <i className="fas fa-chevron-right" />
            </button>
          )}

          {banners.length > 1 && (
            <div className="carousel-indicators-custom">
              {banners.map((_, i) => (
                <span
                  key={i}
                  className={`dot${i === currentIndex ? " active" : ""}`}
                  onClick={() => setCurrentIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .banner-img {
          width: 100%;
          height: 100%;
          aspect-ratio: 9 / 16;
          object-fit: cover;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transition: transform 0.2s ease;
        }
        .banner-container {
          overflow: hidden;
          border-radius: 10px;
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
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        .nav-btn.left { left: 10px; }
        .nav-btn.right { right: 10px; }
        .carousel-indicators-custom {
          position: absolute;
          bottom: 15px;
          left: 0; right: 0;
          display: flex;
          justify-content: center;
          gap: 8px;
          z-index: 20;
        }
        .dot {
          width: 8px;
          height: 8px;
          background-color: rgba(255,255,255,0.5);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .dot.active {
          background-color: #ffffff;
          width: 20px;
          border-radius: 10px;
        }
        @media (max-width: 1199px) {
          .banner-img {
            height: 150px !important;
            aspect-ratio: auto;
            object-fit: cover;
          }
          .nav-btn { width: 25px; height: 25px; font-size: 0.8rem; }
          .nav-btn.left { left: 20px; }
          .nav-btn.right { right: 20px; }
        }
        @media (max-width: 576px) {
          .banner-img { height: 80px !important; }
        }
      `}</style>
    </div>
  );
}
