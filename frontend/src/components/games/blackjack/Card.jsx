import React, { useState, useEffect } from 'react';
import styles from '../../../assets/styles/Card.module.css';

const Card = ({ value, suit, hidden, index }) => {
  const [wasHidden, setWasHidden] = useState(hidden);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isDealing, setIsDealing] = useState(true);
  
  useEffect(() => {
    // Remove dealing animation after it plays
    const timer = setTimeout(() => {
      setIsDealing(false);
    }, 500 + (index * 100)); // Stagger the animation based on card index
    
    return () => clearTimeout(timer);
  }, []);

  // Detect when a card changes from hidden to visible
  useEffect(() => {
    if (wasHidden && !hidden) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setIsFlipping(false);
      }, 600);
      return () => clearTimeout(timer);
    }
    setWasHidden(hidden);
  }, [hidden, wasHidden]);
  
  const getColor = () => {
    if (suit === '♠' || suit === '♣') {
      return 'black';
    }
    else {
      return 'red';
    }
  }

  const getCardStyle = () => {
    const baseStyle = {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      transform: isDealing ? 
        `translate(-100vw, -100vh) rotate(${Math.random() * 360}deg)` : 
        isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
      opacity: isDealing ? 0 : 1,
      transition: isDealing ? 
        `transform 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 100}ms, opacity 0.3s ease ${index * 100}ms` : 
        isFlipping ? 'transform 0.6s ease-out' : 'all 0.3s ease-out',
      borderRadius: '10px',
      width: '100px',
      height: '140px',
      margin: '8px',
      position: 'relative',
      overflow: 'hidden',
      transformStyle: 'preserve-3d'
    };
    
    if (hidden) {
      return {
        ...baseStyle,
        backgroundImage: 'linear-gradient(135deg, #b22222 25%, transparent 25%), linear-gradient(225deg, #b22222 25%, transparent 25%), linear-gradient(45deg, #b22222 25%, transparent 25%), linear-gradient(315deg, #b22222 25%, transparent 25%)',
        backgroundPosition: '10px 0, 10px 0, 0 0, 0 0',
        backgroundSize: '20px 20px',
        backgroundRepeat: 'repeat',
        backgroundColor: '#8b0000',
        border: '3px solid white'
      };
    }
    
    return {
      ...baseStyle,
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      padding: '5px'
    };
  };

  const getCornerStyle = (topRight = false) => {
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: topRight ? 'flex-end' : 'flex-start',
      padding: '2px',
      lineHeight: '1',
      position: topRight ? 'absolute' : 'static',
      right: topRight ? '5px' : 'auto',
      bottom: topRight ? '5px' : 'auto',
      transform: topRight ? 'rotate(180deg)' : 'none'
    };
  };

  const getValueStyle = () => {
    const color = getColor();
    return {
      fontSize: value.length > 1 ? '18px' : '20px',
      fontWeight: 'bold',
      margin: '0',
      padding: '0',
      lineHeight: '1',
      color: color
    };
  };

  const getSuitStyle = (small = true) => {
    const color = getColor();
    return {
      fontSize: small ? '18px' : '40px',
      margin: small ? '0' : '0 auto',
      padding: '0',
      lineHeight: '1',
      color: color,
      textShadow: `0 0 1px rgba(${color === 'red' ? '255,0,0' : '0,0,0'},0.3)`
    };
  };

  const getCenterSuitStyle = () => {
    const color = getColor();
    return {
      fontSize: '50px',
      color: color,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      margin: '0',
      padding: '0',
      textShadow: `0 0 2px rgba(${color === 'red' ? '255,0,0' : '0,0,0'},0.3)`
    };
  };

  const getInnerCardContent = () => {
    return (
      <>
        <div style={getCornerStyle()}>
          <div style={getValueStyle()}>{value}</div>
          <div style={getSuitStyle()}>{suit}</div>
        </div>
        
        <div style={getCenterSuitStyle()}>{suit}</div>
        
        <div style={getCornerStyle(true)}>
          <div style={getValueStyle()}>{value}</div>
          <div style={getSuitStyle()}>{suit}</div>
        </div>
      </>
    );
  };

  const getCard = () => {
    if (hidden) {
      return (
        <div 
          className={`${styles.cardBack} ${isFlipping ? styles.flipping : ''}`}
          style={getCardStyle()} 
        />
      );
    }
    else {
      return (
        <div 
          className={`${styles.cardFront} ${isFlipping ? styles.flipping : ''}`} 
          style={getCardStyle()}
        >
          {getInnerCardContent()}
        </div>
      );
    }
  }

  return (
    <div className={styles.cardWrapper}>
      {getCard()}
    </div>
  );
}

export default Card;