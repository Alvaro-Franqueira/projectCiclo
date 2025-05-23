/**
 * ProfileHeader Component
 * Displays the user's profile information, balance, and achievements in a card format.
 * 
 * Features:
 * - User avatar with special badges for top rankings
 * - Current balance display
 * - User information (username, email, join date)
 * - Role badge
 * - Achievement badges for top rankings
 */

import React from 'react';
import { Card, Badge, Image } from 'react-bootstrap';
import { FaUser, FaCalendarAlt, FaCoins, FaTrophy, FaPercentage, FaMoneyBillWave, FaMedal} from 'react-icons/fa';
import { Icon } from '@mdi/react';
import { mdiEmoticonPoop } from '@mdi/js';
import kingLogo from '../images/king-logo.png';
import shitLogo from '../images/shitty-logo.png';
import { GiCoins } from 'react-icons/gi';

/**
 * ProfileHeader Component
 * @param {Object} props
 * @param {Object} props.profileData - User profile data
 * @param {Array} props.numberOneRankings - Array of rankings where user is #1
 * @returns {JSX.Element} Profile header card
 */
const ProfileHeader = ({ profileData, numberOneRankings }) => {
    const isNumberOne = numberOneRankings.length > 0;
    const loserRankingTypes = ['TOP_LOSERS', 'BY_GAME_LOSSES'];
    const isTopLoser = numberOneRankings.some(r => loserRankingTypes.includes(r.type));

    const numberOneRankingDetails = numberOneRankings.map(r => ({
        type: r.type,
        game: r.game?.name || 'Overall',
        isLoserRanking: loserRankingTypes.includes(r.type)
    }));

    // Helper function to get badge information based on ranking type
    const getBadgeForRanking = (type, game) => {
        switch (type) {
            case 'OVERALL_PROFIT':
                return {
                    title: 'Top Profit',
                    icon: <FaMoneyBillWave size={50} color="#40c057" />,
                    bgColorStart: '#103221',
                    bgColorEnd: '#143325',
                    borderColor: '#40c057',
                    textColor: '#c0eb75'
                };
            case 'TOTAL_BETS_AMOUNT':
                return {
                    title: 'Top Better',
                    icon: <GiCoins size={60} color="#fcc419" />,
                    bgColorStart: '#312200',
                    bgColorEnd: '#462f00',
                    borderColor: '#fcc419',
                    textColor: '#ffe066'
                };
            case 'WIN_RATE':
                return {
                    title: 'Best Win %',
                    icon: <FaPercentage size={40} color="#4dabf7" />,
                    bgColorStart: '#0b2d4e',
                    bgColorEnd: '#0e345d',
                    borderColor: '#4dabf7',
                    textColor: '#a5d8ff'
                };
            case 'BY_GAME_AMOUNT':
                return {
                    title: 'Top Better',
                    icon: <FaTrophy size={55} color="#f06595" />,
                    bgColorStart: '#3d0d24',
                    bgColorEnd: '#4c102d',
                    borderColor: '#f06595',
                    textColor: '#ffdeeb'
                };
            case 'BY_GAME_WIN_RATE':
                return {
                    title: 'Best Win %',
                    icon: <FaPercentage size={40} color="#4dabf7" />,
                    bgColorStart: '#0b2d4e',
                    bgColorEnd: '#0e345d',
                    borderColor: '#4dabf7',
                    textColor: '#a5d8ff'
                };
            case 'BY_GAME_PROFIT':
                return {
                    title: 'Top Profit',
                    icon: <FaMoneyBillWave size={50} color="#40c057" />,
                    bgColorStart: '#103221',
                    bgColorEnd: '#143325',
                    borderColor: '#40c057',
                    textColor: '#c0eb75'
                };
            case 'TOP_LOSERS':
            case 'BY_GAME_LOSSES':
                return {
                    title: 'Biggest Loser',
                    icon: <Icon path={mdiEmoticonPoop} size={1.8} color="#9c27b0" />,
                    bgColorStart: '#3b0a40',
                    bgColorEnd: '#4a0d50',
                    borderColor: '#9c27b0',
                    textColor: '#e9baff'
                };
            default:
                return {
                    title: 'Top Player',
                    icon: <FaMedal size={24} color="#FFD700" />,
                    bgColorStart: '#312500',
                    bgColorEnd: '#3d2f00',
                    borderColor: '#FFD700',
                    textColor: '#ffe066'
                };
        }
    };

    return (
        <Card className="text-white" style={{ boxShadow: 'none' }}>
            <Card.Body className="text-center">
                <div className="avatar-placeholder mb-3">
                    {isNumberOne ? (
                        isTopLoser ? (
                            <Image 
                                src={shitLogo} 
                                alt="Loser Logo" 
                                width={130} 
                                height={130} 
                                style={{ filter: 'drop-shadow(0 0 3px rgba(156, 39, 176, 0.5))', borderRadius: '24px' }} 
                            />
                        ) : (
                            <Image 
                                src={kingLogo} 
                                alt="Casino Logo King" 
                                width={130} 
                                height={130} 
                                style={{ filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.5))', borderRadius: '24px' }} 
                            />
                        )
                    ) : (
                        <FaUser size={60} />
                    )}
                </div>
                <div className="balance-display p-3 mb-3 rounded" style={{ backgroundColor: '#334155', borderWidth: '1px', borderStyle: 'solid' }}>
                    <h5 className="mb-1">Current Balance</h5>
                    <h3 className="mb-0 text-warning">
                        <FaCoins className="me-2" />
                        {(profileData?.balance ?? 0).toFixed(2)}
                    </h3>
                </div>
                <Card.Title style={{ paddingBottom: '10px' }}>{profileData.username || 'User'}</Card.Title>
                <Card.Subtitle className="mb-3 text-white">{profileData.email || 'No email'}</Card.Subtitle>
                
                {/* Achievements Section */}
                {isNumberOne && (
                    <div className="achievements-section mb-4">
                        <h6 className="text-center mb-3">
                            <FaTrophy className="me-2" color="#FFD700" />
                            Top Rankings
                        </h6>
                        <div className="ranking-badges">
                            {numberOneRankingDetails.map((detail, index) => {
                                const badgeInfo = getBadgeForRanking(detail.type, detail.game);
                                const isLoserRanking = detail.isLoserRanking;
                                const badgeAnimation = isLoserRanking ? 'shake 2s infinite' : '';
                                
                                return (
                                    <div 
                                        key={index} 
                                        className="ranking-badge-container text-center p-2 mb-2"
                                        style={{
                                            background: `linear-gradient(135deg, ${badgeInfo.bgColorStart} 0%, ${badgeInfo.bgColorEnd} 100%)`,
                                            borderRadius: '8px',
                                            border: `2px solid ${badgeInfo.borderColor}`,
                                            boxShadow: `0 3px 6px rgba(0,0,0,0.2)`,
                                            width: '48%',
                                            animation: badgeAnimation
                                        }}
                                    >
                                        <div className="badge-icon mb-1">
                                            {badgeInfo.icon}
                                        </div>
                                        <div className="badge-title" style={{ fontSize: '0.7rem', fontWeight: 'bold', color: badgeInfo.textColor }}>
                                            {badgeInfo.title}
                                        </div>
                                        <div className="badge-game" style={{ fontSize: '0.65rem', color: badgeInfo.textColor }}>
                                            {detail.game}
                                        </div>
                                        {isLoserRanking && (
                                            <div className="badge-loser" style={{ fontSize: '0.6rem', color: '#ff6b6b', marginTop: '2px' }}>
                                                Biggest Loser
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                <div className="d-flex justify-content-between mb-3">
                    <div><FaCalendarAlt className="me-2" /><small>Joined</small></div>
                    <small>{profileData.registrationDate ? new Date(profileData.registrationDate).toLocaleDateString() : 'N/A'}</small>
                </div>
                
                <div className="role-badge">
                    <Badge bg={profileData.role === 'ADMIN' ? 'danger' : 'info'} className="p-2">
                        {profileData.role || 'USER'}
                    </Badge>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ProfileHeader; 