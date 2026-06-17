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
      <div className="row d-flex justify-content-center">
        {loading && !error && (
          <div className="col-12 col-lg-8 fadeIn animated px-4">
            <div className="skeleton mb-2" style={{ height: 32 }} />
            <div className="skeleton mb-2" style={{ height: 20, width: 180 }} />
            <div className="skeleton mb-2" style={{ height: 350 }} />
            <div className="skeleton mb-2" style={{ height: 20 }} />
            <div className="skeleton mb-2" style={{ height: 20 }} />
            <div className="skeleton mb-2" style={{ height: 20 }} />
          </div>
        )}

        {!loading && !error && notice && (
          <div className="animated col-12 col-lg-8 fadeIn px-4">
            {!isMobile && (
              <>
                <h2 className="h2 mb-2 title text-dark">{notice.title}</h2>
                {notice.subtitle && <h3 className="h6 my-4 dcescription text-dark">{notice.subtitle}</h3>}
              </>
            )}

            {/* Carousel */}
            <div id="carruselNoticias">
              <div className="carousel-inner" style={{ borderRadius: 15, overflow: "hidden" }}>
                {images.length === 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="d-block w-100 img-new" src="/img/news/no-image.png" alt="Sin imagen" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="d-block w-100 img-new"
                    src={imgSrc(images[carouselIndex])}
                    alt={notice.title}
                    style={{ transition: "opacity 0.3s ease" }}
                  />
                )}
              </div>

              {images.length > 1 && (
                <>
                  <button
                    className="carousel-control-prev"
                    type="button"
                    onClick={() => setCarouselIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
                  >
                    <span className="carousel-control-prev-icon" aria-hidden="true" />
                    <span className="sr-only">Anterior</span>
                  </button>
                  <button
                    className="carousel-control-next"
                    type="button"
                    onClick={() => setCarouselIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
                  >
                    <span className="carousel-control-next-icon" aria-hidden="true" />
                    <span className="sr-only">Siguiente</span>
                  </button>
                </>
              )}
            </div>

            {isMobile && <h2 className="h2 px-2 mt-2 title text-dark">{notice.title}</h2>}

            {!isMobile && (
              <p className="my-4 text-left text-more" style={{ fontFamily: "Inter !important" }}>
                <i className="fa-regular fa-clock mr-1" /> {formatTimeAgo(notice.created_at)}
              </p>
            )}

            <div
              className="text-justify text-note px-2 px-lg-0 text-dark new-description"
              dangerouslySetInnerHTML={{ __html: notice.description }}
            />

            <div className="mt-5 text-right">
              <button
                onClick={handleLike}
                className={`border-0 btn btn-like mr-3 text-white${notice.user_liked ? " bg-blue" : ""}`}
                style={{ backgroundColor: notice.user_liked ? undefined : "#E2E6EA", width: 50, height: 50, borderRadius: "50%", padding: 0 }}
              >
                <i className="fa-regular fa-thumbs-up" style={{ fontSize: "1.5rem" }} />
              </button>

              <br className="d-md-none" />

              <button
                onClick={goBack}
                className="border-0 btn btn-back px-4 py-2 text-dark mt-3 mt-md-0"
                style={{ backgroundColor: "#E2E6EA", borderRadius: 15 }}
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
            <h1 className="display mb-2">
              No fue posible cargar la nota. Intentelo màs tarde.
            </h1>
            <button onClick={goBack} className="border-0 btn btn-back px-4 py-2 text-dark mt-3 mt-md-0" style={{ backgroundColor: "#E2E6EA", borderRadius: 25 }}>
              <strong><i className="mdi mdi-arrow-left mr-2" style={{ fontSize: "1.25rem" }} /> Volver</strong>
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .new-description img {
          align-self: center !important;
          border-radius: 15px !important;
          width: 100% !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
        }
        @media (max-width: 600px) {
          .new-description img:not(.img-new-main) {
            max-width: 100%;
            min-width: 100%;
          }
        }
      `}</style>

      <style jsx>{`
        .skeleton {
          background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
          width: 100%;
        }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        .title {
          font-size: clamp(24px, 3vw, 38px) !important;
          font-weight: 700 !important;
          line-height: clamp(28px, 3.5vw, 42px) !important;
        }

        .dcescription {
          font-size: clamp(20px, 2vw, 15px) !important;
          font-weight: 500 !important;
          line-height: clamp(28px, 3.5vw, 25px) !important;
        }

        .text-more {
          font-size: clamp(16px, 2vw, 16px) !important;
          font-weight: 400 !important;
          line-height: clamp(24px, 2.5vw, 24px) !important;
        }

        .text-note {
          font-size: clamp(16px, 2vw, 16px) !important;
          font-weight: 400 !important;
          line-height: clamp(25px, 2.5vw, 25px) !important;
        }

        .img-new { width: 100%; display: block; }

        .btn-back { box-shadow: rgba(99,99,99,0.2) 0px 2px 8px 0px; border-radius: 25px !important; }

        .btn-like { border-radius: 50% !important; width: 50px; height: 50px; padding: 0; }
        .btn-like:hover { background-color: #999999 !important; }

        .bg-blue { background: linear-gradient(to bottom right, #4285F4, #1A5BC9) !important; }

        #carruselNoticias {
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: box-shadow 0.3s ease;
          background-color: #EDEDED;
          border-radius: 15px;
          position: relative;
        }
        #carruselNoticias:hover { box-shadow: 0 15px 40px rgba(0,0,0,0.12); }

        #carruselNoticias .carousel-control-prev,
        #carruselNoticias .carousel-control-next {
          width: 45px;
          height: 45px;
          background-color: rgba(101,113,135,1) !important;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          top: 50%;
          transform: translateY(-50%);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          margin: 0 20px;
        }
        #carruselNoticias .carousel-control-prev-icon,
        #carruselNoticias .carousel-control-next-icon {
          width: 1.2rem;
          height: 1.2rem;
        }
        #carruselNoticias .carousel-control-prev:hover,
        #carruselNoticias .carousel-control-next:hover {
          transform: translateY(-50%) scale(1.1);
        }
        #carruselNoticias .carousel-control-prev:focus,
        #carruselNoticias .carousel-control-next:focus {
          outline: none;
          box-shadow: none;
        }

        .display { font-size: 1.2rem; }

        @media (max-width: 600px) {
          .btn-back { width: 100%; }
          .title { font-size: clamp(14px, 3vw, 28px) !important; }
          .img-new-main { height: 200px; object-fit: fill; width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
