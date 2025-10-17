import React, { useEffect, useRef } from "react";

interface AnimatedGradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  speed?: number;
}

export function AnimatedGradientBackground({
  children,
  className = "",
  colors = ["#4f46e5", "#8b5cf6", "#d946ef", "#f97316"],
  speed = 3,
}: AnimatedGradientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Create gradient points
    const points = colors.map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      radius: canvas.width / 5,
    }));

    // Animation loop
    const animate = () => {
      // Clear canvas with a slight fade effect for smoother transitions
      ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
      );

      // Update points positions and add gradient stops
      points.forEach((point, index) => {
        // Update position
        point.x += point.vx;
        point.y += point.vy;

        // Bounce off edges
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1;

        // Add gradient stop
        gradient.addColorStop(index / colors.length, colors[index]);
      });

      // Apply gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, [colors, speed]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-20"
        style={{ filter: "blur(100px)" }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
