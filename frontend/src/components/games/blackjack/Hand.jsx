import React from 'react';
import styles from '../../../assets/styles/Hand.module.css';
import Card from './Card';

const Hand = ({ title, cards }) => {
  const getTitle = () => {
    if (cards.length > 0 && title) {
      return (
        <h2 className={styles.title}>{title}</h2>
      );
    }
    return null;
  }
  
  return (
    <div className={styles.handContainer}>
      {getTitle()}
      <div className={styles.cardContainer}>
        {cards.map((card, index) => (
          <div 
            key={index} 
            style={{ 
              zIndex: index + 1,
              transition: 'transform 0.2s ease-out'
            }}
          >
            <Card 
              value={card.value} 
              suit={card.suit} 
              hidden={card.hidden}
              index={index}
            />
          </div>
        ))}
        {cards.length === 0 && (
          <div className={styles.emptyHand}>
            <p style={{ opacity: 0.7, fontStyle: 'italic' }}>Cards will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Hand;