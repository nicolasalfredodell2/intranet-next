"use client";

import { useEffect, useState } from "react";

export default function ChatSoporteButton() {
  const [isLogged, setIsLogged] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setIsLogged(!!localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 800);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  if (!isLogged) return null;

  return (
    <>
      <button
        type="button"
        title="Chat soporte"
        aria-label="Chat soporte"
        className="chat-soporte-fab"
        onClick={() => window.open("https://im.tribcuentasrionegro.gov.ar/livechat?mode=popout", "_blank")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/chat/logo.svg" alt="" className={animate ? "chat-soporte-img chat-soporte-img-animate" : "chat-soporte-img"} style={{ width: "55%" }} />
      </button>

      <style jsx>{`
        .chat-soporte-fab {
          position: fixed;
          right: 28px;
          bottom: 28px;
          width: 84px;
          height: 84px;
          border-radius: 50%;
          border: none;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(to bottom right, #4285f4, #1a5bc9);
          box-shadow: rgba(0, 0, 0, 0.2) 0px 4px 10px, rgba(0, 0, 0, 0.25) 0px 4px 10px;
          cursor: pointer;
          transition: transform 0.2s ease-in-out;
          z-index: 1050;
        }
        .chat-soporte-fab:hover {
          transform: scale(1.08);
        }
        .chat-soporte-img {
          display: block;
        }
        .chat-soporte-img-animate {
          animation: chatSoporteBounce 0.8s ease-in-out;
        }
        @keyframes chatSoporteBounce {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          20% {
            transform: scale(1.2) rotate(-10deg);
          }
          40% {
            transform: scale(1) rotate(10deg);
          }
          60% {
            transform: scale(1.12) rotate(-6deg);
          }
          80% {
            transform: scale(1) rotate(6deg);
          }
        }
        @media (max-width: 480px) {
          .chat-soporte-fab {
            right: 18px;
            bottom: 18px;
            width: 68px;
            height: 68px;
          }
        }
      `}</style>
    </>
  );
}
