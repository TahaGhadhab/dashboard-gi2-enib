import { useState, useEffect } from 'react';

/**
 * useCountUp hook animates a number from 0 to target over a specified duration.
 * @param target The final value to reach
 * @param duration Duration of the animation in milliseconds (default: 1200)
 * @returns The current count value
 */
export function useCountUp(target: number | string, duration: number = 1200) {
  const [count, setCount] = useState(0);
  
  // Extract number from string if necessary (e.g. "85%" -> 85)
  const targetNumber = typeof target === 'string' 
    ? parseFloat(target.replace(/[^\d.-]/g, '')) 
    : target;

  const isDecimal = targetNumber % 1 !== 0;

  useEffect(() => {
    if (isNaN(targetNumber)) {
      setCount(0);
      return;
    }

    let startTimestamp: number | null = null;
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const currentCount = progress * (targetNumber - startValue) + startValue;
      setCount(currentCount);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetNumber, duration]);

  if (isNaN(targetNumber)) return 0;
  
  return isDecimal ? count.toFixed(1) : Math.floor(count);
}
