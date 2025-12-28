import React, { useEffect, useRef } from 'react';
import { SnowFlake } from '../types';
import { CONFIG } from '../constants';

const Snowfall: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const snowflakes: SnowFlake[] = [];

    // Init snow
    for(let i = 0; i < CONFIG.snowCount; i++) {
      snowflakes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        z: Math.random() * 2 + 0.5, // Depth for parallax
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 1 + 0.5,
        wind: (Math.random() - 0.5) * 0.5
      });
    }

    let animationId: number;

    const render = () => {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';

      snowflakes.forEach(flake => {
        ctx.beginPath();
        // Parallax: smaller flakes move slower
        ctx.arc(flake.x, flake.y, flake.radius * (flake.z * 0.5), 0, Math.PI * 2);
        ctx.globalAlpha = 0.6 * (flake.z * 0.3); // Further away = more transparent
        ctx.fill();

        // Update Position
        flake.y += flake.speed * flake.z;
        flake.x += flake.wind * flake.z;

        // Reset if out of bounds
        if (flake.y > window.innerHeight) {
          flake.y = -10;
          flake.x = Math.random() * window.innerWidth;
        }
        if (flake.x > window.innerWidth) {
            flake.x = 0;
        } else if (flake.x < 0) {
            flake.x = window.innerWidth;
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none" />;
};

export default Snowfall;