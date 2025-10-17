import React, { useEffect, useRef } from "react";

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
}

const Confetti = ({
  active,
  duration = 3000,
  particleCount = 100,
  colors = [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#CDDC39",
    "#FFEB3B",
    "#FFC107",
    "#FF9800",
    "#FF5722",
  ],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const particles = useRef<any[]>([]);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

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

    // Prevent memory leaks by limiting particle count based on screen size
    const safeParticleCount = Math.min(
      particleCount,
      Math.floor((window.innerWidth * window.innerHeight) / 5000),
    );

    // Create particles
    particles.current = [];
    for (let i = 0; i < safeParticleCount; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        oscillationSpeed: Math.random() * 2 + 1,
        oscillationDistance: Math.random() * 5 + 5,
      });
    }

    startTime.current = Date.now();

    // Animation loop
    const animate = () => {
      const elapsed = Date.now() - startTime.current;
      if (elapsed > duration) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((particle) => {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);

        // Draw confetti particle
        ctx.fillStyle = particle.color;
        ctx.fillRect(
          -particle.size / 2,
          -particle.size / 2,
          particle.size,
          particle.size / 2,
        );

        ctx.restore();

        // Update particle position
        particle.y += particle.speed;
        particle.x +=
          Math.sin(elapsed * 0.001 * particle.oscillationSpeed) *
          particle.oscillationDistance;
        particle.rotation += particle.rotationSpeed;

        // Reset particle if it goes off screen
        if (particle.y > canvas.height) {
          if (elapsed < duration * 0.8) {
            particle.y = -particle.size;
            particle.x = Math.random() * canvas.width;
          }
        }
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener("resize", updateCanvasSize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, colors, duration, particleCount]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
};

export default Confetti;
