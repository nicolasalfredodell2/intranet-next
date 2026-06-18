"use client";

import { useState, useRef, useEffect } from "react";

interface BirthdayProps {
  birthdays: any[];
  isLoading: boolean;
  onShowDialog?: () => void;
}

export default function Birthday({ birthdays, isLoading, onShowDialog }: BirthdayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [compactName, setCompactName] = useState(false);
  const [compactDesktopName, setCompactDesktopName] = useState(false);
  const nameRef = useRef<HTMLButtonElement>(null);
  const desktopNameRef = useRef<HTMLButtonElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    const measure = (el: HTMLButtonElement | null, setter: (v: boolean) => void) => {
      if (!el) return;
      setter(false);
      requestAnimationFrame(() => {
        if (!el || el.offsetWidth === 0) return;
        const style = getComputedStyle(el);
        const lh = parseFloat(style.lineHeight);
        const pt = parseFloat(style.paddingTop);
        const pb = parseFloat(style.paddingBottom);
        setter(el.scrollHeight - pt - pb > lh * 2 + 2);
      });
    };
    measure(nameRef.current, setCompactName);
    measure(desktopNameRef.current, setCompactDesktopName);
  }, [currentIndex]);

  const prev = () =>
    setCurrentIndex((i) => (i > 0 ? i - 1 : birthdays.length - 1));
  const next = () =>
    setCurrentIndex((i) => (i < birthdays.length - 1 ? i + 1 : 0));

  if (isLoading) return null;
  if (!birthdays || birthdays.length === 0) return null;

  const person = birthdays[currentIndex];

  return (
    <div className="mb-3">
      <div className="custom-dialog-card">
        <div className="card-video-overlay" />

        <div className="card-content">
          {birthdays.length > 1 && (
            <>
              <button className="nav-btn left" onClick={prev}>
                <i className="fas fa-chevron-left" />
              </button>
              <button className="nav-btn right" onClick={next}>
                <i className="fas fa-chevron-right" />
              </button>
            </>
          )}

          {/* Desktop */}
          <div className="d-none d-xl-block dialog-body text-center">
            {person.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="img-profile rounded-circle mb-3"
                src={`${apiUrl}${person.avatar_url}`}
                alt={person.lastname_name}
              />
            ) : (
              <i className="mdi mdi-account-circle text-white" style={{ fontSize: "7.5rem" }} />
            )}

            <h2 className="dialog-title text-white mt-5">¡Feliz Cumpleaños!</h2>

            <button ref={desktopNameRef} className="btn mt-2 py-2 px-4 text-white main-btn" style={compactDesktopName ? { fontSize: "12px" } : undefined} onClick={onShowDialog}>
              {person.lastname_name}
            </button>
          </div>

          {/* Mobile / tablet */}
          <div className="d-xl-none row">
            <div className="col-4 col-md-5 my-auto text-center profile-container">
              {person.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="img-profile rounded-circle"
                  src={`${apiUrl}${person.avatar_url}`}
                  alt={person.lastname_name}
                />
              ) : (
                <i className="mdi mdi-account-circle text-white default-avatar-icon" />
              )}
            </div>

            <div className="col-8 col-md-7 text-content mt-3 text-center">
              <button ref={nameRef} className="btn mt-2 py-md-2 px-4 text-white main-btn" style={compactName ? { fontSize: "12px" } : undefined} onClick={onShowDialog}>
                {person.lastname_name}
              </button>
              <h2 className="dialog-title text-muted mt-md-1">¡Feliz Cumpleaños!</h2>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-dialog-card {
          background-image: url('/img/birthdays/GlobosINT2.gif');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          width: 100%;
          height: 384px;
          border-radius: 10px;
          padding: 25px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }
        .card-video-overlay {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          z-index: 2;
          pointer-events: none;
        }
        .card-content {
          position: relative;
          z-index: 3;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .dialog-title {
          line-height: 28px;
          font-size: 20px;
          font-weight: normal;
        }
        .dialog-body {
          margin-bottom: 30px;
          line-height: 1.6;
        }
        .img-profile {
          border: 2px solid #4285F4;
          height: 146px !important;
          width: 146px !important;
          object-fit: cover;
        }
        .main-btn {
          background: linear-gradient(to bottom right, #4285F4, #1A5BC9);
          border-radius: 50px;
          border: none;
          font-size: 16px;
          font-weight: bold;
          width: 100%;
          min-height: 48px;
          height: auto;
          cursor: default;
          white-space: normal;
          overflow: visible;
          word-break: break-word;
        }
        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(54, 120, 231, 0.8);
          border: none;
          color: white;
          padding: 5px 7.5px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 20;
          transition: background 0.3s;
        }
        .nav-btn.left  { left: -12.5px; }
        .nav-btn.right { right: -12.5px; }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .default-avatar-icon { font-size: 7rem; }
        @media (max-width: 1199px) {
          .custom-dialog-card { height: 150px !important; }
          .img-profile { height: 116px !important; width: 116px !important; }
          .default-avatar-icon { font-size: 6rem; }
          .dialog-title { font-size: 16px; }
          .main-btn { font-size: 18px; }
        }
        @media (max-width: 800px) {
          .img-profile { height: 80px !important; width: 80px !important; }
          .default-avatar-icon { font-size: 4.5rem; }
        }
        @media (max-width: 576px) {
          .custom-dialog-card { height: 80px !important; }
          .img-profile { height: 70px !important; width: 70px !important; }
          .default-avatar-icon { font-size: 3.5rem; }
          .dialog-title { font-size: 14px; }
          .main-btn { font-size: 14px; font-weight: bold; width: 100%; height: 30px; }
        }
      `}</style>
    </div>
  );
}
