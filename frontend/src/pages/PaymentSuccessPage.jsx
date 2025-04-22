import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    // Parse the query parameters to get payment information
    const params = new URLSearchParams(location.search);
    const paymentIntent = params.get('payment_intent');
    const paymentIntentClientSecret = params.get('payment_intent_client_secret');
    
    if (paymentIntent && paymentIntentClientSecret) {
      setPaymentInfo({
        paymentIntent,
        paymentIntentClientSecret
      });
    }
    
    // Automatically redirect to home after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [location, navigate]);

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow text-center">
            <Card.Header className="bg-success text-white">
              <h3>Payment Successful!</h3>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
              </div>
              
              <h4>Thank You for Your Purchase</h4>
              
              <p className="lead">
                Your credits have been added to your account.
              </p>
              
              {user && (
                <p>
                  Your current balance: <strong>{user.balance.toLocaleString()} credits</strong>
                </p>
              )}
              
              <p className="text-muted">
                You will be redirected to the home page in a few seconds...
              </p>
              
              <div className="mt-4">
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/')}
                >
                  Return to Home
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentSuccessPage;
