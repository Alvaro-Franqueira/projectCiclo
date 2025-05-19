/**
 * GameStats Component
 * Displays statistics for each game type in the casino platform.
 * 
 * Features:
 * - Individual game statistics cards
 * - Win rates and profit tracking
 * - Visual indicators for positive/negative results
 * - Game-specific icons and styling
 */

import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { FaPercentage, FaTrophy, FaCoins } from 'react-icons/fa';
import { GiRollingDices } from 'react-icons/gi';
import rouletteImg from '../images/rouletteimg.png';
import blackjackImg from '../images/blackjack-white.png';
import slotMachineImg from '../images/seven-icon.png';

/**
 * GameStats Component
 * @param {Object} props
 * @param {Object} props.gameStats - Statistics for each game type
 * @returns {JSX.Element} Game statistics section
 */
const GameStats = ({ gameStats }) => {
    const renderGameCard = (gameName, stats, icon) => (
        <Col md={6} className="mb-3">
            <Card className="h-100" style={{ backgroundColor: '#294c85' }}>
                <Card.Header className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#011b45' }}>
                    <span>{gameName}</span> {icon}
                </Card.Header>
                <Card.Body>
                    <div className="d-flex justify-content-between mb-2">
                        <span>Total Bets:</span> <span>{stats.totalBets}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                        <span>Win Rate:</span>
                        <span className="text-info">
                            <FaPercentage className="me-1" />
                            {(stats.winRate ?? 0).toFixed(1)}%
                        </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                        <span>Total Wins:</span>
                        <span className="text-warning">
                            <FaTrophy className="me-1" />
                            {stats.totalWins}
                        </span>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span>Net Profit:</span>
                        <span className={stats.totalProfit >= 0 ? 'text-success' : 'text-danger'}>
                            <FaCoins className="me-1" />
                            ${(stats.totalProfit ?? 0).toFixed(2)}
                        </span>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );

    return (
        <Row>
            {renderGameCard('Dice Game', gameStats.dice, <GiRollingDices size={20} color="#3498db" />)}
            {renderGameCard('Roulette', gameStats.roulette, <img src={rouletteImg} alt="Roulette Icon" width={40} height={30} />)}
            {renderGameCard('Blackjack', gameStats.blackjack, <img src={blackjackImg} alt="Blackjack Icon" width={40} height={30} />)}
            {renderGameCard('Slot Machine', gameStats.slotMachine, <img src={slotMachineImg} alt="Slot Machine Icon" width={40} height={30} />)}
        </Row>
    );
};

export default GameStats; 