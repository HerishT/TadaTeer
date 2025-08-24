import React, { useRef, useEffect } from 'react';

const ParticleCanvas = ({ view }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.body.scrollHeight;
    };

    class Particle {
      constructor(x, y, size, color, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.speedX = speedX;
        this.speedY = speedY;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      update() {
        if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
        if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
        this.x += this.speedX;
        this.y += this.speedY;
      }
    }

    const initParticles = () => {
      particles = [];
      let numberOfParticles = (canvas.height * canvas.width) / 18000; // Reduced from 9000 to 18000 for half the particles
      for (let i = 0; i < numberOfParticles; i++) {
        let size = Math.random() * 1.5 + 0.5;
        let x = Math.random() * (window.innerWidth - size * 2) + size;
        let y = Math.random() * (document.body.scrollHeight - size * 2) + size;
        let speedX = (Math.random() * 0.4) - 0.2;
        let speedY = (Math.random() * 0.4) - 0.2;
        particles.push(new Particle(x, y, size, 'rgba(0, 128, 128, 0.5)', speedX, speedY));
      }
    };

    const connectParticles = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let distance = Math.sqrt(((particles[a].x - particles[b].x) ** 2) + ((particles[a].y - particles[b].y) ** 2));
          if (distance < 150) {
            const opacityValue = 1 - (distance / 150);
            ctx.strokeStyle = `rgba(0, 128, 128, ${opacityValue * 0.3})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animateParticles = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, window.innerWidth, document.body.scrollHeight);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      connectParticles();
      animationFrameId = requestAnimationFrame(animateParticles);
    };

    setCanvasSize();
    initParticles();
    animateParticles();

    const resizeObserver = new ResizeObserver(setCanvasSize);
    resizeObserver.observe(document.body);

    window.addEventListener('resize', setCanvasSize);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [view]);

  return (
    <canvas
      ref={canvasRef}
      id="particle-canvas"
      className="fixed top-0 left-0 w-full h-full z-0"
    />
  );
};

export default ParticleCanvas;
