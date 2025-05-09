import React, { useState, useEffect } from 'react';
import styles from '../../../assets/styles/Controls.module.css';
import { FaDice, FaHandPaper, FaRedo, FaCoins, FaPlus, FaMinus } from 'react-icons/fa';

const Controls = ({ balance, gameState, buttonState, betEvent, hitEvent, standEvent, resetEvent }) => {
  const [amount, setAmount] = useState(10);
  const [inputStyle, setInputStyle] = useState(styles.input);
  const [animatePulse, setAnimatePulse] = useState(false);
  
  // Predefined betting amounts
  const betAmounts = [5, 10, 25, 50, 100];

  useEffect(() => {
    validation();
  }, [amount, balance]);

  useEffect(() => {
    // Add a pulsing animation to the bet button when amount is valid
    if (gameState === 0 && amount <= balance && amount >= 0.01) {
      const interval = setInterval(() => {
        setAnimatePulse(prev => !prev);
      }, 1500);
      
      return () => clearInterval(interval);
    }
  }, [gameState, amount, balance]);

  const validation = () => {
    if (amount > balance) {
      setInputStyle(styles.inputError);
      return false;
    }
    if (amount < 0.01) {
      setInputStyle(styles.inputError);
      return false;
    }
    setInputStyle(styles.input);
    return true;
  }

  const amountChange = (e) => {
    setAmount(e.target.value);
  }

  const adjustAmount = (change) => {
    const newAmount = Math.max(0, Number(amount) + change);
    setAmount(Math.min(newAmount, balance));
  }
  
  const selectBetAmount = (value) => {
    if (value <= balance) {
      setAmount(value);
    }
  }

  const onBetClick = () => {
    if (validation()) {
      betEvent(Math.round(amount * 100) / 100);
    }
  }

  const getButtonStyle = (disabled, isAnimated = false, primary = false) => {
    const baseStyle = {
      transition: 'all 0.3s ease',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      color: 'white',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    };

    if (disabled) {
      return {
        ...baseStyle,
        background: 'rgba(60, 60, 60, 0.7)',
        cursor: 'not-allowed',
        boxShadow: 'none'
      };
    }

    if (isAnimated && animatePulse) {
      return {
        ...baseStyle,
        transform: 'scale(1.05)',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.4)',
        background: 'linear-gradient(145deg, #1a1a1a, #333333)',
        borderColor: 'gold'
      };
    }

    if (primary) {
      return {
        ...baseStyle,
        background: 'linear-gradient(145deg, #0a4e0a, #063d06)',
        borderColor: '#0c5e0c'
      };
    }

    return baseStyle;
  };

  const getControls = () => {
    if (gameState === 0) {
      return (
        <div className={styles.bettingControls}>
          <div className={styles.betContainer} style={{ 
            borderRadius: '10px', 
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            background: 'linear-gradient(145deg, #1a1a1a, #333333)'
          }}>
            <FaCoins style={{ color: 'gold', marginRight: '5px' }} />
            <div className={styles.betInputGroup}>
              <button 
                onClick={() => adjustAmount(-5)} 
                className={styles.adjustButton}
                disabled={amount <= 5}
              >
                <FaMinus />
              </button>
              <input 
                type='number' 
                value={amount} 
                onChange={amountChange} 
                className={inputStyle}
                min="1"
                max={balance}
                style={{
                  caretColor: 'gold',
                  transition: 'all 0.3s'
                }}
              />
              <button 
                onClick={() => adjustAmount(5)} 
                className={styles.adjustButton}
                disabled={amount >= balance}
              >
                <FaPlus />
              </button>
            </div>
          </div>
          
          <div className={styles.quickBetContainer}>
            {betAmounts.map(value => (
              <button 
                key={value}
                onClick={() => selectBetAmount(value)} 
                className={`${styles.quickBetButton} ${amount === value ? styles.selectedBet : ''}`}
                disabled={value > balance}
              >
                ${value}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => onBetClick()} 
            className={styles.button}
            style={getButtonStyle(false, true, true)}
          >
            Place Bet
          </button>
        </div>
      );
    }
    else {
      return (
        <div className={styles.gameControls}>
          <button 
            onClick={() => hitEvent()} 
            disabled={buttonState.hitDisabled} 
            className={styles.button}
            style={getButtonStyle(buttonState.hitDisabled)}
          >
            <FaDice /> Hit
          </button>
          <button 
            onClick={() => standEvent()} 
            disabled={buttonState.standDisabled} 
            className={styles.button}
            style={getButtonStyle(buttonState.standDisabled)}
          >
            <FaHandPaper /> Stand
          </button>
          <button 
            onClick={() => resetEvent()} 
            disabled={buttonState.resetDisabled} 
            className={styles.button}
            style={getButtonStyle(buttonState.resetDisabled)}
          >
            <FaRedo /> New Game
          </button>
        </div>
      );
    }
  }

  return (
    <div className="mt-4">
      {getControls()}
    </div>
  );
}

export default Controls;