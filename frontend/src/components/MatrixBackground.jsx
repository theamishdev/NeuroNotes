import React, { useEffect, useRef } from 'react';

export const MatrixBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters: mix of katakana, numbers, and symbols
    const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ*+-/<>[]{}%';
    const charArr = chars.split('');
    
    const fontSize = 14;
    let columns = Math.floor(canvas.width / fontSize);
    if (columns < 1) columns = 1;

    // Tracker for drops y position
    let drops = Array(columns).fill(1);

    // Cyberpunk color palettes
    const neonColors = [
      'rgba(0, 240, 255, 0.15)', // Neon Cyan
      'rgba(255, 0, 127, 0.15)', // Neon Pink
      'rgba(189, 0, 255, 0.15)', // Neon Purple
    ];

    const draw = () => {
      // Semi-transparent background to create trail effect
      ctx.fillStyle = 'rgba(5, 5, 10, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px "Share Tech Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Choose random cyberpunk color
        ctx.fillStyle = neonColors[Math.floor(Math.random() * neonColors.length)];
        
        const text = charArr[Math.floor(Math.random() * charArr.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop to top randomly
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        drops[i]++;
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-40 bg-[#030206] cyber-grid" 
    />
  );
};
export default MatrixBackground;
