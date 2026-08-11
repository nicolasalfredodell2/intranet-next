"use client";

import { useEffect, useRef, useState } from "react";

const PHRASES = [
  "Chat soporte",
  "¿Necesitás ayuda?",
  "Estamos para ayudarte",
  "¿Tenés alguna consulta?",
];

const CHAT_URL = "https://im.tribcuentasrionegro.gov.ar/livechat?mode=popout";

export default function ChatSoporteButton() {
  const [isLogged, setIsLogged] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const phraseIndexRef = useRef(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setBubble(PHRASES[phraseIndexRef.current % PHRASES.length]);
      phraseIndexRef.current += 1;
      setTimeout(() => setBubble(null), 4500);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isLogged) return null;

  function openChat() {
    window.open(CHAT_URL, "_blank");
  }

  return (
    <>
      <div className="chat-soporte-wrap">
        {bubble && (
          <div className="chat-soporte-bubble" onClick={openChat}>
            {bubble}
          </div>
        )}

        <button
          type="button"
          title="Chat soporte"
          aria-label="Chat soporte"
          className="chat-soporte-fab"
          onClick={openChat}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/chat/logo.svg" alt="" className={animate ? "chat-soporte-img chat-soporte-img-animate" : "chat-soporte-img"} style={{ width: "55%" }} />
        </button>
      </div>

      <style jsx>{`
        .chat-soporte-wrap {
          position: fixed;
          right: 28px;
          bottom: 28px;
          z-index: 1050;
        }
        .chat-soporte-fab {
          position: relative;
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
        .chat-soporte-bubble {
          position: absolute;
          right: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          width: max-content;
          max-width: 220px;
          background: #ffffff;
          color: #1e293b;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.35;
          text-align: center;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
          cursor: pointer;
          animation: chatSoporteBubbleIn 0.25s ease-out;
        }
        .chat-soporte-bubble::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 100%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-left: 8px solid #ffffff;
        }
        @keyframes chatSoporteBubbleIn {
          from {
            opacity: 0;
            transform: translate(8px, -50%);
          }
          to {
            opacity: 1;
            transform: translate(0, -50%);
          }
        }
        @media (max-width: 480px) {
          .chat-soporte-wrap {
            right: 18px;
            bottom: 18px;
          }
          .chat-soporte-fab {
            width: 68px;
            height: 68px;
          }
          .chat-soporte-bubble {
            max-width: 180px;
          }
        }
      `}</style>
    </>
  );
}
