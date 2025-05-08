import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import paymentService from '../../services/paymentService';
import { Container, Row, Col, Spinner } from 'react-bootstrap';

// We'll load Stripe dynamically once we get the publishable key from the backend
let stripePromise = null;

const StripeContainer = ({ setMessage }) => {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState(null);

  useEffect(() => {
    // Fetch the publishable key from the backend
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const config = await paymentService.getStripeConfig();
        
        if (config.publishableKey) {
          console.log('Received publishable key:', config.publishableKey);
          // Initialize Stripe with the publishable key
          stripePromise = loadStripe(config.publishableKey);
          
          // Set Stripe appearance options with mode and payment methods
          setOptions({
            mode: 'payment',
            amount: 1000, // Default amount in cents (10 EUR)
            currency: 'eur',
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#0d6efd',
              },
            },
            paymentMethodTypes: ['card', 'paypal'],
            paymentMethodCreation: 'manual' // Required for createPaymentMethod with PaymentElement
          });
          
          setMessage({ text: '', type: '' });
        } else {
          setMessage({ 
            text: 'Failed to load Stripe configuration: Missing publishable key', 
            type: 'danger' 
          });
        }
      } catch (err) {
        console.error('Error loading Stripe configuration:', err);
        setMessage({ 
          text: 'Failed to load Stripe configuration. Please try again later.', 
          type: 'danger' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [setMessage]);

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading payment system...</p>
      </Container>
    );
  }

  if (!options || !stripePromise) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Initializing payment system...</p>
      </Container>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm setMessage={setMessage} />
    </Elements>
  );
};

export default StripeContainer;
