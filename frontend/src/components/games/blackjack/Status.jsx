import React from 'react';
import styles from '../../../assets/styles/Status.module.css';
import { FaCoins, FaTrophy } from 'react-icons/fa';

const Status = ({ message, balance }) => {
  const getMessageStyle = () => {
    if (message === 'You Win!') {
      return { color: 'gold', textShadow: '0 0 10px rgba(255, 215, 0, 0.7)' };
    } else if (message === 'Dealer Wins!' || message === 'Bust!') {
      return { color: '#ff6666', textShadow: '0 0 10px rgba(255, 0, 0, 0.5)' };
    } else if (message === 'Tie!') {
      return { color: '#99ccff', textShadow: '0 0 10px rgba(153, 204, 255, 0.7)' };
    }
    return {};
  };

  return (
    <div className={styles.statusContainer}>
      <div className={styles.status} style={{ borderRadius: '15px', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)' }}>
        <h1 className={styles.value} style={getMessageStyle()}>
          {message === 'You Win!' && <FaTrophy className="me-2" style={{ fontSize: '0.8em' }} />}
          {message}
        </h1>
      </div>
      <div className={styles.balance} style={{ borderRadius: '15px', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)' }}>
        <h1 className={styles.value}>
          <FaCoins className="me-2" style={{ color: 'gold', fontSize: '0.8em' }} />
          ${balance.toFixed(2)}
        </h1>
      </div>
    </div>
  );
}

export default Status;