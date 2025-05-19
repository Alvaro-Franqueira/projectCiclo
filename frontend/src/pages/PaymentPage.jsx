import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Image } from 'react-bootstrap';
import { FaCoins, FaLock, FaDollarSign, FaChartLine, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import StripeContainer from '../components/payment/StripeContainer';
import logoCasino from '../components/images/logo-casino.png';

const PaymentPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState({ text: '', type: '' });
  const [messageVisible, setMessageVisible] = useState(false);

  // Show message when authentication is required
  useEffect(() => {
    if (!isAuthenticated) {
      setMessage({
        text: 'You need to be logged in to add credits to your account. Please log in or register to continue.',
        type: 'warning'
      });
      setMessageVisible(true);
    }
  }, [isAuthenticated]);

  // Hide message after some time
  useEffect(() => {
    if (message.text) {
      setMessageVisible(true);
      
      const timer = setTimeout(() => {
        setMessageVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Container className="my-5">
      {/* Floating message with logo */}
      {message.text && (
        <div 
          className={`floating-message alert alert-${message.type}`}
          style={{
            position: 'fixed',
            bottom: messageVisible ? '30px' : '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1050,
            minWidth: '300px',
            maxWidth: '80%',
            boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
            textAlign: 'center',
            padding: '15px',
            borderRadius: '10px',
            opacity: messageVisible ? 0.95 : 0,
            fontWeight: 'bold',
            border: '2px solid',
            transition: 'all 0.8s ease-in-out',
            borderColor: message.type === 'success' ? 'var(--success-color)' : 
                         message.type === 'danger' ? 'var(--danger-color)' : 
                         message.type === 'warning' ? '#f59e0b' : '#0d6efd'
          }}
        >
          {message.text}
        </div>
      )}
      
      <div className="text-center mb-5">
        <h1 className="display-5 text-accent mb-3">
          <FaCoins className="me-2 shimmer-icon" /> Casino Credits
        </h1>
        <p className="lead text-light">Fuel your gameplay with additional credits</p>
      </div>
      
      <Row className="justify-content-center mb-5">
        <Col lg={10} xl={8}>
          <Card className="border-0 shadow-lg balance-display-card">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col md={6} className="balance-section p-4">
                  <div className="text-center">
                    <h4 className="text-white mb-3">Your Current Balance</h4>
                    <div className="balance-amount">
                      <FaCoins className="balance-icon" />
                      <span className="balance-value">{user?.balance?.toLocaleString() || 0}</span>
                    </div>
                    <p className="text-light mt-2">Available credits</p>
                  </div>
                </Col>
                
                <Col md={6} className="exchange-section p-4">
                  <div className="text-center">
                    <h4 className="text-white mb-3">Exchange Rate</h4>
                    <div className="exchange-rate">
                      <div className="exchange-item">
                        <FaDollarSign size={28} />
                        <span>€1</span>
                      </div>
                      <div className="exchange-equals">=</div>
                      <div className="exchange-item">
                        <FaCoins size={28} />
                        <span>1,000</span>
                      </div>
                    </div>
                    <p className="text-light mt-2">Minimum purchase: €1</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <StripeContainer setMessage={setMessage} />
      
      <Row className="justify-content-center mt-5">
        <Col md={10} lg={8}>
          <Card className="border-0 shadow why-add-credits">
            <Card.Header className="bg-gradient text-center py-3">
              <h3 className="mb-0 text-white">Why Add Credits?</h3>
            </Card.Header>
            <Card.Body className="p-4">
              <Row>
                <Col md={4} className="benefit-item mb-3 mb-md-0">
                  <div className="text-center">
                    <FaChartLine className="benefit-icon mb-3" />
                    <h5>Bigger Wins</h5>
                    <p>Place bigger bets for increased potential payouts</p>
                  </div>
                </Col>
                <Col md={4} className="benefit-item mb-3 mb-md-0">
                  <div className="text-center">
                    <FaCoins className="benefit-icon mb-3" />
                    <h5>More Games</h5>
                    <p>Explore our full range of casino games</p>
                  </div>
                </Col>
                <Col md={4} className="benefit-item">
                  <div className="text-center">
                    <FaLock className="benefit-icon mb-3" />
                    <h5>Secure Process</h5>
                    <p>All transactions are encrypted and secure</p>
                  </div>
                </Col>
              </Row>
              <div className="security-note mt-4 p-3 rounded">
                <div className="d-flex align-items-center">
                  <FaLock className="me-2" />
                  <small className="mb-0">
                    All payments are processed securely through Stripe. Your payment information is never stored on our servers.
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentPage;
