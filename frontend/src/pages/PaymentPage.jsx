import React from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import PaymentForm from '../components/payment/PaymentForm';

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
        <Card className="shadow-sm mb-4 bg-dark text-white">
          <Card.Body>
            <Row>
              <Col md={6} className="border-end border-light">
                <h5>Your Current Balance</h5>
                <p className="display-6 text-primary">{user?.balance?.toLocaleString() || 0} credits</p>
              </Col>
              <Col md={6}>
                <h5>Exchange Rate</h5>
                <p className="lead">
                  <strong>€1 = 1,000 credits</strong>
                </p>
                <p className="text-muted small">
                  The minimum purchase amount is €5.
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>

    <PaymentForm style={{ textColor: 'white' }} />

    <Row className="justify-content-center mt-4 ">
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
              This is a demo payment system. No actual charges will be made.
            </p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </Container>
);
};

export default PaymentPage;
