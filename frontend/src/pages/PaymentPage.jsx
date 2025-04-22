import React from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import StripeContainer from '../components/payment/StripeContainer';

const PaymentPage = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Container className="my-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Alert variant="warning">
              <Alert.Heading>Authentication Required</Alert.Heading>
              <p>
                You need to be logged in to add credits to your account.
                Please log in or register to continue.
              </p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Row className="justify-content-center mb-4">
        <Col md={8}>
          <h2 className="text-center mb-4">Add Credits to Your Account</h2>
          <Card className="shadow-sm mb-4 text-white">
            <Card.Body>
              <Row>
                <Col md={6} className="border-end">
                  <h5>Your Current Balance</h5>
                  <p className="display-6 text-primary">{user?.balance?.toLocaleString() || 0} credits</p>
                </Col>
                <Col md={6}>
                  <h5>Exchange Rate</h5>
                  <p className="lead">
                    <strong>€1 = 1,000 credits</strong>
                  </p>
                  <p className="text-white small">
                    The minimum purchase amount is €5.
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <StripeContainer />
      
      <Row className="justify-content-center mt-4">
        <Col md={8} lg={6}>
          <Card className="bg-light">
            <Card.Body>
              <h5>Why Add Credits?</h5>
              <ul>
                <li>Place bigger bets for bigger potential wins</li>
                <li>Try different games in our virtual casino</li>
                <li>Enjoy uninterrupted gameplay without running out of credits</li>
              </ul>
              <p className="small text-muted mb-0">
                All payments are processed securely through Stripe. Your payment information is never stored on our servers.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentPage;
