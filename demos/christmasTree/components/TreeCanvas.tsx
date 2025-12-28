import React, { useEffect, useRef } from 'react';
import { Particle, Star, Point3D } from '../types';
import { TREE_COLORS, CONFIG } from '../constants';

const TreeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // --- Initialization ---

    // 1. Generate Tree Particles (Spiral Strips)
    const particles: Particle[] = [];
    
    // Function to create a spiral strand
    const createStrand = (color: string, offsetAngle: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const progress = i / count; // 0 to 1
        
        // Cone shape
        const currentRadius = CONFIG.baseRadius * (1 - progress); 
        
        // Y calculation
        const y = (CONFIG.treeHeight / 2) - (progress * CONFIG.treeHeight) + 50; 
        
        // Spiral angle
        const angle = (progress * CONFIG.spiralLoops * Math.PI * 2) + offsetAngle;
        
        const x = Math.cos(angle) * currentRadius;
        const z = Math.sin(angle) * currentRadius;

        const scatter = 3; 

        particles.push({
          x: x + (Math.random() - 0.5) * scatter,
          y: y + (Math.random() - 0.5) * scatter,
          z: z + (Math.random() - 0.5) * scatter,
          originalX: x,
          originalZ: z,
          color: color,
          size: Math.random() * 2 + 1.5,
          angleOffset: angle,
          wobbleSpeed: Math.random() * 0.05,
          wobblePhase: Math.random() * Math.PI * 2
        });
      }
    };

    createStrand(TREE_COLORS.primary, 0, CONFIG.particleCountPerStrand);
    createStrand(TREE_COLORS.secondary, Math.PI, CONFIG.particleCountPerStrand);

    // 2. Generate Decor Stars (Dots for body)
    const stars: Star[] = [];
    for (let i = 0; i < CONFIG.starCount; i++) {
      const progress = Math.random() * 0.9; // Avoid very top tip
      const currentRadius = CONFIG.baseRadius * (1 - progress);
      const y = (CONFIG.treeHeight / 2) - (progress * CONFIG.treeHeight) + 50;
      const angle = Math.random() * Math.PI * 2;
      
      // Blink speed: Period 3s - 6s
      const minSpeed = 0.017;
      const maxSpeed = 0.035;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

      stars.push({
        x: Math.cos(angle) * (currentRadius + 8), // Just outside the tree
        y: y,
        z: Math.sin(angle) * (currentRadius + 8),
        size: 0,
        baseSize: Math.random() * 1.5 + 1.0, // Smaller, refined dots (1.0 to 2.5)
        phase: Math.random() * Math.PI * 2,
        speed: speed, 
        color: TREE_COLORS.star
      });
    }

    // Helper: Draw 5-point Star
    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string) => {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
    };

    // --- Render Logic ---

    const render = () => {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const focalLength = 800;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const projectedParticles: (Point3D & { 
        color: string, 
        size: number, 
        opacity: number, 
        type: 'dot' | 'bodyStar' 
      })[] = [];

      // Update and Project Tree Particles
      particles.forEach(p => {
        const rotationAngle = time * CONFIG.rotationSpeed;
        const cos = Math.cos(rotationAngle);
        const sin = Math.sin(rotationAngle);

        const rx = p.originalX * cos - p.originalZ * sin;
        const rz = p.originalX * sin + p.originalZ * cos;

        const scale = focalLength / (focalLength + rz);
        const screenX = centerX + rx * scale;
        const screenY = centerY + p.y * scale;

        if (rz > -focalLength) {
            projectedParticles.push({
                x: screenX,
                y: screenY,
                z: rz,
                color: p.color,
                size: p.size * scale,
                opacity: 0.8,
                type: 'dot'
            });
        }
      });

      // Update and Project Body Stars (Decor)
      stars.forEach(s => {
        const rotationAngle = time * CONFIG.rotationSpeed;
        const cos = Math.cos(rotationAngle);
        const sin = Math.sin(rotationAngle);
        
        const rx = s.x * cos - s.z * sin;
        const rz = s.x * sin + s.z * cos;

        const scale = focalLength / (focalLength + rz);
        const screenX = centerX + rx * scale;
        const screenY = centerY + s.y * scale;

        // Twinkle Logic
        const brightness = (Math.sin(time * s.speed + s.phase) + 1) / 2; 
        
        let alpha = 0;
        if (brightness > 0.5) { 
             alpha = (brightness - 0.5) / 0.5; 
        }

        if (rz > -focalLength && alpha > 0.1) {
            projectedParticles.push({
                x: screenX,
                y: screenY,
                z: rz,
                color: s.color,
                size: s.baseSize * scale * 2, 
                opacity: alpha,
                type: 'bodyStar'
            });
        }
      });

      // Sort by Z
      projectedParticles.sort((a, b) => b.z - a.z);

      // Draw projected elements
      projectedParticles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        let r=0, g=0, b=0;
        
        if (p.type === 'bodyStar') {
            // Body decoration (Yellowish dots)
            r=250; g=204; b=21;
            ctx.shadowBlur = 5; 
            ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
        } else {
            // Tree Particle
            if(p.color === TREE_COLORS.primary) { r=29; g=78; b=216; } 
            else if(p.color === TREE_COLORS.secondary) { r=96; g=165; b=250; }
            ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
        ctx.fill();
        ctx.shadowBlur = 0; 
      });

      // --- Draw Top Star (Geometric Shape) ---
      const topY = -CONFIG.treeHeight / 2 + 50; 
      const scaleTop = focalLength / focalLength; 
      const screenTopY = centerY + topY * scaleTop;
      
      // Draw 5-pointed star
      drawStar(centerX, screenTopY - 15, 5, 25, 12, TREE_COLORS.star);

      time += 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
    />
  );
};

export default TreeCanvas;