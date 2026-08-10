"use client";

import { useEffect, useState } from "react";

export default function ChatSoporteButton() {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    setIsLogged(!!localStorage.getItem("token"));
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
        <img src="/img/chat/logo.svg" alt="" style={{ width: "55%" }} />
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
