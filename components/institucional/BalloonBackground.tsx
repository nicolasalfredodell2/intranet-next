"use client";

import { useEffect, useRef } from "react";

interface ColorSet {
  base: string;
  light: string;
  dark: string;
}

const COLORS: ColorSet[] = [
  { base: "#ff2e63", light: "#ff6b8f", dark: "#9d0b2e" },
  { base: "#00d2ff", light: "#80eaff", dark: "#006a80" },
  { base: "#ffd700", light: "#fff080", dark: "#998100" },
  { base: "#9d50bb", light: "#c089d8", dark: "#4f285e" },
  { base: "#43e97b", light: "#a6f7c1", dark: "#1e6a38" },
  { base: "#ff9a9e", light: "#fecfef", dark: "#cc7a7e" },
  { base: "#00c9ff", light: "#92fe9d", dark: "#00607a" },
];

interface BalloonBackgroundProps {
  balloonCount?: number;
}

// Fondo animado de globos que suben y explotan al pasar el mouse por encima.
// Se dibuja en un <canvas> del tamaño del contenedor padre (no del viewport),
// para poder usarse contenido dentro de una card.
export default function BalloonBackground({ balloonCount = 12 }: BalloonBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    // Tipo declarado (no solo angostado) para que los métodos de las clases
    // de más abajo, que capturan esta variable, la vean siempre no-nula.
    const ctx: CanvasRenderingContext2D = ctx2d;

    // Tamaño en pixeles CSS (no de dispositivo) del contenedor: todas las
    // posiciones/tamaños se calculan sobre esto, el DPR solo escala el dibujo.
    let width = 0;
    let height = 0;

    let balloons: Balloon[] = [];
    let particles: Particle[] = [];
    const mouse = { x: -2000, y: -2000 };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      gravity = 0.2;
      opacity = 1;
      color: string;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 12;
        this.speedY = (Math.random() - 0.5) * 12;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.opacity -= 0.025;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class Balloon {
      x = 0;
      y = 0;
      r = 0;
      speed = 0;
      angle = 0;
      wobbleSpeed = 0;
      popped = false;
      colorSet: ColorSet = COLORS[0];

      tailMidY = 0;
      tailEndY = 0;
      tailVelMid = 0;
      tailVelEnd = 0;
      prevX = 0;
      popTimeout: ReturnType<typeof setTimeout> | null = null;

      constructor(firstLoad: boolean) {
        this.init(firstLoad);
      }

      init(firstLoad: boolean) {
        this.r = Math.random() * 10 + 18;
        this.x = Math.random() * width;
        this.y = firstLoad ? Math.random() * height : height + this.r + 120;

        this.colorSet = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.speed = Math.random() * 0.8 + 0.35;
        this.wobbleSpeed = Math.random() * 0.02 + 0.01;
        this.angle = Math.random() * Math.PI * 2;
        this.popped = false;

        this.prevX = this.x;
        this.tailMidY = this.r + 25;
        this.tailEndY = this.r + 70;
        this.tailVelMid = 0;
        this.tailVelEnd = 0;
      }

      drawBalloonPath(r: number) {
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.bezierCurveTo(-r * 1.2, r * 0.8, -r * 1.3, -r * 1.2, 0, -r * 1.2);
        ctx.bezierCurveTo(r * 1.3, -r * 1.2, r * 1.2, r * 0.8, 0, r);
        ctx.closePath();
      }

      drawString() {
        const dx = this.x - this.prevX;
        this.prevX = this.x;

        const stiffness = 0.08;
        const damping = 0.85;
        const gravity = 0.35;

        const midTarget = this.r + 25 + Math.abs(dx) * 8;
        this.tailVelMid += (midTarget - this.tailMidY) * stiffness;
        this.tailVelMid *= damping;
        this.tailMidY += this.tailVelMid;

        const endTarget = this.r + 70 + Math.abs(dx) * 14;
        this.tailVelEnd += (endTarget - this.tailEndY) * stiffness;
        this.tailVelEnd *= damping;
        this.tailVelEnd += gravity;
        this.tailEndY += this.tailVelEnd;

        const sway = Math.sin(this.angle * 1.8) * 5 + dx * 4;

        ctx.beginPath();
        ctx.moveTo(0, this.r + 4);
        ctx.bezierCurveTo(sway, this.tailMidY * 0.5, -sway, this.tailMidY, sway * 0.6, this.tailEndY);
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }

      pop() {
        if (this.popped) return;
        this.popped = true;

        for (let i = 0; i < 14; i++) {
          particles.push(new Particle(this.x, this.y, this.colorSet.base));
        }

        this.popTimeout = setTimeout(() => this.init(false), 800 + Math.random() * 800);
      }

      update() {
        if (this.popped) return;

        this.y -= this.speed;
        this.angle += this.wobbleSpeed;
        this.x += Math.sin(this.angle * 0.6) * 0.6;

        const dx = this.x - mouse.x;
        const dy = this.y - this.r * 0.2 - mouse.y;
        if (Math.sqrt(dx * dx + dy * dy) < this.r + 8) {
          this.pop();
        }

        if (this.y < -this.r - 120) this.init(false);

        this.draw();
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.sin(this.angle) * 0.06);

        this.drawString();

        this.drawBalloonPath(this.r);
        const grad = ctx.createRadialGradient(-this.r * 0.3, -this.r * 0.5, this.r * 0.1, 0, 0, this.r * 1.5);
        grad.addColorStop(0, this.colorSet.light);
        grad.addColorStop(0.4, this.colorSet.base);
        grad.addColorStop(1, this.colorSet.dark);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.92;
        ctx.fill();

        ctx.restore();
      }

      dispose() {
        if (this.popTimeout) clearTimeout(this.popTimeout);
      }
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      balloons.forEach((b) => b.dispose());
      balloons = [];
      for (let i = 0; i < balloonCount; i++) balloons.push(new Balloon(true));
    };

    let rafId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles = particles.filter((p) => p.opacity > 0);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      balloons.forEach((b) => b.update());

      rafId = requestAnimationFrame(animate);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const onMouseLeave = () => {
      mouse.x = -2000;
      mouse.y = -2000;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    resize();
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      balloons.forEach((b) => b.dispose());
    };
  }, [balloonCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none", zIndex: 1 }}
    />
  );
}
