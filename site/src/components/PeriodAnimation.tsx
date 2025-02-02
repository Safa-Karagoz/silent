import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Point {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  color: string;
}

const PeriodAnimation: React.FC = () => {
  const [animationStage, setAnimationStage] = useState<'initial' | 'moving' | 'expanding'>('initial');
  const [points, setPoints] = useState<Point[]>([]);

  // Generate points in a lip shape
  const generateLipPoints = () => {
    const lipPoints: Point[] = [];
    const numPoints = 24; // Adjust for density
    const radius = 40; // Base size of the lips
    
    // Upper lip points
    for (let i = 0; i < numPoints / 2; i++) {
      const angle = (Math.PI * i) / (numPoints / 2);
      // Create a more natural curve for upper lip
      const x = radius * Math.cos(angle) * 1.5;
      const y = -radius * Math.sin(angle) * 0.5 * (1 + Math.sin(angle * 2) * 0.3);
      
      lipPoints.push({
        x,
        y,
        scale: Math.random() * 0.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.7,
        color: `hsl(${33 + Math.random() * 40}, 70%, ${60 + Math.random() * 20}%)`
      });
    }
    
    // Lower lip points - slightly fuller than upper lip
    for (let i = 0; i < numPoints / 2; i++) {
      const angle = Math.PI + (Math.PI * i) / (numPoints / 2);
      const x = radius * Math.cos(angle) * 1.5;
      const y = -radius * Math.sin(angle) * 0.4 * (1 + Math.cos(angle) * 0.3);
      
      lipPoints.push({
        x,
        y: y + radius * 0.6,
        scale: Math.random() * 0.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.7,
        color: `hsl(${33 + Math.random() * 40}, 70%, ${60 + Math.random() * 20}%)`
      });
    }

    // Add some additional points for more natural look
    for (let i = 0; i < numPoints / 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = radius * (0.8 + Math.random() * 0.4);
      lipPoints.push({
        x: r * Math.cos(angle) * 1.5,
        y: r * Math.sin(angle) * 0.5,
        scale: Math.random() * 0.3 + 0.3,
        opacity: Math.random() * 0.3 + 0.4,
        color: `hsl(${33 + Math.random() * 40}, 70%, ${60 + Math.random() * 20}%)`
      });
    }

    return lipPoints;
  };

  useEffect(() => {
    // Start the animation sequence
    const sequence = async () => {
      // Initial flicker animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAnimationStage('moving');
      
      // Move to center
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnimationStage('expanding');
      
      // Generate and animate lip points
      setPoints(generateLipPoints());
    };

    sequence();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      <AnimatePresence>
        {/* Initial period that moves to center */}
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-accent"
          initial={{ 
            x: 180, // Adjust based on your layout
            y: 60,   // Adjust based on your layout
            scale: 1 
          }}
          animate={{
            x: animationStage === 'initial' ? 180 : window.innerWidth / 2,
            y: animationStage === 'initial' ? 60 : window.innerHeight / 2,
            scale: animationStage === 'expanding' ? 0 : 1,
            opacity: animationStage === 'initial' ? [1, 0.2, 1, 0.5, 1] : 1, // Flicker effect
          }}
          transition={{
            duration: animationStage === 'moving' ? 1 : 0.5,
            ease: "easeInOut",
            opacity: {
              duration: 0.1,
              repeat: animationStage === 'initial' ? 4 : 0,
              repeatType: "reverse"
            }
          }}
        />

        {/* Lip shape points */}
        {animationStage === 'expanding' && points.map((point, index) => (
          <motion.div
            key={index}
            className="absolute w-3 h-3 rounded-full"
            style={{
              backgroundColor: point.color,
            }}
            initial={{ 
              scale: 0,
              opacity: 0,
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
            }}
            animate={{ 
              scale: point.scale,
              opacity: point.opacity,
              x: window.innerWidth / 2 + point.x,
              y: window.innerHeight / 2 + point.y,
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 10,
              delay: index * 0.03,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Optional pulsing effect for the entire lip shape */}
      {animationStage === 'expanding' && (
        <motion.div
          className="absolute w-full h-full"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  );
};

export default PeriodAnimation;