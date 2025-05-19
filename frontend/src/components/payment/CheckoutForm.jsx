import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Spinner } from 'react-bootstrap';
import { FaCoins, FaCreditCard, FaCheckCircle, FaLock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import paymentService from '../../services/paymentService';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Constants
const DEFAULT_AMOUNT = 10;
const CREDIT_MULTIPLIER = 1000;
const REDIRECT_DELAY = 3000;
const AMOUNT_OPTIONS = [5, 10, 20, 50, 100];

/**
 * CheckoutForm component for handling Stripe payment processing.
 * Manages payment form state, validation, and processing.
 * Provides user feedback during payment processing.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.setMessage - Function to display status messages
 */
const CheckoutForm = ({ setMessage }) => {
  // ===== Hooks =====
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  // ===== State =====
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('initial'); // 'initial', 'processing', 'succeeded', 'failed'

  // ===== Event Handlers =====

  /**
   * Handles changes to the custom amount input field.
   * 
   * @param {Event} e - Input change event
   */
  const handleAmountChange = (e) => {
    const newAmount = Number(e.target.value);
    setAmount(newAmount);
  };

  /**
   * Handles form submission and payment processing.
   * Validates payment details, creates payment intent, and processes payment.
   * 
   * @param {Event} e - Form submission event
   */
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
      await processPayment();
    } catch (err) {
      handlePaymentError(err);
    } finally {
      setLoading(false);
    }
  };

  // ===== Payment Processing Functions =====

  /**
   * Main payment processing function that handles the entire payment flow.
   * Validates payment details, creates payment intent, and processes payment.
   */
  const processPayment = async () => {
    // Validate payment details
      const { error: submitError } = await elements.submit();
      if (submitError) {
      handleValidationError(submitError);
          return;
        }

    // Create payment intent
    const amountInCents = Math.round(amount * 100);
    const paymentIntentResponse = await createPaymentIntent(amountInCents);
    if (!paymentIntentResponse?.clientSecret) {
      throw new Error('Failed to create payment intent');
      }
      
    // Process payment
    await confirmAndProcessPayment(paymentIntentResponse.clientSecret);
  };

  /**
   * Creates a payment intent on the server.
   * 
   * @param {number} amountInCents - Amount in cents
   * @returns {Promise<Object>} Payment intent response
   */
  const createPaymentIntent = async (amountInCents) => {
      console.log(`Creating payment intent for ${amountInCents} cents (€${amount})`);
    return await paymentService.createPaymentIntent(
        amountInCents,
        'eur',
        user.id
      );
  };

  /**
   * Confirms the payment with Stripe and processes it on the backend.
   * 
   * @param {string} clientSecret - Payment intent client secret
   */
  const confirmAndProcessPayment = async (clientSecret) => {
    // Get payment method
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
      
    // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          payment_method: paymentMethod.id,
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
      handlePaymentConfirmationError(confirmError);
    } else if (paymentIntent?.status === 'succeeded') {
      await handleSuccessfulPayment(paymentIntent);
    } else {
      handlePendingPayment(paymentIntent);
    }
  };

  // ===== Error Handling Functions =====

  /**
   * Handles validation errors from Stripe Elements.
   * 
   * @param {Object} error - Validation error object
   */
  const handleValidationError = (error) => {
    console.error('Elements submission error:', error);
    if (error.type === 'validation_error') {
      setMessage({ 
        text: `Please check your payment details: ${error.message}`,
        type: 'danger'
      });
      setPaymentStatus('failed');
      setLoading(false);
    } else {
      throw error;
    }
  };

  /**
   * Handles payment confirmation errors.
   * 
   * @param {Object} error - Payment confirmation error
   */
  const handlePaymentConfirmationError = (error) => {
    console.error('Payment confirmation error:', error);
    setMessage({ text: error.message || 'Payment failed', type: 'danger' });
        setPaymentStatus('failed');
  };

  /**
   * Handles successful payment processing.
   * Updates user balance and provides feedback.
   * 
   * @param {Object} paymentIntent - Stripe payment intent object
   */
  const handleSuccessfulPayment = async (paymentIntent) => {
        console.log('Payment succeeded:', paymentIntent);
        setPaymentStatus('succeeded');
        
    try {
      const result = await updateUserBalance();
      handleBalanceUpdateResult(result);
    } catch (dbError) {
      handleBalanceUpdateError(dbError);
    }

    setTimeout(() => navigate('/profile'), REDIRECT_DELAY);
  };

  /**
   * Updates user balance after successful payment.
   * 
   * @returns {Promise<Object>} Result of balance update
   */
  const updateUserBalance = async () => {
          const paymentData = {
            userId: user.id,
            amount: amount,
      cardNumber: "Stripe Payment",
            cardholderName: user.username || "Casino User"
          };
          
    return await paymentService.processPayment(
            paymentData.userId,
            paymentData.amount,
            paymentData.cardNumber,
            paymentData.cardholderName
          );
  };

  /**
   * Handles the result of balance update.
   * 
   * @param {Object} result - Balance update result
   */
  const handleBalanceUpdateResult = async (result) => {
          console.log('Backend payment processing result:', result);
          
          if (result.success) {
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
  };

  /**
   * Handles errors during balance update.
   * 
   * @param {Error} error - Database error
   */
  const handleBalanceUpdateError = (error) => {
    console.error('Error updating user balance in database:', error);
          setMessage({
            text: 'Payment was successful, but there was an error updating your balance. Please contact support.',
            type: 'warning'
          });
  };

  /**
   * Handles pending payment status.
   * 
   * @param {Object} paymentIntent - Stripe payment intent object
   */
  const handlePendingPayment = (paymentIntent) => {
        console.log('Payment status:', paymentIntent?.status || 'unknown');
        setMessage({
          text: 'Payment is being processed. You will be notified when it completes.',
          type: 'info'
        });
  };

  /**
   * Handles payment errors and sets appropriate error messages.
   * 
   * @param {Error} err - Error object
   */
  const handlePaymentError = (err) => {
      console.error('Unexpected payment error:', err);
    
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
  };

  // ===== Render Functions =====

  /**
   * Renders the credit exchange rate information.
   */
  const renderExchangeRate = () => (
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
  );
              
  /**
   * Renders the amount selection section.
   */
  const renderAmountSelection = () => (
                <Form.Group className="mb-4">
                  <Form.Label className="fs-5 text-white">Select Amount</Form.Label>
                  
                  <div className="amount-buttons mb-3">
        {AMOUNT_OPTIONS.map(amt => (
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
          You will receive <span className="highlight-credits">{amount * CREDIT_MULTIPLIER}</span> credits
                    </h4>
                  </div>
                </Form.Group>
  );
                
  /**
   * Renders the payment method section.
   */
  const renderPaymentMethod = () => (
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
  );

  /**
   * Renders the success message.
   */
  const renderSuccessMessage = () => (
    paymentStatus === 'succeeded' && (
      <div className="mt-3 text-center success-container p-3 rounded">
        <FaCheckCircle size={40} className="text-success mb-2" />
        <h4 className="text-success">Payment Successful!</h4>
        <p>Your credits have been added to your account.</p>
        <p>Redirecting to your profile...</p>
      </div>
    )
  );

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg payment-card border-0">
            {/* Card Header */}
            <Card.Header className="text-center py-4 bg-gradient">
              <h3 className="mb-0 text-accent">
                <FaCoins className="me-2 shimmer-icon" />
                Purchase Casino Credits
              </h3>
            </Card.Header>

            {/* Card Body */}
            <Card.Body className="p-4">
              {renderExchangeRate()}
              
              <Form onSubmit={handleSubmit} className="mb-4">
                {renderAmountSelection()}
                {renderPaymentMethod()}
                
                {/* Submit Button */}
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
              
              {renderSuccessMessage()}
            </Card.Body>

            {/* Card Footer */}
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
