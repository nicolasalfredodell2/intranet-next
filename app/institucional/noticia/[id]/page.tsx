"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getNews, likeNews, unlikeNews } from "@/lib/services/news.service";
import { formatTimeAgo } from "@/lib/utils/time";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function NoticiaPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 1000);
    window.addEventListener("resize", () => setIsMobile(window.innerWidth <= 1000));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getNews(id)
      .then((data) => { setNotice(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [id]);

  const handleLike = async () => {
    if (!notice || isLiking || !localStorage.getItem("token")) return;
    setIsLiking(true);
    try {
      if (notice.user_liked) {
        await unlikeNews(notice.id);
        setNotice((n: any) => ({ ...n, user_liked: false }));
      } else {
        await likeNews(notice.id);
        setNotice((n: any) => ({ ...n, user_liked: true }));
      }
    } catch { /* silent */ } finally {
      setIsLiking(false);
    }
  };

  const goBack = () => { window.scrollTo(0, 0); router.push("/institucional"); };
  const imgSrc = (img: any) => img?.path_url ? `${API}${img.path_url}` : "/img/news/no-image.png";

  const images = notice?.images || [];

  return (
    <div className="fadeIn animated mb-5 p-2">
      <div className="row">
        {loading && !error && (
          <div className="col-12 fadeIn animated px-4">
            <div className="skeleton mb-2" style={{ height: 32 }} />
            <div className="skeleton mb-2" style={{ height: 20, width: 180 }} />
            <div className="skeleton mb-2" style={{ height: 350 }} />
            <div className="skeleton mb-2" style={{ height: 20 }} />
            <div className="skeleton mb-2" style={{ height: 20 }} />
          </div>
        )}

        {!loading && !error && notice && (
          <div className="animated col-12 fadeIn px-4">
            {!isMobile && (
              <>
                <h2 className="h2 mb-2 news-title text-dark">{notice.title}</h2>
                {notice.subtitle && <h3 className="h6 my-4 text-dark">{notice.subtitle}</h3>}
              </>
            )}

            {/* Carousel */}
            <div id="carruselNoticias" style={{ borderRadius: 15, overflow: "hidden", backgroundColor: "#EDEDED", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", position: "relative" }}>
              {images.length === 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="d-block w-100 img-new" src="/img/news/no-image.png" alt="Sin imagen" />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="d-block w-100 img-new"
                    src={imgSrc(images[carouselIndex])}
                    alt={notice.title}
                    style={{ transition: "opacity 0.3s ease" }}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        className="carousel-ctrl-prev"
                        onClick={() => setCarouselIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
                      >
                        <span className="carousel-control-prev-icon" aria-hidden="true" />
                      </button>
                      <button
                        className="carousel-ctrl-next"
                        onClick={() => setCarouselIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
                      >
                        <span className="carousel-control-next-icon" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {isMobile && <h2 className="h2 px-2 mt-2 news-title text-dark">{notice.title}</h2>}

            {!isMobile && (
              <p className="my-4 text-left text-more" style={{ fontFamily: "Inter" }}>
                <i className="fa-regular fa-clock mr-1" /> {formatTimeAgo(notice.created_at)}
              </p>
            )}

            <div
              className="text-justify text-note px-2 px-lg-0 new-description"
              dangerouslySetInnerHTML={{ __html: notice.description }}
            />

            <div className="mt-5 text-right">
              <button
                onClick={handleLike}
                className={`border-0 btn mr-3 text-white${notice.user_liked ? " bg-blue" : " bg-muted"}`}
                style={{ backgroundColor: notice.user_liked ? undefined : "#E2E6EA", width: 50, height: 50, borderRadius: "50%", padding: 0, transition: "all 0.3s ease" }}
              >
                <i className="fa-regular fa-thumbs-up" style={{ fontSize: "1.5rem" }} />
              </button>

              <br className="d-md-none" />

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
        )}

        {error && (
          <div className="col-12 fadeIn animated alert alert-info" role="alert">
            <h1 className="display mb-2" style={{ fontSize: "1.2rem" }}>
              No fue posible cargar la nota. Inténtelo más tarde.
            </h1>
            <button onClick={goBack} className="border-0 btn btn-back px-4 py-2 text-dark mt-3" style={{ backgroundColor: "#E2E6EA", borderRadius: 25 }}>
              <strong><i className="mdi mdi-arrow-left mr-2" style={{ fontSize: "1.25rem" }} /> Volver</strong>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .skeleton {
          background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
          width: 100%;
        }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .news-title { font-size: clamp(24px, 3vw, 38px) !important; font-weight: 700 !important; line-height: clamp(28px, 3.5vw, 42px) !important; }
        .text-more { font-size: clamp(16px, 2vw, 16px) !important; }
        .text-note { font-size: clamp(16px, 2vw, 16px) !important; line-height: clamp(25px, 2.5vw, 25px) !important; }
        .img-new { width: 100%; object-fit: cover; display: block; }
        .btn-back { box-shadow: rgba(99,99,99,0.2) 0px 2px 8px 0px; }
        .bg-blue { background: linear-gradient(to bottom right, #4285F4, #1A5BC9) !important; }
        .bg-muted { background-color: #E2E6EA !important; }
        .carousel-ctrl-prev, .carousel-ctrl-next {
          position: absolute;
          top: 50%; transform: translateY(-50%);
          background-color: rgba(101, 113, 135, 1);
          border-radius: 50%;
          border: none;
          cursor: pointer;
          width: 45px; height: 45px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          margin: 0 20px;
        }
        .carousel-ctrl-prev { left: 0; }
        .carousel-ctrl-next { right: 0; }
        .carousel-ctrl-prev:hover, .carousel-ctrl-next:hover { transform: translateY(-50%) scale(1.1); }
        .carousel-control-prev-icon, .carousel-control-next-icon { width: 1.2rem; height: 1.2rem; }
        @media (max-width: 600px) {
          .btn-back { width: 100%; }
          .news-title { font-size: clamp(14px, 3vw, 28px) !important; }
        }
      `}</style>
    </div>
  );
}
