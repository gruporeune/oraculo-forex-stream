import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  duration: number;
  size: number;
  opacity: number;
}

export function BinaryFloatingElements() {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    const generateElements = () => {
      const newElements: FloatingElement[] = [];
      for (let i = 0; i < 30; i++) {
        newElements.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          duration: 10 + Math.random() * 20,
          size: 12 + Math.random() * 8,
          opacity: 0.1 + Math.random() * 0.3,
        });
      }
      setElements(newElements);
    };

    generateElements();
  }, []);

  const generateBinaryString = () => {
    return Array.from({ length: 8 }, () => Math.round(Math.random())).join('');
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {elements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute text-cyber font-mono"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            fontSize: `${element.size}px`,
            opacity: element.opacity,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, 10, -10, 0],
            opacity: [element.opacity, element.opacity * 0.5, element.opacity],
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {generateBinaryString()}
        </motion.div>
      ))}
    </div>
  );
}