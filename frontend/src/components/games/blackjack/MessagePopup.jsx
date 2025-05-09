import React, { useEffect, useState } from 'react';
import { FaTrophy } from 'react-icons/fa';
import '../../../assets/styles/MessagePopup.css';

const MessagePopup = ({ message, isVisible, onClose }) => {
  const [shouldShow, setShouldShow] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setShouldShow(true);
      
      // Auto-close the popup after 2.5 seconds
      const timer = setTimeout(() => {
        setShouldShow(false);
        setTimeout(() => {
          if (onClose) onClose();
        }, 500); // Give time for exit animation
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, message]);
  
  const getMessageStyle = () => {
    if (message === 'You Win!') {
      return { 
        background: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
        color: 'white',
        border: '3px solid gold'
      };
    } else if (message === 'Dealer Wins!' || message === 'Bust!') {
      return { 
        background: 'linear-gradient(135deg, #200122, #6f0000)',
        color: 'white',
        border: '3px solid #ff6666'
      };
    } else if (message === 'Tie!') {
      return { 
        background: 'linear-gradient(135deg, #3a7bd5, #00d2ff)',
        color: 'white',
        border: '3px solid #99ccff'
      };
    } else if (message === 'Place a Bet!') {
      return { 
        background: 'linear-gradient(135deg, #134e5e, #71b280)',
        color: 'white',
        border: '3px solid #71b280'
      };
    } else {
      return { 
        background: 'linear-gradient(135deg, #232526, #414345)',
        color: 'white',
        border: '3px solid white'
      };
    }
  };

  return (
    <>
      {shouldShow && (
        <div 
          className={`message-popup ${shouldShow ? 'show' : 'hide'}`}
          style={{
            ...getMessageStyle()
          }}
        >
          <h1 style={{ 
            margin: 0, 
            fontWeight: 'bold', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
          }}>
            {message === 'You Win!' && <FaTrophy className="me-2" style={{ fontSize: '0.8em' }} />}
            {message}
          </h1>
        </div>
      )}
    </>
  );
};

export default MessagePopup; 