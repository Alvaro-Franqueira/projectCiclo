import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import paymentService from '../../services/paymentService';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = () => {
  const { user, updateUserBalance } = useAuth();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [amount, setAmount] = useState(10); // Default amount in euros
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('initial'); // 'initial', 'processing', 'succeeded', 'failed'

  // Create a payment intent when the component mounts or amount changes
  useEffect(() => {
    const createIntent = async () => {
      if (!user?.id) {
        console.log('No user ID available, cannot create payment intent');
        return;
      }
      
      try {
        setLoading(true);
        setError(''); // Clear any previous errors
        
        // Convert euros to cents for Stripe
        const amountInCents = Math.round(amount * 100);
        console.log(`Creating payment intent for ${amountInCents} cents (€${amount})`);
        
        const response = await paymentService.createPaymentIntent(
          amountInCents,
          'eur',
          user.id
        );
        
        if (response && response.clientSecret) {
          console.log('Successfully received client secret');
          setClientSecret(response.clientSecret);
        } else {
          console.error('Invalid response from payment service:', response);
          setError('Failed to initialize payment: Invalid response from server');
        }
      } catch (err) {
        console.error('Error creating payment intent:', err);
        if (err.error) {
          setError(`Payment initialization failed: ${err.error}`);
        } else {
          setError(err.message || 'Failed to initialize payment');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      createIntent();
    }
  }, [amount, user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      console.log('Missing required elements for payment submission', {
        stripe: !!stripe,
        elements: !!elements,
        clientSecret: !!clientSecret
      });
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');
    setError(''); // Clear any previous errors

    try {
      console.log('Confirming payment with Stripe...');
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (submitError) {
        console.error('Payment confirmation error:', submitError);
        setError(submitError.message || 'Payment failed');
        setPaymentStatus('failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        console.log('Payment succeeded:', paymentIntent);
        setPaymentStatus('succeeded');
        
        // Calculate credits to add
        const creditsToAdd = amount * 1000;
        
        // In a real implementation, this would be handled by the webhook
        // For demo purposes, we're updating the balance here
        const newBalance = user.balance + creditsToAdd;
        updateUserBalance(newBalance);
        
        setMessage(`Successfully added ${creditsToAdd} credits to your account!`);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        console.log('Payment status:', paymentIntent?.status || 'unknown');
        setMessage('Payment is being processed. You will be notified when it completes.');
      }
    } catch (err) {
      console.error('Unexpected payment error:', err);
      setError('An unexpected error occurred during payment processing');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const newAmount = Number(e.target.value);
    setAmount(newAmount);
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
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount (€)</Form.Label>
                  <Form.Control
                    type="number"
                    min="5"
                    step="5"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={paymentStatus === 'processing'}
                    required
                  />
                  <Form.Text className="text-muted">
                    You will receive {amount * 1000} credits.
                  </Form.Text>
                </Form.Group>
                
                {clientSecret ? (
                  <div className="mb-3">
                    <PaymentElement />
                  </div>
                ) : loading ? (
                  <div className="text-center mb-3">
                    <p>Initializing payment form...</p>
                  </div>
                ) : error ? (
                  <div className="text-center mb-3">
                    <p>Please correct the errors above and try again.</p>
                  </div>
                ) : (
                  <div className="text-center mb-3">
                    <p>Loading payment form...</p>
                  </div>
                )}
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading || !stripe || !elements || !clientSecret}
                  >
                    {loading ? 'Processing...' : `Pay €${amount}`}
                  </Button>
                </div>
              </Form>
              
              {paymentStatus === 'succeeded' && (
                <div className="mt-3 text-center">
                  <p className="text-success">Payment successful! Redirecting...</p>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="text-center">
              <small className="text-muted">
                Secure payment processing by Stripe
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutForm;
