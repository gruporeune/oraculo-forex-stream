import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const OracleHero = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const grainCanvasRef = useRef(null);
  const frameRef = useRef(0);
  const scrollProgressRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const grainCanvas = grainCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const grainCtx = grainCanvas.getContext('2d');
    
    const density = ' .:-=+*#%@';
    
    const params = {
      rotation: 0,
      atmosphereShift: 0,
      glitchIntensity: 0,
      glitchFrequency: 0
    };

    gsap.to(params, {
      rotation: Math.PI * 2,
      duration: 20,
      repeat: -1,
      ease: "none"
    });
    
    gsap.to(params, {
      atmosphereShift: 1,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Glitch animation
    gsap.to(params, {
      glitchIntensity: 1,
      duration: 0.1,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut",
      repeatDelay: Math.random() * 3 + 1
    });

    gsap.to(params, {
      glitchFrequency: 1,
      duration: 0.05,
      repeat: -1,
      yoyo: true,
      ease: "none"
    });

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom top",
      scrub: 1,
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
      }
    });

    // Film grain generation
    const generateFilmGrain = (width, height, intensity = 0.15) => {
      const imageData = grainCtx.createImageData(width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const grain = (Math.random() - 0.5) * intensity * 255;
        data[i] = Math.max(0, Math.min(255, 128 + grain));
        data[i + 1] = Math.max(0, Math.min(255, 128 + grain));
        data[i + 2] = Math.max(0, Math.min(255, 128 + grain));
        data[i + 3] = Math.abs(grain) * 3;
      }
      
      return imageData;
    };

    // Glitch effect functions
    const drawGlitchedOrb = (centerX, centerY, radius, hue, time, glitchIntensity) => {
      // Save the current state
      ctx.save();
      
      // Random glitch triggers
      const shouldGlitch = Math.random() < 0.1 && glitchIntensity > 0.5;
      const glitchOffset = shouldGlitch ? (Math.random() - 0.5) * 20 * glitchIntensity : 0;
      const glitchScale = shouldGlitch ? 1 + (Math.random() - 0.5) * 0.3 * glitchIntensity : 1;
      
      // Apply glitch transformations
      if (shouldGlitch) {
        ctx.translate(glitchOffset, glitchOffset * 0.8);
        ctx.scale(glitchScale, 1 / glitchScale);
      }
      
      // Main orb gradient with ORÁCULO colors
      const orbGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius * 1.5
      );
      
      orbGradient.addColorStop(0, `hsla(280, 100%, 95%, 0.9)`); // Purple-pink
      orbGradient.addColorStop(0.2, `hsla(260, 90%, 80%, 0.7)`); // Purple
      orbGradient.addColorStop(0.5, `hsla(190, 70%, 50%, 0.4)`); // Cyan
      orbGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = orbGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Bright center circle with glitch
      const centerRadius = radius * 0.3;
      ctx.fillStyle = `hsla(280, 100%, 95%, 0.8)`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Glitch effects on the orb
      if (shouldGlitch) {
        // RGB separation effect
        ctx.globalCompositeOperation = 'screen';
        
        // Red channel offset
        ctx.fillStyle = `hsla(280, 100%, 50%, ${0.6 * glitchIntensity})`;
        ctx.beginPath();
        ctx.arc(centerX + glitchOffset * 0.5, centerY, centerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Blue channel offset
        ctx.fillStyle = `hsla(190, 100%, 50%, ${0.5 * glitchIntensity})`;
        ctx.beginPath();
        ctx.arc(centerX - glitchOffset * 0.5, centerY, centerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';
        
        // Digital noise lines
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * glitchIntensity})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const y = centerY - radius + (Math.random() * radius * 2);
          const startX = centerX - radius + Math.random() * 20;
          const endX = centerX + radius - Math.random() * 20;
          
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();
        }
        
        // Pixelated corruption blocks
        ctx.fillStyle = `rgba(138, 43, 226, ${0.4 * glitchIntensity})`;
        for (let i = 0; i < 3; i++) {
          const blockX = centerX - radius + Math.random() * radius * 2;
          const blockY = centerY - radius + Math.random() * radius * 2;
          const blockSize = Math.random() * 10 + 2;
          ctx.fillRect(blockX, blockY, blockSize, blockSize);
        }
      }
      
      // Outer ring with glitch distortion
      ctx.strokeStyle = `hsla(190, 80%, 70%, 0.6)`;
      ctx.lineWidth = 2;
      
      if (shouldGlitch) {
        // Distorted ring segments
        const segments = 8;
        for (let i = 0; i < segments; i++) {
          const startAngle = (i / segments) * Math.PI * 2;
          const endAngle = ((i + 1) / segments) * Math.PI * 2;
          const ringRadius = radius * 1.2 + (Math.random() - 0.5) * 10 * glitchIntensity;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, startAngle, endAngle);
          ctx.stroke();
        }
      } else {
        // Normal ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Data corruption effect
      if (shouldGlitch && Math.random() < 0.3) {
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * glitchIntensity})`;
        
        // Horizontal glitch bars
        for (let i = 0; i < 3; i++) {
          const barY = centerY - radius + Math.random() * radius * 2;
          const barHeight = Math.random() * 5 + 1;
          ctx.fillRect(centerX - radius, barY, radius * 2, barHeight);
        }
        
        ctx.globalCompositeOperation = 'source-over';
      }
      
      // Restore the context
      ctx.restore();
    };

    function render() {
      timeRef.current += 0.016;
      const time = timeRef.current;
      
      const width = canvas.width = grainCanvas.width = window.innerWidth;
      const height = canvas.height = grainCanvas.height = window.innerHeight;
      
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.2;
      
      // Atmospheric background with ORÁCULO colors
      const bgGradient = ctx.createRadialGradient(
        centerX, centerY - 50, 0,
        centerX, centerY, Math.max(width, height) * 0.8
      );
      
      const hue = 260 + params.atmosphereShift * 40; // Purple to cyan range
      bgGradient.addColorStop(0, `hsla(${hue + 20}, 80%, 60%, 0.4)`);
      bgGradient.addColorStop(0.3, `hsla(${hue}, 60%, 40%, 0.3)`);
      bgGradient.addColorStop(0.6, `hsla(${hue - 60}, 40%, 20%, 0.2)`);
      bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);
      
      // Draw glitched orb
      drawGlitchedOrb(centerX, centerY, radius, hue, time, params.glitchIntensity);
      
      // ASCII sphere particles
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const spacing = 9;
      const cols = Math.floor(width / spacing);
      const rows = Math.floor(height / spacing);
      
      for (let i = 0; i < cols && i < 150; i++) {
        for (let j = 0; j < rows && j < 100; j++) {
          const x = (i - cols / 2) * spacing + centerX;
          const y = (j - rows / 2) * spacing + centerY;
          
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < radius && Math.random() > 0.4) {
            const z = Math.sqrt(Math.max(0, radius * radius - dx * dx - dy * dy));
            const angle = params.rotation;
            const rotZ = dx * Math.sin(angle) + z * Math.cos(angle);
            const brightness = (rotZ + radius) / (radius * 2);
            
            if (rotZ > -radius * 0.3) {
              const charIndex = Math.floor(brightness * (density.length - 1));
              let char = density[charIndex];
              
              // Glitch the ASCII characters near the orb
              if (dist < radius * 0.8 && params.glitchIntensity > 0.8 && Math.random() < 0.3) {
                const glitchChars = ['█', '▓', '▒', '░', '▄', '▀', '■', '□'];
                char = glitchChars[Math.floor(Math.random() * glitchChars.length)];
              }
              
              const alpha = Math.max(0.2, brightness);
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.fillText(char, x, y);
            }
          }
        }
      }
      
      // Generate and render film grain
      grainCtx.clearRect(0, 0, width, height);
      const grainIntensity = 0.22 + Math.sin(time * 10) * 0.03;
      const grainImageData = generateFilmGrain(width, height, grainIntensity);
      grainCtx.putImageData(grainImageData, 0, 0);
      
      // Enhanced grain during glitch
      if (params.glitchIntensity > 0.5) {
        grainCtx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 200; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 3 + 0.5;
          const opacity = Math.random() * 0.5 * params.glitchIntensity;
          
          grainCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          grainCtx.beginPath();
          grainCtx.arc(x, y, size, 0, Math.PI * 2);
          grainCtx.fill();
        }
      }
      
      grainCtx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 0.5;
        const opacity = Math.random() * 0.3;
        
        grainCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        grainCtx.beginPath();
        grainCtx.arc(x, y, size, 0, Math.PI * 2);
        grainCtx.fill();
      }
      
      grainCtx.globalCompositeOperation = 'multiply';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5 + 0.5;
        const opacity = Math.random() * 0.5 + 0.5;
        
        grainCtx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        grainCtx.beginPath();
        grainCtx.arc(x, y, size, 0, Math.PI * 2);
        grainCtx.fill();
      }
      
      frameRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-black">
      {/* Navigation*/}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-center bg-black/20">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-black" />
          </div>
          <span className="text-lg md:text-2xl font-bold font-mono tracking-wider text-white">
            ORÁCULO
          </span>
        </div>
        
        <div className="hidden md:flex gap-8 font-mono text-xs font-medium tracking-wider uppercase">
          <a href="#" className="text-white/90 hover:text-white transition-opacity">
            Sinais IA
          </a>
          <a href="#" className="text-white/90 hover:text-white transition-opacity">
            Operações
          </a>
          <a href="#" className="text-white/90 hover:text-white transition-opacity">
            Resultados
          </a>
        </div>
        
        <div className="font-mono text-xs font-medium text-white/90 tracking-wider uppercase">
          + Entrar
        </div>
      </nav>


      {/* Left side text - Hidden on mobile */}
      <div 
        className="hidden md:block fixed left-8 top-[40%] z-40"
        style={{
          transform: `translateX(${-scrollProgressRef.current * 200}px)`,
          opacity: Math.max(0, 1 - scrollProgressRef.current * 2),
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="font-mono text-xs text-white leading-relaxed tracking-wider uppercase opacity-80 max-w-[150px]">
          Pare de perder<br />
          dinheiro no<br />
          mercado financeiro<br />
          <br />
        </div>
      </div>

      {/* Right side text - Hidden on mobile */}
      <div 
        className="hidden md:block fixed right-8 top-[40%] z-40"
        style={{
          transform: `translateX(${scrollProgressRef.current * 200}px)`,
          opacity: Math.max(0, 1 - scrollProgressRef.current * 2),
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="font-mono text-xs text-white leading-relaxed tracking-wider uppercase opacity-80 max-w-[150px] text-right">
          Nossa IA<br/>
          opera 24/7<br/>
          automaticamente

        </div>
      </div>

      {/* Bottom text - Responsive positioning */}
      <div 
        className="fixed bottom-4 md:bottom-[8%] left-4 md:left-8 z-40"
        style={{
          transform: `translateY(${scrollProgressRef.current * 50}px)`,
          opacity: Math.max(0, 1 - scrollProgressRef.current * 1.5),
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="font-mono text-[8px] md:text-[10px] text-white tracking-widest uppercase opacity-70">
          Inteligência Artificial • ORÁCULO
        </div>
      </div>

      {/* Canvas Container */}
      <div className="sticky top-0 w-full h-screen">
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full bg-black"
        />
        {/* Film Grain Overlay Canvas */}
        <canvas
          ref={grainCanvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-60"
          style={{ mixBlendMode: 'overlay' }}
        />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&display=swap');
        
        @keyframes grainMove {
          0% { 
            background-position: 0px 0px, 0px 0px, 0px 0px;
          }
          10% { 
            background-position: -5px -10px, 10px -15px, -10px 5px;
          }
          20% { 
            background-position: -10px 5px, -5px 10px, 15px -10px;
          }
          30% { 
            background-position: 15px -5px, -10px 5px, -5px 15px;
          }
          40% { 
            background-position: 5px 10px, 15px -10px, 10px -5px;
          }
          50% { 
            background-position: -15px 10px, 5px 15px, -10px -15px;
          }
          60% { 
            background-position: 10px -15px, -15px -5px, 15px 10px;
          }
          70% { 
            background-position: -5px 15px, 10px -10px, -15px 5px;
          }
          80% { 
            background-position: 15px 5px, -5px -15px, 5px -10px;
          }
          90% { 
            background-position: -10px -5px, 15px 10px, 10px 15px;
          }
          100% { 
            background-position: 0px 0px, 0px 0px, 0px 0px;
          }
        }
        
        a:hover {
          opacity: 1 !important;
          transition: opacity 0.2s ease;
        }
        
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};