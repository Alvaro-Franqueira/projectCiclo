/**
 * RankingsList Component
 * Displays the user's rankings in different categories and games.
 * 
 * Features:
 * - Global rankings table
 * - Game-specific rankings tables
 * - Position badges with color coding
 * - Cache clearing functionality
 */

import React from 'react';
import { Table, Badge, Button, Spinner } from 'react-bootstrap';
import { FaTrophy, FaSync } from 'react-icons/fa';

/**
 * RankingsList Component
 * @param {Object} props
 * @param {Array} props.rankings - Array of user rankings
 * @param {boolean} props.isRefreshing - Whether rankings are being refreshed
 * @param {Function} props.onClearCache - Callback for clearing ranking cache
 * @returns {JSX.Element} Rankings list with tables
 */
const RankingsList = ({ rankings, isRefreshing, onClearCache }) => {
    const renderRankingValue = (ranking) => {
        if (ranking.type?.includes('PROFIT') || ranking.type?.includes('AMOUNT') || 
            ranking.type?.includes('LOSERS') || ranking.type?.includes('LOSSES')) {
            return `$${parseFloat(ranking.score || 0).toFixed(2)}`;
        } else if (ranking.type?.includes('WIN_RATE')) {
            return `${parseFloat(ranking.score || 0).toFixed(1)}%`;
        }
        return ranking.score;
    };

    const renderPositionBadge = (position) => (
        <Badge
            bg={
                position === 1 ? 'warning' :
                position <= 10 ? 'info' :
                'danger'
            }
        >
            #{position}
        </Badge>
    );

    return (
        <div className="p-3 card-tab-body">
            <div className="d-flex justify-content-between mb-3">
                <h5 className="mb-0">My Rankings</h5>
                <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={onClearCache} 
                    disabled={isRefreshing}
                >
                    {isRefreshing ? (
                        <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Refreshing...</>
                    ) : (
                        <>Clear Rankings Cache</>
                    )}
                </Button>
            </div>
            {rankings.length > 0 ? (
                <>
                    {/* Global Rankings */}
                    <h5 className="mb-3">Global Rankings</h5>
                    <Table responsive hover variant='dark' className="mb-4">
                        <thead>
                            <tr>
                                <th>Ranking Type</th>
                                <th>Value</th>
                                <th>Position</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankings
                                .filter(r => !r.game)
                                .sort((a, b) => a.position - b.position)
                                .map((ranking, index) => (
                                    <tr key={index}>
                                        <td>{ranking.type?.replace(/_/g, ' ') || 'Unknown'}</td>
                                        <td>{renderRankingValue(ranking)}</td>
                                        <td>{renderPositionBadge(ranking.position)}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </Table>

                    {/* Game-specific Rankings */}
                    {Array.from(new Set(rankings.filter(r => r.game).map(r => r.game?.id))).map(gameId => {
                        const gameRankings = rankings.filter(r => r.game?.id === gameId);
                        const gameName = gameRankings[0]?.game?.name || 'Unknown Game';
                        
                        return (
                            <div key={gameId} className="mb-4">
                                <h5 className="mb-3">{gameName} Rankings</h5>
                                <Table responsive hover variant='dark'>
                                    <thead>
                                        <tr>
                                            <th>Ranking Type</th>
                                            <th>Value</th>
                                            <th>Position</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gameRankings
                                            .sort((a, b) => a.position - b.position)
                                            .map((ranking, index) => (
                                                <tr key={index}>
                                                    <td>{ranking.type?.replace(/_/g, ' ') || 'Unknown'}</td>
                                                    <td>{renderRankingValue(ranking)}</td>
                                                    <td>{renderPositionBadge(ranking.position)}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </Table>
                            </div>
                        );
                    })}
                </>
            ) : (
                <div className="text-center my-4">
                    <FaTrophy size={40} className="mb-3 text-secondary" />
                    <p>No ranking data available yet.</p>
                    <p className="text-muted small">This might be due to insufficient game history or a temporary system issue.</p>
                    <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={onClearCache}
                        className="mt-2"
                    >
                        <FaSync className="me-1" /> Try Again
                    </Button>
                </div>
            )}
        </div>
    );
};

export default RankingsList; 