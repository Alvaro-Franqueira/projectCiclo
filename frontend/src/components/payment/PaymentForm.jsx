import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import paymentService from '../../services/paymentService';

const PaymentForm = () => {
  const { user, updateUserBalance, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(10); // Default amount in euros
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  
  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate card details (simple validation)
    if (!cardNumber || cardNumber.length < 16) {
      setError('Please enter a valid card number');
      setLoading(false);
      return;
    }
    
    if (!cardExpiry || cardExpiry.length < 5) {
      setError('Please enter a valid expiry date (MM/YY)');
      setLoading(false);
      return;
    }
    
    if (!cardCvc || cardCvc.length < 3) {
      setError('Please enter a valid CVC code');
      setLoading(false);
      return;
    }
    
    try {
      // Process payment with the backend
      const response = await paymentService.processPayment(
        user.id,
        amount,
        cardNumber,
        cardName
      );
      
      if (response.success) {
        // Update the user's balance in the context
        updateUserBalance(response.newBalance);
        
        // Also refresh user data from the server to ensure we have the latest data
        await refreshUserData();
        
        setMessage(`Successfully added ${response.creditsAdded} credits to your account! Your new balance is ${response.newBalance} credits.`);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(response.message || 'Payment failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during payment processing');
    } finally {
      setLoading(false);
    }
  };
  
  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // Format expiry date
  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return value;
  };
  
  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Add Credits to Your Account</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {message && <Alert variant="success">{message}</Alert>}
              
              <p className="mb-4">
                For every €1 spent, you'll receive 1000 credits in your casino balance.
              </p>
              
              <Form onSubmit={handlePayment}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount (€)</Form.Label>
                  <Form.Control
                    type="number"
                    min="5"
                    step="5"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                  />
                  <Form.Text className="text-muted">
                    You will receive {amount * 1000} credits.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Card Number</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    required
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Expiry Date</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>CVC</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                        maxLength={4}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Cardholder Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Pay €${amount}`}
                  </Button>
                </div>
              </Form>
            </Card.Body>
            <Card.Footer className="text-center">
              <small className="text-muted">
                This payment will update your balance in the database.
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentForm;
