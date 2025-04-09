import React, { useState, useEffect, useRef } from 'react';
import './Roulette.css'; // We'll update this CSS file

// European roulette numbers in the correct order (clockwise)
const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Red numbers in European roulette
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const CasinoRoulette = ({ 
  onSpinStart, 
  onSpinEnd, 
  spinningTime = 8, 
  start, 
  prizeIndex
}) => {
  const wheelRef = useRef(null);
  const ballRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastRotation, setLastRotation] = useState(0);
  const [currentWinningNumber, setCurrentWinningNumber] = useState(null);
  const [wheelSound] = useState(new Audio('/wheel-spinning.mp3')); // Create or find a suitable sound effect
  
  // Get the color for a specific number
  const getNumberColor = (number) => {
    if (number === 0) return '#008000'; // Green for zero
    return RED_NUMBERS.includes(number) ? '#C1272D' : '#000000'; // Red or Black
  };
  
  // Function to handle the spin animation
  useEffect(() => {
    if (start && !isSpinning && prizeIndex >= 0) {
      const targetNumber = ROULETTE_NUMBERS[prizeIndex];
      setCurrentWinningNumber(targetNumber);
      
      // Start spinning
      setIsSpinning(true);
      if (onSpinStart) onSpinStart();
      
      // Play sound
      wheelSound.currentTime = 0;
      wheelSound.play();
      
      // Calculate the target rotation
      // Each pocket is approximately 9.73 degrees (360 / 37)
      const pocketAngle = 360 / ROULETTE_NUMBERS.length;
      
      // Calculate target angle for the winning number
      // We add extra rotations for a more dramatic effect
      const extraRotations = 5; // Full wheel rotations before stopping
      const targetAngle = -(prizeIndex * pocketAngle) + (360 * extraRotations);
      
      // Set wheel animation
      if (wheelRef.current) {
        // Reset first to ensure animation works
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.transform = `rotate(${lastRotation}deg)`;
        
        // Force reflow
        void wheelRef.current.offsetWidth;
        
        // Start animation
        wheelRef.current.style.transition = `transform ${spinningTime}s cubic-bezier(0.32, 0.94, 0.60, 1)`;
        wheelRef.current.style.transform = `rotate(${targetAngle}deg)`;
        
        // Update the last rotation for next spin
        setLastRotation(targetAngle % 360);
      }
      
      // Ball animation (more complex, needs to bounce and eventually land in the pocket)
      if (ballRef.current) {
        // Initialize ball position on the outer edge
        ballRef.current.style.transition = 'none';
        ballRef.current.style.transform = 'rotate(0deg) translateY(-120px)';
        
        // Force reflow
        void ballRef.current.offsetWidth;
        
        // Start ball rotation faster than wheel, then slow down to match wheel
        ballRef.current.style.transition = `transform ${spinningTime * 0.4}s cubic-bezier(0.5, 0.1, 0.15, 1)`;
        ballRef.current.style.transform = `rotate(${720}deg) translateY(-120px)`;
        
        // After initial fast spin, simulate ball bouncing and coming to rest
        setTimeout(() => {
          ballRef.current.style.transition = `transform ${spinningTime * 0.6}s cubic-bezier(0.32, 0.94, 0.60, 1)`;
          ballRef.current.style.transform = `rotate(${-targetAngle + 720}deg) translateY(-85px)`;
        }, spinningTime * 400);
      }
      
      // End the spin after the animation completes
      setTimeout(() => {
        setIsSpinning(false);
        wheelSound.pause();
        if (onSpinEnd) onSpinEnd();
      }, spinningTime * 1000);
    }
  }, [start, prizeIndex, isSpinning, spinningTime, onSpinStart, onSpinEnd, wheelSound, lastRotation]);
  
  return (
    <div className="casino-roulette-container">
      <div className="roulette-wheel-container">
        {/* Static outer rim */}
        <div className="wheel-outer-rim"></div>
        
        {/* Rotating wheel with pockets */}
        <div ref={wheelRef} className="wheel-inner">
          {ROULETTE_NUMBERS.map((number, index) => {
            // Calculate the angle for each pocket
            const angle = (index * 360) / ROULETTE_NUMBERS.length;
            const isZero = number === 0;
            
            return (
              <div 
                key={index} 
                className="wheel-pocket" 
                style={{
                  transform: `rotate(${angle}deg)`,
                  backgroundColor: getNumberColor(number)
                }}
              >
                {/* Pocket divider */}
                <div className="pocket-divider"></div>
                
                {/* Number label */}
                <div 
                  className={`pocket-number ${isZero ? 'zero' : ''}`}
                  style={{ color: 'white', transform: `rotate(${-angle}deg)` }}
                >
                  {number}
                </div>
              </div>
            );
          })}
          
          {/* Center hub */}
          <div className="wheel-center">
            <div className="wheel-center-inner"></div>
          </div>
        </div>
        
        {/* Ball */}
        <div ref={ballRef} className="roulette-ball"></div>
        
        {/* Display current winning number */}
        {currentWinningNumber !== null && !isSpinning && (
          <div className="winning-number-display">
            <span 
              style={{ 
                backgroundColor: getNumberColor(currentWinningNumber), 
                color: 'white' 
              }}
            >
              {currentWinningNumber}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CasinoRoulette;