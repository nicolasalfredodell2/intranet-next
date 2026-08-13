"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const PHRASES = [
  "Chat soporte",
  "¿Necesitás ayuda?",
  "Estamos para ayudarte",
  "¿Tenés alguna consulta?",
];

const CHAT_URL = "https://im.tribcuentasrionegro.gov.ar/livechat?mode=popout";

export default function ChatSoporteButton() {
  const pathname = usePathname();
  const isInstitucional = pathname.startsWith("/institucional");

  const [isLogged, setIsLogged] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const phraseIndexRef = useRef(0);

  useEffect(() => {
    setIsLogged(!!localStorage.getItem("token"));
    setIsHidden(localStorage.getItem("chatSoporteHidden") === "true");
  }, []);

  function toggleHidden(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !isHidden;
    setIsHidden(next);
    localStorage.setItem("chatSoporteHidden", String(next));
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 800);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isInstitucional) return;
    const interval = setInterval(() => {
      setBubble(PHRASES[phraseIndexRef.current % PHRASES.length]);
      phraseIndexRef.current += 1;
      setTimeout(() => setBubble(null), 4500);
    }, 60000);
    return () => clearInterval(interval);
  }, [isInstitucional]);

  if (!isLogged) return null;

  function openChat() {
    setBubble(null);
    setChatOpen(true);
  }

  function closeChat() {
    setChatOpen(false);
  }

  if (chatOpen) {
    return (
      <>
        <div className="chat-soporte-panel">
          <div className="chat-soporte-panel-header">
            <span>Chat soporte</span>
            <button type="button" onClick={closeChat} aria-label="Cerrar chat" title="Cerrar chat" className="chat-soporte-panel-close">
              <i className="pi pi-times" />
            </button>
          </div>
          <iframe src={CHAT_URL} title="Chat soporte" className="chat-soporte-iframe" />
        </div>

        <style jsx>{`
          .chat-soporte-panel {
            position: fixed;
            right: 28px;
            bottom: 28px;
            width: 380px;
            height: 580px;
            max-height: calc(100vh - 56px);
            display: flex;
            flex-direction: column;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
            z-index: 1050;
          }
          .chat-soporte-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: linear-gradient(to bottom right, #4285f4, #1a5bc9);
            color: #fff;
            font-weight: 700;
            font-size: 0.9rem;
          }
          .chat-soporte-panel-close {
            background: rgba(255, 255, 255, 0.18);
            border: none;
            color: #fff;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 0.75rem;
            transition: background 0.15s ease;
          }
          .chat-soporte-panel-close:hover {
            background: rgba(255, 255, 255, 0.32);
          }
          .chat-soporte-iframe {
            flex: 1;
            width: 100%;
            border: none;
            background: #fff;
          }
          @media (max-width: 480px) {
            .chat-soporte-panel {
              right: 0;
              bottom: 0;
              width: 100vw;
              height: 100vh;
              max-height: 100vh;
              border-radius: 0;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <div className={`chat-soporte-wrap${isHidden ? " chat-soporte-wrap--hidden" : ""}`}>
        {bubble && isInstitucional && !isHidden && (
          <div className="chat-soporte-bubble" onClick={openChat}>
            {bubble}
          </div>
        )}

        {!isHidden && (
          <button
            type="button"
            title="Ocultar chat soporte"
            aria-label="Ocultar chat soporte"
            className="chat-soporte-hide-btn"
            onClick={toggleHidden}
          >
            <i className="pi pi-eye-slash" />
          </button>
        )}

        <button
          type="button"
          title={isHidden ? "Mostrar chat soporte" : "Chat soporte"}
          aria-label={isHidden ? "Mostrar chat soporte" : "Chat soporte"}
          className="chat-soporte-fab"
          onClick={isHidden ? toggleHidden : openChat}
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
          transition: right 0.3s ease, transform 0.3s ease;
          z-index: 1050;
        }
        .chat-soporte-wrap--hidden {
          right: 0;
          transform: translateX(50%);
        }
        .chat-soporte-wrap--hidden .chat-soporte-img {
          transform: rotate(-90deg);
        }
        .chat-soporte-hide-btn {
          position: absolute;
          top: -6px;
          left: -6px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: #fff;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          z-index: 2;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .chat-soporte-hide-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
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
          box-shadow:
            rgba(0, 0, 0, 0.2) 0px 4px 10px,
            rgba(0, 0, 0, 0.25) 0px 4px 10px,
            0 0 8px 1px rgba(66, 133, 244, 0.25),
            0 0 16px 3px rgba(66, 133, 244, 0.12);
          cursor: pointer;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          animation: chatSoporteNeonPulse 2.8s ease-in-out infinite;
        }
        .chat-soporte-fab:hover {
          transform: scale(1.08);
        }
        @keyframes chatSoporteNeonPulse {
          0%, 100% {
            box-shadow:
              rgba(0, 0, 0, 0.2) 0px 4px 10px,
              rgba(0, 0, 0, 0.25) 0px 4px 10px,
              0 0 8px 1px rgba(66, 133, 244, 0.25),
              0 0 16px 3px rgba(66, 133, 244, 0.12);
          }
          50% {
            box-shadow:
              rgba(0, 0, 0, 0.2) 0px 4px 10px,
              rgba(0, 0, 0, 0.25) 0px 4px 10px,
              0 0 10px 2px rgba(66, 133, 244, 0.35),
              0 0 20px 5px rgba(66, 133, 244, 0.16);
          }
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
