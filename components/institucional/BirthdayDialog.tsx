"use client";

import { useState } from "react";

interface BirthdayDialogProps {
  birthdays: any[];
  onClose: () => void;
}

export default function BirthdayDialog({ birthdays, onClose }: BirthdayDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  if (!birthdays || birthdays.length === 0) return null;

  const person = birthdays[currentIndex];

  return (
    <div className="custom-overlay" onClick={onClose}>
      <div className="custom-dialog-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="ballon-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/birthdays/ballon.gif" className="ballon-img" alt="globos" />
        </div>

        {birthdays.length > 1 && (
          <>
            <button
              className="nav-btn left"
              onClick={() => setCurrentIndex((i) => (i > 0 ? i - 1 : birthdays.length - 1))}
            >
              <i className="fas fa-chevron-left" />
            </button>
            <button
              className="nav-btn right"
              onClick={() => setCurrentIndex((i) => (i < birthdays.length - 1 ? i + 1 : 0))}
            >
              <i className="fas fa-chevron-right" />
            </button>
          </>
        )}

        <div className="dialog-body text-center">
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

          <h2 className="dialog-title text-white">¡Feliz Cumpleaños!</h2>

          <button className="btn mt-4 px-4 py-2 text-white main-btn">
            {person.lastname_name}
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          animation: fadeIn 0.3s ease;
        }
        .custom-dialog-card {
          background: #4B5667;
          width: 336px;
          height: 413px;
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          border: 0.5px solid #FFF;
          animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }
        .close-btn {
          background: rgba(0,0,0,0.5);
          color: #FFF;
          border: none;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          position: absolute;
          top: 15px; right: 15px;
          width: 32px; height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 30;
          line-height: 1;
        }
        .ballon-container {
          position: absolute;
          top: 75px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          pointer-events: none;
        }
        .ballon-img { width: 250px; height: auto; }
        .dialog-body {
          position: relative;
          z-index: 20;
          padding-top: 60px;
        }
        .img-profile {
          border: 1px solid #4285F4;
          height: 175px !important;
          width: 175px !important;
          object-fit: cover;
        }
        .dialog-title {
          font-size: 24px;
          font-weight: 400;
          line-height: 33.6px;
          margin: 0;
        }
        .main-btn {
          background: linear-gradient(to bottom right, #4285F4, #1A5BC9);
          border-radius: 60px;
          border: none;
          font-size: 16px;
          font-weight: bold;
          line-height: 33.6px;
          width: 245px;
          min-height: 58px;
          height: auto;
          white-space: normal;
          word-break: break-word;
          padding: 0 15px;
          cursor: default;
        }
        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(54, 120, 231, 0.8);
          border: none;
          color: white;
          padding: 5.5px 7.5px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 30;
        }
        .nav-btn.left { left: 5px; }
        .nav-btn.right { right: 5px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
