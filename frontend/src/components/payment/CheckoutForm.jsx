import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Spinner } from 'react-bootstrap';
import { FaCoins, FaCreditCard, FaCheckCircle, FaLock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import paymentService from '../../services/paymentService';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = ({ setMessage }) => {
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [amount, setAmount] = useState(10); // Default amount in euros
  const [loading, setLoading] = useState(false);
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
    setMessage({ text: '', type: '' }); // Clear any previous messages

    try {
      // First, submit the elements form to validate payment details
      console.log('Submitting elements form...');
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        console.error('Elements submission error:', submitError);
        // Handle validation errors more gracefully
        if (submitError.type === 'validation_error') {
          setMessage({ 
            text: `Please check your payment details: ${submitError.message}`,
            type: 'danger'
          });
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
        setMessage({ text: confirmError.message || 'Payment failed', type: 'danger' });
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
            
            setMessage({ 
              text: `Successfully added ${result.creditsAdded} credits to your account!`,
              type: 'success'
            });
          } else {
            setMessage({ 
              text: `Payment processed but failed to update balance: ${result.message}`,
              type: 'danger'
            });
          }
        } catch (dbError) {
          console.error('Error updating user balance in database:', dbError);
          setMessage({
            text: 'Payment was successful, but there was an error updating your balance. Please contact support.',
            type: 'warning'
          });
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      } else {
        console.log('Payment status:', paymentIntent?.status || 'unknown');
        setMessage({
          text: 'Payment is being processed. You will be notified when it completes.',
          type: 'info'
        });
      }
    } catch (err) {
      console.error('Unexpected payment error:', err);
      // Provide more user-friendly error messages
      if (err.type === 'validation_error') {
        setMessage({ 
          text: `Please check your payment details: ${err.message}`,
          type: 'danger'
        });
      } else if (err.type === 'card_error') {
        setMessage({ 
          text: `Card error: ${err.message}`,
          type: 'danger'
        });
      } else {
        setMessage({
          text: 'An unexpected error occurred during payment processing. Please try again.',
          type: 'danger'
        });
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

  // Fixed values for amount selection
  const amounts = [5, 10, 20, 50, 100];

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg payment-card border-0">
            <Card.Header className="text-center py-4 bg-gradient">
              <h3 className="mb-0 text-accent">
                <FaCoins className="me-2 shimmer-icon" />
                Purchase Casino Credits
              </h3>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-4 p-3 rounded credit-exchange-info">
                <h5 className="text-accent mb-3">Credit Exchange Rate</h5>
                <div className="d-flex justify-content-center align-items-center exchange-rate-display">
                  <div className="exchange-rate-item">
                    <FaCreditCard size={24} />
                    <span className="mx-2 fs-4">€1</span>
                  </div>
                  <div className="exchange-arrow">=</div>
                  <div className="exchange-rate-item">
                    <FaCoins size={24} />
                    <span className="mx-2 fs-4">1,000 Credits</span>
                  </div>
                </div>
              </div>
              
              <Form onSubmit={handleSubmit} className="mb-4">
                <Form.Group className="mb-4">
                  <Form.Label className="fs-5 text-white">Select Amount</Form.Label>
                  
                  <div className="amount-buttons mb-3">
                    {amounts.map(amt => (
                      <Button
                        key={amt}
                        variant={amount === amt ? "warning" : "outline-light"}
                        onClick={() => setAmount(amt)}
                        className={`amount-button ${amount === amt ? 'selected' : ''}`}
                        disabled={loading || paymentStatus === 'processing'}
                      >
                        €{amt}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="custom-amount-container">
                    <Form.Label className="text-white">Or enter custom amount (€)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={handleAmountChange}
                      disabled={paymentStatus === 'processing' || loading}
                      required
                      className="text-white backg-dark custom-amount-input"
                    />
                  </div>
                  
                  <div className="credit-preview mt-3">
                    <h4 className="text-center text-accent">
                      You will receive <span className="highlight-credits">{amount * 1000}</span> credits
                    </h4>
                  </div>
                </Form.Group>
                
                <div className="mb-4 payment-method-section">
                  <h5 className="mb-3 text-white">Payment Method</h5>
                  <div className="payment-methods-container rounded p-3">
                    <PaymentElement options={{
                      layout: {
                        type: 'tabs',
                        defaultCollapsed: false
                      }
                    }} />
                  </div>
                </div>
                
                <div className="d-grid gap-2 mt-4">
                  <Button 
                    variant="warning" 
                    type="submit" 
                    size="lg"
                    className="pay-button"
                    disabled={loading || !stripe || !elements || paymentStatus === 'processing'}
                  >
                    {loading || paymentStatus === 'processing' ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <FaCreditCard className="me-2" />
                        Pay €{amount} Now
                      </>
                    )}
                  </Button>
                </div>
              </Form>
              
              {paymentStatus === 'succeeded' && (
                <div className="mt-3 text-center success-container p-3 rounded">
                  <FaCheckCircle size={40} className="text-success mb-2" />
                  <h4 className="text-success">Payment Successful!</h4>
                  <p>Your credits have been added to your account.</p>
                  <p>Redirecting to your profile...</p>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="text-center py-3 backg-dark border-top border-secondary">
              <div className="d-flex align-items-center justify-content-center">
                <FaLock 
                  className="me-2 text-accent" 
                  size={16}
                />
                <span className="text-white">
                  Secure payment processing by Stripe
                </span>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutForm;
