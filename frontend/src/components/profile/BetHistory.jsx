/**
 * BetHistory Component
 * Displays a paginated table of the user's betting history.
 * 
 * Features:
 * - Paginated bet history table
 * - Game-specific icons and styling
 * - Win/loss status badges
 * - Responsive design
 */

import React from 'react';
import { Table, Badge, Pagination } from 'react-bootstrap';
import { FaTrophy } from 'react-icons/fa';
import { GiRollingDices } from 'react-icons/gi';
import rouletteImg from '../images/rouletteimg.png';
import blackjackImg from '../images/blackjack-white.png';
import slotMachineImg from '../images/seven-icon.png';

/**
 * BetHistory Component
 * @param {Object} props
 * @param {Array} props.bets - Array of bet history items
 * @param {number} props.currentPage - Current page number
 * @param {number} props.betsPerPage - Number of bets per page
 * @param {Function} props.onPageChange - Callback for page changes
 * @returns {JSX.Element} Bet history table with pagination
 */
const BetHistory = ({ bets, currentPage, betsPerPage, onPageChange }) => {
    // Calculate pagination
    const indexOfLastBet = currentPage * betsPerPage;
    const indexOfFirstBet = indexOfLastBet - betsPerPage;
    const currentBets = bets.slice(indexOfFirstBet, indexOfLastBet);
    const totalPages = Math.ceil(bets.length / betsPerPage);

    const renderGameIcon = (bet) => {
        if (bet.game?.name === 'Dice' || bet.gameId === 2) {
            return <div className="d-flex align-items-center"><GiRollingDices size={20} color="#3498db" className="me-2" /><span>Dice</span></div>;
        } else if (bet.game?.name === 'Roulette' || bet.gameId === 1) {
            return <div className="d-flex align-items-center"><img src={rouletteImg} alt="Roulette" width={25} height={20} className="me-2" /><span>Roulette</span></div>;
        } else if (bet.game?.name === 'Blackjack' || bet.gameId === 9) {
            return <div className="d-flex align-items-center"><img src={blackjackImg} alt="Blackjack" width={25} height={20} className="me-2" /><span>Blackjack</span></div>;
        } else if (bet.game?.name === 'Slot Machine' || bet.gameId === 7 || bet.gameId === 10 || bet.type === 'SLOT_MACHINE') {
            return <div className="d-flex align-items-center"><img src={slotMachineImg} alt="Slot Machine" width={25} height={20} className="me-2" /><span>Slot Machine</span></div>;
        }
        return <span>{bet.game?.name || 'Unknown Game'}</span>;
    };

    const renderBetType = (bet) => {
        if (bet.gameId === 2) {
            return bet.type === 'evenodd' ? `Even/Odd: ${bet.betValue}` :
                   bet.type === 'number' ? `Sum: ${bet.betValue}` :
                   `${bet.type}: ${bet.betValue}`;
        } else if (bet.gameId === 1) {
            return bet.type === 'NUMBER' ? `Number: ${bet.betValue}` :
                   bet.type === 'COLOR' ? `Color: ${bet.betValue}` :
                   bet.type === 'PARITY' ? `Parity: ${bet.betValue}` :
                   `${bet.type}: ${bet.betValue}`;
        } else if (bet.gameId === 9) {
            return 'Blackjack';
        } else if (bet.type === 'SLOT_MACHINE') {
            return 'Slot Machine';
        }
        return bet.type || 'Unknown Bet Type';
    };

    return (
        <div className="p-3 card-tab-body">
            {bets.length > 0 ? (
                <>
                    <Table responsive hover variant="dark">
                        <thead>
                            <tr>
                                <th>Game</th>
                                <th>Bet Type</th>
                                <th>Amount</th>
                                <th>Result</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentBets.map((bet, index) => (
                                <tr key={bet.id || index}>
                                    <td className="align-middle">
                                        {renderGameIcon(bet)}
                                    </td>
                                    <td>{renderBetType(bet)}</td>
                                    <td>${(bet.amount ?? 0).toFixed(2)}</td>
                                    <td>
                                        <Badge
                                            bg={bet.status === 'WON' ? 'success' : bet.status === 'LOST' ? 'danger' : 'secondary'}
                                            className="d-flex align-items-center justify-content-center px-2 py-1"
                                            style={{ minWidth: '100px' }}
                                        >
                                            {bet.status === 'WON' ? (
                                                <><FaTrophy className="me-1" size={12} />WON ${bet.winloss ? Math.abs(bet.winloss).toFixed(2) : '0.00'}</>
                                            ) : bet.status === 'LOST' ? (
                                                <>LOST ${bet.winloss ? Math.abs(bet.winloss).toFixed(2) : (bet.amount ?? 0).toFixed(2)}</>
                                            ) : (
                                                bet.status
                                            )}
                                        </Badge>
                                    </td>
                                    <td>{bet.betDate ? new Date(bet.betDate).toLocaleString() : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {totalPages > 1 && (
                        <Pagination className="justify-content-center mt-3">
                            <Pagination.First onClick={() => onPageChange(1)} disabled={currentPage === 1} />
                            <Pagination.Prev onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} />
                            {[...Array(totalPages).keys()].map(number => {
                                const pageNumber = number + 1;
                                if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)) {
                                    return (
                                        <Pagination.Item key={pageNumber} active={pageNumber === currentPage} onClick={() => onPageChange(pageNumber)}>
                                            {pageNumber}
                                        </Pagination.Item>
                                    );
                                } else if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
                                    return <Pagination.Ellipsis key={pageNumber} />;
                                }
                                return null;
                            })}
                            <Pagination.Next onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                            <Pagination.Last onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} />
                        </Pagination>
                    )}
                </>
            ) : (
                <p className="text-center my-3">No bet history available.</p>
            )}
        </div>
    );
};

export default BetHistory; 