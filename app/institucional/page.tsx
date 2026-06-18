"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { listMainNews, listNews } from "@/lib/services/news.service";
import { getTodayBirthdays } from "@/lib/services/calendar.service";
import { getActivatedBanners } from "@/lib/services/banners.service";
import { formatTimeAgo, stripHtml } from "@/lib/utils/time";
import Birthday from "@/components/institucional/Birthday";
import Banners from "@/components/institucional/Banners";
import Weather from "@/components/institucional/Weather";
import Internal from "@/components/institucional/Internal";
import CalendarWidget from "@/components/institucional/CalendarWidget";
import Questions from "@/components/institucional/Questions";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function NewsPage() {
  const router = useRouter();
  const [mainNews, setMainNews] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loadingMain, setLoadingMain] = useState(true);
  const [loadingNews, setLoadingNews] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileForMain, setIsMobileForMain] = useState(false);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [filters, setFilters] = useState({ page: 1, per_page: 6, title: "" });

  const checkSize = useCallback(() => {
    setIsMobile(window.innerWidth <= 576);
    setIsMobileForMain(window.innerWidth <= 1000);
  }, []);

  useEffect(() => {
    checkSize();
    window.addEventListener("resize", checkSize);

    // Load birthdays and banners for mobile sections
    getTodayBirthdays().then((data) => {
      const now = new Date();
      const m = now.getMonth() + 1;
      const d = now.getDate();
      setBirthdays(data.filter((p: any) => {
        const [, pm, pd] = (p.datebirth || "").split("-").map(Number);
        return pm === m && pd === d;
      }));
    }).catch(() => {});

    getActivatedBanners().then(setBanners).catch(() => {});

    // Load main news
    listMainNews().then((resp) => {
      const all = [resp.featured_note, ...(resp.latest_notes || [])];
      setMainNews(all.map((n: any) => ({ ...n, smallDescription: stripHtml(n?.description || "") })));
      setLoadingMain(false);
    }).catch(() => {
      setError(true);
      setLoadingMain(false);
    });

    return () => window.removeEventListener("resize", checkSize);
  }, [checkSize]);

  useEffect(() => {
    setLoadingNews(true);
    listNews(filters).then((resp) => {
      setCanNext(!!resp.next_page_url);
      const items = resp.data.map((n: any) => ({ ...n, smallDescription: stripHtml(n.description || "") }));
      setNews((prev) => filters.page === 1 ? items : [...prev, ...items]);
      setLoadingNews(false);
    }).catch(() => {
      setError(true);
      setLoadingNews(false);
    });
  }, [filters]);

  const onSearch = (title: string) => {
    setNews([]);
    setFilters({ page: 1, per_page: 6, title });
  };

  const loadMore = () => setFilters((f) => ({ ...f, page: f.page + 1 }));

  const redirectToNew = (notice: any) => {
    if (!notice) return;
    window.scrollTo(0, 0);
    router.push(`/institucional/noticia/${notice.id}`);
  };

  const imgSrc = (images: any[]) => images?.[0]?.path_url ? `${API}${images[0].path_url}` : "/img/news/no-image.png";

  const Modal = ({ show, onClose, children }: { show: boolean; onClose: () => void; children: React.ReactNode }) =>
    !show ? null : (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
          {children}
        </div>
      </div>
    );

  return (
    <div>
      {error && (
        <div className="row">
          <div className="animated col-12 fadeIn">
            <div className="alert alert-info" role="alert">
              <h4 className="alert-heading">Hubo un problema.</h4>
              <hr />
              <p>No se pudieron cargar las últimas noticias.</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: birthday + banners (xs only) */}
      <div className="d-sm-none px-3 row">
        {birthdays.length > 0 && (
          <div className="col-12 mb-3">
            <Birthday birthdays={birthdays} isLoading={false} />
          </div>
        )}
        {banners.length > 0 && (
          <div className="col-12">
            <Banners banners={banners} />
          </div>
        )}
      </div>

      {/* Main news — 3 cards */}
      {!loadingMain && !error && mainNews[0] && (
        <div className="animated fadeIn row align-items-stretch">
          {/* Featured */}
          <div className="col-12 col-lg-7-5 mr-lg-0 pr-lg-1 mb-lg-0 d-flex">
            <div
              className="card border-0 p-3 p-lg-0 pointer rounded w-100 d-flex flex-column"
              style={{ boxShadow: 'none', background: "#EDEDED", borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}
              onClick={() => redirectToNew(mainNews[0])}
            >
              {!isMobileForMain && (
                <div className="flex-grow-0">
                  <h2 className="h2 principal-main-news-title text-dark">{mainNews[0]?.title}</h2>
                  <h6 className="h6 principal-main-news-description text-dark" dangerouslySetInnerHTML={{ __html: mainNews[0]?.description }} />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {mainNews[0]?.images?.[0] && <img className="img-main-principal p-lg-0" src={imgSrc(mainNews[0].images)} alt={mainNews[0].title} />}
              {isMobileForMain && (
                <div className="mt-2 flex-grow-1">
                  <h2 className="h2 principal-main-news-title text-dark">{mainNews[0]?.title}</h2>
                  <h6 className="h6 principal-main-news-description text-dark" dangerouslySetInnerHTML={{ __html: mainNews[0]?.description }} />
                </div>
              )}
            </div>
          </div>

          {/* Secondary news */}
          <div className="col-12 col-lg-4-5 ml-lg-0 pl-lg-0 d-flex d-flex">
            <div className="row m-0 align-content-start">

              {mainNews[1] && (
                <div className="col-6 col-lg-12 pr-lg-0 mb-lg-2 pr-xs-1">
                  <div
                    className="card pointer rounded w-100 d-flex flex-column main-news-card"
                    style={{ background: "#EDEDED", borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}
                    onClick={() => redirectToNew(mainNews[1])}
                  >
                    {!isMobileForMain && (
                      <div className="flex-grow-1">
                        <h2 className="h6 main-news-title text-dark">{mainNews[1]?.title}</h2>
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {mainNews[1]?.images?.[0] && <img className="img-main mt-auto" src={imgSrc(mainNews[1].images)} alt={mainNews[1]?.title} />}
                    {isMobileForMain && (
                      <div className="flex-grow-1 main-news-card-title">
                        <h2 className="h6 main-news-title text-dark">{mainNews[1]?.title}</h2>
                      </div>
                    )}
                    <div className="d-xs-flex d-md-none text-muted mt-auto text-right pr-2 pb-2">
                      <i className="fa-regular fa-clock mr-1 mt-1" />
                      <span style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>{formatTimeAgo(mainNews[1]?.created_at)}</span>
                    </div>
                  </div>
                </div>
              )}

              {mainNews[2] && (
                <div className="col-6 col-lg-12 pr-lg-0 mb-lg-0 mt-lg-0 pl-xs-1">
                  <div
                    className="card pointer rounded w-100 d-flex flex-column main-news-card mt-4"
                    style={{ background: "none", borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}
                    onClick={() => redirectToNew(mainNews[2])}
                  >
                    {!isMobileForMain && (
                      <div className="flex-grow-1">
                        <h2 className="h6 main-news-title text-dark">{mainNews[2]?.title}</h2>
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {mainNews[2]?.images?.[0] && <img className="img-main mt-auto" src={imgSrc(mainNews[2].images)} alt={mainNews[2]?.title} />}
                    {isMobileForMain && (
                      <div className="flex-grow-1 main-news-card-title">
                        <h2 className="h6 main-news-title text-dark">{mainNews[2]?.title}</h2>
                      </div>
                    )}
                    <div className="d-xs-flex d-md-none text-muted mt-auto text-right pr-2 pb-2">
                      <i className="fa-regular fa-clock mr-1 mt-1" />
                      <span style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>{formatTimeAgo(mainNews[2]?.created_at)}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {loadingMain && (
        <div className="mb-3 row">
          <div className="col-12 text-center">
            <p className="pointer bg-white p-3 text-dark charge" style={{ borderRadius: 25, fontSize: 16, height: 50, lineHeight: "20px", boxShadow: "rgba(0,0,0,0.16) 0px 2px 6px", width: 292, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              Cargando noticias principales...
            </p>
          </div>
        </div>
      )}

      {/* Tablet birthday + banners (sm-xl) */}
      <div className="d-none d-sm-flex d-xl-none mt-4 row">
        {birthdays.length > 0 && (
          <div className={banners.length > 0 ? "col-6" : "col-12"}>
            <Birthday birthdays={birthdays} isLoading={false} />
          </div>
        )}
        {banners.length > 0 && (
          <div className={birthdays.length > 0 ? "col-6" : "col-12"}>
            <Banners banners={banners} />
          </div>
        )}
      </div>

      {/* Tablet sector buttons (md-xl) */}
      <div className="d-none d-md-flex d-xl-none mt-2 px-3 row">
        <div className="col-3 sector pr-2">
          <div className="sector-container pointer" onClick={() => setShowAgendaModal(true)}>
            <div className="row d-flex align-items-center h-100">
              <div className="col-12 text-center mt-3">
                <i className="sector-icon sector-custom-padding fa fa-phone text-white" />
              </div>
              <div className="col-12 text-center mt-2">
                <p className="text-sector text-white">Agenda</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-3 sector px-2">
          <div className="sector-container pointer" onClick={() => setShowCalendarModal(true)}>
            <div className="row d-flex align-items-center h-100">
              <div className="col-12 text-center mt-3">
                <i className="sector-icon sector-custom-padding fa-regular fa-calendar text-white" />
              </div>
              <div className="col-12 text-center mt-2">
                <p className="text-sector text-white">Calendario</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-3 sector px-2">
          <div className="sector-container pointer" onClick={() => window.open("https://im.tribcuentasrionegro.gov.ar/livechat?mode=popout", "_blank")}>
            <div className="row d-flex align-items-center h-100">
              <div className="col-12 text-center mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/chat/logo.svg" className="sector-icon img-logo-caht" alt="Logo Soporte" />
              </div>
              <div className="col-12 text-center mt-2">
                <p className="text-sector text-white">Chat Soporte</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-3 sector pl-2">
          <div className="sector-container pointer" onClick={() => setShowQuestionsModal(true)}>
            <div className="row d-flex align-items-center h-100">
              <div className="col-12 text-center mt-3">
                <i className="sector-icon fa fa-file-pen text-white" />
              </div>
              <div className="col-12 text-center mt-2">
                <p className="text-sector text-white">Encuesta</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weather + search */}
      <div className="row">
        <div className="col-12 mt-4 pt-lg-2" style={{ marginBottom: "37.5px" }}>
          <Weather onSearch={onSearch} />
        </div>
      </div>

      {/* News grid */}
      <div className="row px-2">
        {news.map((item: any) => (
          <div key={item.id} className="animated col-12 col-sm-6 col-lg-4 fadeIn mx-0 px-3 px-lg-2" style={{ borderRadius: 10 }}>
            {!isMobile ? (
              <div
                className="card pointer w-100 border mb-3"
                onClick={() => redirectToNew(item)}
                style={{ borderRadius: 10, boxShadow: "rgba(0,0,0,0.16) 0px 1px 4px" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.images?.[0] && (
                  <img className="img-new" style={{ borderTopLeftRadius: 10, borderTopRightRadius: 10 }} src={imgSrc(item.images)} alt={item.title} />
                )}
                <div className="card-body py-3 d-flex flex-column bg-white" style={{ borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}>
                  <h2 className="card-title h5 font-bold mb-lg-3 text-dark" style={{ fontFamily: "Montserrat", minHeight: 48 }}>{item.title}</h2>
                  <p className="d-none d-lg-block card-description" style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif", height: 48 }}>{item.smallDescription}</p>
                  <div className="text-muted mt-auto d-flex justify-content-end card-more">
                    <i className="fa-regular fa-clock mr-1 mt-1" />
                    <span style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>{formatTimeAgo(item.created_at)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pointer mb-2 w-100 px-1" onClick={() => redirectToNew(item)} style={{ boxShadow: "rgba(0,0,0,0.16) 0px 1px 4px" }}>
                <div className="row">
                  <div className="col-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.images?.[0] && <img className="w-100" style={{ borderRadius: 10, height: 85, objectFit: "cover" }} src={imgSrc(item.images)} alt={item.title} />}
                  </div>
                  <div className="col-7 ml-0 pl-0">
                    <h2 className="card-title h5 font-bold text-dark">
                      <small><strong style={{ fontFamily: "Montserrat" }}>{item.title}</strong></small>
                    </h2>
                    <div className="text-muted mt-auto d-flex justify-content-end">
                      <small>
                        <i className="fa-regular fa-clock mr-1 mt-1" />
                        <span style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>{formatTimeAgo(item.created_at)}</span>
                      </small>
                    </div>
                  </div>
                </div>
                <hr />
              </div>
            )}
          </div>
        ))}
      </div>

      {loadingNews && (
        <div className="mb-3 row">
          <div className="col-12 text-center">
            <p className="pointer bg-white p-3 text-dark" style={{ borderRadius: 25, fontSize: 16, height: 50, lineHeight: "20px", boxShadow: "rgba(0,0,0,0.16) 0px 2px 6px", width: 222, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              Cargando noticias...
            </p>
          </div>
        </div>
      )}

      {!loadingNews && canNext && (
        <div className="my-3 row">
          <div className="col-12 text-center">
            <p onClick={loadMore} className="pointer bg-white p-3 text-dark charge" style={{ borderRadius: 25, fontSize: 16, height: 50, lineHeight: "20px", boxShadow: "rgba(0,0,0,0.16) 0px 2px 6px", width: 222, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              Cargar más noticias
            </p>
          </div>
        </div>
      )}

      {/* Tablet modals */}
      <Modal show={showAgendaModal} onClose={() => setShowAgendaModal(false)}>
        <div className="row d-flex justify-content-center">
          <div className="col-12 col-md-10 mx-auto"><Internal /></div>
        </div>
      </Modal>
      <Modal show={showCalendarModal} onClose={() => setShowCalendarModal(false)}>
        <div className="row d-flex justify-content-center mb-5">
          <div className="col-10 mx-auto"><CalendarWidget /></div>
        </div>
      </Modal>
      <Modal show={showQuestionsModal} onClose={() => setShowQuestionsModal(false)}>
        <div className="row d-flex justify-content-center mb-5">
          <div className="col-10 mx-auto"><Questions /></div>
        </div>
      </Modal>

      <style jsx>{`
        @media (min-width: 992px) {
          .col-lg-7-5 { flex: 0 0 62.5%; max-width: 62.5%; }
          .col-lg-4-5 { flex: 0 0 37.5%; max-width: 37.5%; }
        }
        .img-main-principal { width: 100%; flex: 1 1 0; min-height: 0; object-fit: cover; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; }
        .img-main { width: 100%; aspect-ratio: 16/7; object-fit: cover; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; }
        .img-new { width: 100%; max-height: 186px; min-height: 186px; object-fit: unset; }
        .principal-main-news-title { font-size: clamp(24px, 3vw, 38px) !important; font-weight: 700 !important; line-height: clamp(28px, 3.5vw, 42px) !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
        .principal-main-news-description { font-size: clamp(14px, 1.5vw, 16px) !important; font-weight: 500 !important; line-height: clamp(20px, 2vw, 22px) !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
        .main-news-title { font-size: clamp(16px, 2vw, 20px) !important; font-weight: 700 !important; line-height: clamp(22px, 2.5vw, 28px) !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
        .card-title { font-size: clamp(16px, 2vw, 16px) !important; font-weight: 700 !important; line-height: clamp(24px, 2.5vw, 24px) !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
        .card-description { font-family: Inter !important; font-size: clamp(16px, 2vw, 16px) !important; font-weight: 400 !important; line-height: clamp(24px, 2.5vw, 24px) !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
        .card-more { font-size: clamp(16px, 2vw, 16px) !important; font-weight: 400 !important; line-height: clamp(24px, 2.5vw, 24px) !important; }
        .card-body-no-main { height: 80px; }
        .sector-icon { background-color: #B1B8C4; border-radius: 50%; font-size: 30px; padding: 25px; }
        .sector-custom-padding { padding: 25px 30px; }
        .sector { padding: 15px 0; }
        .img-logo-caht { height: 75px; width: 75px; padding: 15px; }
        .sector-container { background: linear-gradient(to bottom, #5C6373 0%, #454C5C 100%); border-radius: 30px; display: flex; align-items: center; justify-content: center; height: 147px; width: 100%; }
        .text-sector { font-family: Inter !important; font-size: 20px; font-weight: 500; }
        .bg-dark-card { background-color: #4B5667 !important; }
        .el-element-overlay, .el-element-overlay-main { transition: all .2s ease-in-out; }
        .el-element-overlay:hover { transform: scale(1.07); z-index: 9999; }
        .rounded-bottom { border-bottom-left-radius: 15px !important; border-bottom-right-radius: 15px !important; }
        .charge { background-color: #f8f9fa; }
        hr { border: 0; border-top: 1px solid #4B5667; opacity: 1; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 99999; }
        .modal-content { background: #4B5667; border-radius: 12px; padding: 2rem; width: 50vw; max-width: 90vw; max-height: 80vh; overflow-y: auto; position: relative; }
        .modal-close-btn { position: absolute; top: 10px; right: 15px; background: #dc3545; color: #fff; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        @media (max-width: 1000px) {
          .img-main-principal { aspect-ratio: 4/3; }
          .charge { background-color: transparent !important; border: none !important; box-shadow: none !important; color: #768298 !important; font-weight: bold !important; text-decoration: underline; }
          img { border-radius: 15px; }
        }
        .main-news-card { border: none !important; background-color: #ededed !important; box-shadow: none !important; }
        @media (max-width: 992px) {
          .main-news-card { box-shadow: none !important; background-color: #ededed !important; border-top-left-radius: 15px !important; border-top-right-radius: 15px !important; }
          .main-news-card-title { background-color: #ededed !important; border-radius: 12px !important; padding: 15px !important; margin: 0 !important; }
        }
        @media (max-width: 750px) {
          .principal-main-news-title { font-size: clamp(20px, 2.5vw, 20px) !important; }
        }
        @media (max-width: 576px) {
          .pr-xs-1 { padding-right: 5px; }
          .pl-xs-1 { padding-left: 5px; }
        }
      `}</style>
    </div>
  );
}
