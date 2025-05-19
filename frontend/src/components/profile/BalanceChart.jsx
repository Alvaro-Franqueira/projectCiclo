/**
 * BalanceChart Component
 * Displays a line chart showing the user's balance evolution over time.
 * 
 * Features:
 * - Interactive line chart with tooltips
 * - Timeframe filtering (week, month, all time)
 * - Responsive design
 * - Custom styling for dark theme
 */

import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaChartLine } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';

/**
 * BalanceChart Component
 * @param {Object} props
 * @param {Array} props.balanceHistory - Array of balance history points
 * @param {string} props.chartTimeframe - Current timeframe ('week', 'month', 'all')
 * @param {Function} props.onTimeframeChange - Callback for timeframe changes
 * @returns {JSX.Element} Balance evolution chart card
 */
const BalanceChart = ({ balanceHistory, chartTimeframe, onTimeframeChange }) => {
    const chartData = {
        labels: balanceHistory.map(item => item.date),
        datasets: [{
            label: 'Balance',
            data: balanceHistory.map(item => item.balance),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#e2e8f0'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            x: {
                ticks: {
                    color: '#e2e8f0',
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#e2e8f0'
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `Balance: $${context.parsed.y.toFixed(2)}`;
                    }
                }
            }
        }
    };

    return (
        <Card className="mb-4" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
            <Card.Header className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}>
                <h5 className="mb-0"><FaChartLine className="me-2" /> Balance Evolution</h5>
                <div>
                    <Button 
                        variant={chartTimeframe === 'week' ? 'warning' : 'outline-secondary'} 
                        size="sm" 
                        className="me-2" 
                        onClick={() => onTimeframeChange('week')}
                    >
                        Week
                    </Button>
                    <Button 
                        variant={chartTimeframe === 'month' ? 'warning' : 'outline-secondary'} 
                        size="sm" 
                        className="me-2" 
                        onClick={() => onTimeframeChange('month')}
                    >
                        Month
                    </Button>
                    <Button 
                        variant={chartTimeframe === 'all' ? 'warning' : 'outline-secondary'} 
                        size="sm" 
                        onClick={() => onTimeframeChange('all')}
                    >
                        All Time
                    </Button>
                </div>
            </Card.Header>
            <Card.Body>
                {balanceHistory.length > 0 ? (
                    <div style={{ height: '300px', position: 'relative' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                ) : (
                    <div className="text-center py-5">
                        <FaChartLine size={40} className="mb-3 text-secondary" />
                        <p>Not enough bet history to display balance evolution.</p>
                        <p className="text-muted small">Place more bets to see your balance change over time.</p>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default BalanceChart; 