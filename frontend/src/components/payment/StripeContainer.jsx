/**
 * StripeContainer Component
 * A container component that initializes and configures Stripe payment integration.
 * 
 * Features:
 * - Dynamic Stripe initialization with publishable key
 * - Loading states with visual feedback
 * - Error handling for configuration issues
 * - Stripe Elements integration
 * - Customizable appearance options
 * - Support for multiple payment methods
 */

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import paymentService from '../../services/paymentService';
import { Container, Row, Col, Spinner, Image } from 'react-bootstrap';
import logoCasino from '../images/logo-casino.png';

// ===== Constants =====

/**
 * Stripe instance - initialized dynamically with publishable key
 */
let stripePromise = null;

// ===== Component =====

/**
 * StripeContainer Component
 * Initializes Stripe and provides payment form context
 * 
 * @param {Object} props - Component props
 * @param {Function} props.setMessage - Function to display status messages
 */
const StripeContainer = ({ setMessage }) => {
  // ===== State =====
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState(null);

  // ===== Effects =====

  /**
   * Effect to fetch Stripe configuration and initialize payment system
   */
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const config = await paymentService.getStripeConfig();
        
        if (config.publishableKey) {
          console.log('Received publishable key:', config.publishableKey);
          // Initialize Stripe with the publishable key
          stripePromise = loadStripe(config.publishableKey);
          
          // Set Stripe appearance options
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

  // ===== Render Functions =====

  /**
   * Renders the loading screen with animation
   * @param {string} message - Loading message to display
   * @returns {JSX.Element} Loading screen component
   */
  const renderLoadingScreen = (message) => {
    return (
      <Container className="text-center my-5">
        <div className="loading-logo-container mb-4">
          <Image 
            src={logoCasino} 
            alt="Casino Logo" 
            className="loading-logo mb-3" 
            style={{ 
              width: '180px', 
              filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.5))',
              animation: 'pulse-glow 1.5s infinite alternate'
            }} 
          />
        </div>
        <Spinner animation="border" role="status" variant="warning" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-accent">{message}</p>
      </Container>
    );
  };

  // ===== Main Render =====

  // Show loading screen while initializing
  if (loading) {
    return renderLoadingScreen('Loading payment system...');
  }

  // Show loading screen if Stripe is not initialized
  if (!options || !stripePromise) {
    return renderLoadingScreen('Initializing payment system...');
  }

  // Render Stripe Elements with CheckoutForm
  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm setMessage={setMessage} />
    </Elements>
  );
};

export default StripeContainer;
