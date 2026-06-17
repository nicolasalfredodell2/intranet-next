"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

interface AreasScrollProps {
  areas: any[];
}

export default function AreasScroll({ areas }: AreasScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const onMouseLeave = () => { isDown.current = false; };
  const onMouseUp = () => { isDown.current = false; };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft ?? 0);
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const scrollSide = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollLeft += dir === "left" ? -270 : 270;
  };

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
          scroll-behavior: smooth;
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
