import React, { useEffect, useRef } from 'react';

interface ParticleSwarmCanvasProps {
  theme?: 'dark' | 'light';
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  baseRadius: number;
  alpha: number;
  phase: number;
}

export const ParticleSwarmCanvas: React.FC<ParticleSwarmCanvasProps> = ({
  theme = 'dark',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const updateDimensions = () => {
      if (!canvas) return;
      const w = window.innerWidth || 800;
      const h = window.innerHeight || 600;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    };

    updateDimensions();

    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener('resize', handleResize);

    // Generate Particle Swarm (Finer micro-particles with 750 points)
    const NUM_PARTICLES = 750;
    const particles: Particle[] = [];

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 1600,
        y: (Math.random() - 0.5) * 1600,
        z: (Math.random() - 0.5) * 1600,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        baseRadius: Math.random() * 0.9 + 0.5, // Finer micro dots instead of big spheres
        alpha: Math.random() * 0.35 + 0.65,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      // Slower, elegant, fluid motion step
      time += 0.0025;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Top-Left quadrant positioning for the swarm center
      const centerX = Math.max(260, width * 0.32);
      const centerY = Math.max(240, height * 0.32);

      // Morphing Shape Parameters
      const morphFactor = (Math.sin(time * 0.15) + 1) / 2; // 0 to 1

      const rotX = time * 0.04;
      const rotY = time * 0.06;

      const cosRX = Math.cos(rotX);
      const sinRX = Math.sin(rotX);
      const cosRY = Math.cos(rotY);
      const sinRY = Math.sin(rotY);

      const mappedPoints: Array<{ x: number; y: number; z: number; alpha: number }> = [];

      // Color Palette based on Theme
      const particleColor = isDark ? '#00f0ff' : '#1d4ed8'; // electric cyan vs vivid blue
      const accentColor = isDark ? '#38bdf8' : '#2563eb';   // sky blue vs blue-600
      const brightDotColor = isDark ? '#ffffff' : '#0284c7'; // sharp highlight points
      const lineBaseColor = isDark ? '0, 240, 255' : '29, 78, 216';

      particles.forEach((p, idx) => {
        const u = (idx / NUM_PARTICLES) * Math.PI * 2 + time * 0.05;
        const v = (idx % 23) * (Math.PI / 11) + time * 0.025;

        // Large Physical Scale
        const R = 640 + Math.sin(time * 0.2 + p.phase) * 160;
        const rTorus = 200 + Math.cos(time * 0.3 + idx) * 70;

        const targetX1 = (R + rTorus * Math.cos(v)) * Math.cos(u);
        const targetY1 = (R + rTorus * Math.cos(v)) * Math.sin(u);
        const targetZ1 = rTorus * Math.sin(v);

        const targetX2 = Math.sin(u * 2 + time * 0.25) * 720;
        const targetY2 = Math.cos(u * 3 + time * 0.2) * 620;
        const targetZ2 = Math.sin(u * 5 + time * 0.15) * 520;

        const targetX = targetX1 * (1 - morphFactor) + targetX2 * morphFactor;
        const targetY = targetY1 * (1 - morphFactor) + targetY2 * morphFactor;
        const targetZ = targetZ1 * (1 - morphFactor) + targetZ2 * morphFactor;

        p.vx += (targetX - p.x) * 0.0015;
        p.vy += (targetY - p.y) * 0.0015;
        p.vz += (targetZ - p.z) * 0.0015;

        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vz *= 0.96;

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        let x1 = p.x * cosRY - p.z * sinRY;
        let z1 = p.x * sinRY + p.z * cosRY;
        let y1 = p.y * cosRX - z1 * sinRX;
        let z2 = p.y * sinRX + z1 * cosRX;

        const focalLength = 550;
        const scale = focalLength / (focalLength + z2 + 400);

        const px = centerX + x1 * scale;
        const py = centerY + y1 * scale;

        mappedPoints.push({ x: px, y: py, z: z2, alpha: p.alpha * scale });

        // Draw Fine Micro Dot (Crisp small dots)
        const radius = Math.max(0.7, p.baseRadius * scale * 0.85);
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = idx % 5 === 0 ? brightDotColor : (idx % 2 === 0 ? accentColor : particleColor);
        ctx.globalAlpha = Math.min(1, Math.max(0.5, p.alpha * scale * (isDark ? 0.95 : 0.85)));
        ctx.fill();
      });

      // Draw Sharp Proximity Connections
      ctx.lineWidth = isDark ? 0.95 : 1.05;
      for (let i = 0; i < mappedPoints.length; i += 2) {
        for (let j = i + 1; j < mappedPoints.length; j += 3) {
          const pt1 = mappedPoints[i];
          const pt2 = mappedPoints[j];
          const dx = pt1.x - pt2.x;
          const dy = pt1.y - pt2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 4600) {
            const alpha = (1 - distSq / 4600) * 0.35 * Math.min(pt1.alpha, pt2.alpha);
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.strokeStyle = `rgba(${lineBaseColor}, ${alpha})`;
            ctx.globalAlpha = alpha;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-screen h-screen pointer-events-none z-20 transition-opacity duration-500 ${className}`}
    />
  );
};
