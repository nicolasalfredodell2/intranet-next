"use client";

import { useEffect, useState } from "react";

interface BirthdayProps {
  birthdays: any[];
  isLoading: boolean;
  onShowDialog?: () => void;
}

export default function Birthday({ birthdays, isLoading, onShowDialog }: BirthdayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";

  const prev = () =>
    setCurrentIndex((i) => (i > 0 ? i - 1 : birthdays.length - 1));
  const next = () =>
    setCurrentIndex((i) => (i < birthdays.length - 1 ? i + 1 : 0));

  if (isLoading) return null;
  if (!birthdays || birthdays.length === 0) return null;

  const person = birthdays[currentIndex];

  return (
    <div className="mb-3">
      <div className="birthday-card position-relative animated fadeIn">
        {birthdays.length > 1 && (
          <>
            <button className="birthday-nav left" onClick={prev}>
              <i className="fas fa-chevron-left" />
            </button>
            <button className="birthday-nav right" onClick={next}>
              <i className="fas fa-chevron-right" />
            </button>
          </>
        )}

        <div className="birthday-overlay" />

        <img
          src="/img/birthdays/GlobosINT2.gif"
          alt="cumpleaños"
          className="birthday-bg"
        />

        <div className="birthday-content text-center">
          {person.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${apiUrl}/storage/${person.avatar_url}`}
              alt={person.lastname_name}
              className="birthday-avatar rounded-circle"
            />
          ) : (
            <i className="mdi mdi-account-circle text-white" style={{ fontSize: "5rem" }} />
          )}

          <button
            className="btn birthday-name-btn mt-2 text-white pointer"
            onClick={onShowDialog}
          >
            {person.lastname_name}
          </button>

          <p className="text-white mt-1 mb-0" style={{ fontSize: "0.85rem" }}>
            ¡Feliz Cumpleaños!
          </p>
        </div>
      </div>

      <style jsx>{`
        .birthday-card {
          border-radius: 15px;
          overflow: hidden;
          height: 384px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 1199px) {
          .birthday-card { height: 150px; }
        }
        @media (max-width: 768px) {
          .birthday-card { height: 80px; }
        }
        .birthday-bg {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .birthday-overlay {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.35);
          z-index: 1;
        }
        .birthday-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .birthday-avatar {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border: 2px solid #4285F4;
        }
        @media (max-width: 768px) {
          .birthday-avatar { width: 45px; height: 45px; }
        }
        .birthday-name-btn {
          background: linear-gradient(to bottom right, #4285F4, #1A5BC9);
          border-radius: 60px;
          border: none;
          font-size: 0.85rem;
          font-weight: bold;
          padding: 6px 16px;
          white-space: normal;
          word-break: break-word;
          max-width: 200px;
        }
        @media (max-width: 768px) {
          .birthday-name-btn { font-size: 0.7rem; padding: 3px 10px; }
        }
        .birthday-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(54, 120, 231, 0.85);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }
        .birthday-nav.left { left: 8px; }
        .birthday-nav.right { right: 8px; }
      `}</style>
    </div>
  );
}
