import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import paymentService from '../../services/paymentService';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = () => {
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [amount, setAmount] = useState(10); // Default amount in euros
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('initial'); // 'initial', 'processing', 'succeeded', 'failed'

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.log('Missing required elements for payment submission', {
        stripe: !!stripe,
        elements: !!elements
      });
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');
    setError(''); // Clear any previous errors

    try {
      // First, submit the elements form to validate payment details
      console.log('Submitting elements form...');
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        console.error('Elements submission error:', submitError);
        // Handle validation errors more gracefully
        if (submitError.type === 'validation_error') {
          setError(`Please check your payment details: ${submitError.message}`);
          setPaymentStatus('failed');
          setLoading(false);
          return;
        }
        throw submitError;
      }
      
      // Create a payment intent
      const amountInCents = Math.round(amount * 100);
      console.log(`Creating payment intent for ${amountInCents} cents (€${amount})`);
      
      const paymentIntentResponse = await paymentService.createPaymentIntent(
        amountInCents,
        'eur',
        user.id
      );
      
      if (!paymentIntentResponse || !paymentIntentResponse.clientSecret) {
        throw new Error('Failed to create payment intent');
      }
      
      const clientSecret = paymentIntentResponse.clientSecret;
      console.log('Confirming payment with Stripe using clientSecret:', clientSecret);
      
      // Get the payment method from the elements
      const { paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: {
          billing_details: {
            name: user.username || 'Casino User',
            email: user.email
          }
        }
      });
      
      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }
      
      // Confirm the payment with the payment method
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          payment_method: paymentMethod.id,
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        console.error('Payment confirmation error:', confirmError);
        setError(confirmError.message || 'Payment failed');
        setPaymentStatus('failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        console.log('Payment succeeded:', paymentIntent);
        setPaymentStatus('succeeded');
        
        // Process the payment on the backend to update the user's balance in the database
        try {
          const paymentData = {
            userId: user.id,
            amount: amount,
            cardNumber: "Stripe Payment", // Just a reference since we're using Stripe
            cardholderName: user.username || "Casino User"
          };
          
          const result = await paymentService.processPayment(
            paymentData.userId,
            paymentData.amount,
            paymentData.cardNumber,
            paymentData.cardholderName
          );
          
          console.log('Backend payment processing result:', result);
          
          if (result.success) {
            // Refresh user data from the server to ensure we have the latest balance
            await refreshUserData();
            
            setMessage(`Successfully added ${result.creditsAdded} credits to your account!`);
          } else {
            setError(`Payment processed but failed to update balance: ${result.message}`);
          }
        } catch (dbError) {
          console.error('Error updating user balance in database:', dbError);
          setError('Payment was successful, but there was an error updating your balance. Please contact support.');
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/payment-success');
        }, 2000);
      } else {
        console.log('Payment status:', paymentIntent?.status || 'unknown');
        setMessage('Payment is being processed. You will be notified when it completes.');
      }
    } catch (err) {
      console.error('Unexpected payment error:', err);
      // Provide more user-friendly error messages
      if (err.type === 'validation_error') {
        setError(`Please check your payment details: ${err.message}`);
      } else if (err.type === 'card_error') {
        setError(`Card error: ${err.message}`);
      } else {
        setError('An unexpected error occurred during payment processing. Please try again.');
      }
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
                    disabled={paymentStatus === 'processing' || loading}
                    required
                  />
                  <Form.Text className="text-muted">
                    You will receive {amount * 1000} credits.
                  </Form.Text>
                </Form.Group>
                
                <div className="mb-4">
                  <h5 className="mb-3">Payment Method</h5>
                  <div className="payment-methods-container">
                    <PaymentElement />
                  </div>
                </div>
                
                <div className="d-grid gap-2 mt-4">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading || !stripe || !elements || paymentStatus === 'processing'}
                  >
                    {loading || paymentStatus === 'processing' ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Processing...
                      </>
                    ) : (
                      `Pay €${amount}`
                    )}
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
