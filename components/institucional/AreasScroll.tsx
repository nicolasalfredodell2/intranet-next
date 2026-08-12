"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const AUTO_SCROLL_SPEED = 0.4; // px por frame

interface AreasScrollProps {
  areas: any[];
}

export default function AreasScroll({ areas }: AreasScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isDown = useRef(false);
  const isHovering = useRef(false);
  const isManualScrolling = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const onMouseEnter = () => { isHovering.current = true; };
  const onMouseLeave = () => { isDown.current = false; isHovering.current = false; };
  const onMouseUp = () => { isDown.current = false; };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft ?? 0);
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Anima el scroll manualmente (en vez de scroll-behavior/scrollBy nativos) para que no
  // quede peleando frame a frame con el auto-scroll, que asigna scrollLeft directamente.
  const scrollSide = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const start = el.scrollLeft;
    const target = start + (dir === "left" ? -270 : 270);
    const duration = 350;
    const startTime = performance.now();
    isManualScrolling.current = true;

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      el.scrollLeft = start + (target - start) * eased;
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        isManualScrolling.current = false;
      }
    };
    requestAnimationFrame(animate);
  };

  // Desplazamiento automático continuo: avanza lentamente y al llegar a un
  // extremo invierte el sentido, como un vaivén. Se pausa mientras el
  // usuario arrastra manualmente.
  const direction = useRef(1);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let rafId: number;

    const step = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (!isDown.current && !isHovering.current && !isManualScrolling.current && maxScroll > 0) {
        el.scrollLeft += AUTO_SCROLL_SPEED * direction.current;
        if (el.scrollLeft >= maxScroll) {
          el.scrollLeft = maxScroll;
          direction.current = -1;
        } else if (el.scrollLeft <= 0) {
          el.scrollLeft = 0;
          direction.current = 1;
        }
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [areas]);

  const openArea = (area: any) => {
    if (!area.info_area_id) return;
    router.push(`/institucional/area/${area.id}`);
  };

  if (!areas || areas.length === 0) return null;

  return (
    <div className="carousel-container">
      <button className="nav-arrow left" onClick={() => scrollSide("left")}>&#10094;</button>

      <div
        className="areas-wrapper"
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {areas.map((area: any, i: number) => (
          <div
            key={area.id}
            className={`area-item bg-${i % 2}`}
            onClick={() => openArea(area)}
          >
            <span className="area-text">{area.title?.toUpperCase()}</span>
          </div>
        ))}
      </div>

      <button className="nav-arrow right" onClick={() => scrollSide("right")}>&#10095;</button>

      <style jsx>{`
        .carousel-container {
          position: relative;
          width: 100%;
          height: 127px;
          display: flex;
          align-items: center;
        }
        .nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: #000;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          font-size: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .nav-arrow:hover { background: rgba(255,255,255,0.3); }
        .nav-arrow.left { left: 10px; }
        .nav-arrow.right { right: 10px; }
        .areas-wrapper {
          box-shadow: rgba(0,0,0,0.16) 0px 3px 6px, rgba(0,0,0,0.23) 0px 3px 6px;
          display: flex;
          overflow-x: auto;
          white-space: nowrap;
          cursor: grab;
          user-select: none;
          width: 100%;
          scrollbar-width: none;
        }
        .areas-wrapper::-webkit-scrollbar { display: none; }
        .areas-wrapper:active { cursor: grabbing; }
        .area-item {
          flex: 0 0 250px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 20px;
          transition: filter 0.3s;
          cursor: pointer;
        }
        .area-item:hover { filter: brightness(1.1); }
        .area-text {
          color: white;
          font-family: 'Montserrat';
          font-weight: bold;
          font-size: 12px;
          text-align: center;
          word-wrap: break-word;
          white-space: normal;
        }
        .bg-0 { background-color: #6C7686; }
        .bg-1 { background-color: #7E899C; }
        @media (max-width: 1000px) {
          .nav-arrow { width: 32px; height: 32px; font-size: 16px; }
          .nav-arrow.left { left: 5px; }
          .nav-arrow.right { right: 5px; }
        }
        @media (max-width: 576px) {
          .area-item {
            box-shadow: rgba(99,99,99,0.2) 0px 2px 8px 0px;
            flex: 0 0 140px;
            height: 140px;
            margin: 10px;
            border-radius: 30px;
            padding: 0 12px;
          }
          .areas-wrapper { box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
