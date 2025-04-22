import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';

// Load Stripe outside of component render to avoid recreating the Stripe object on every render
// Replace with your publishable key from Stripe dashboard
const stripePromise = loadStripe('pk_test_51RGeOjPsNS1uIdSU80veezvYOkfGhCObUFHhQGmMJgDtljPRtMpflSTatTKF10VEIHeNS0LqbJCBtL4WDFRgRDTY00mnSEp14e');

const StripeContainer = () => {
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0d6efd',
    },
  };

  const options = {
    appearance,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm />
    </Elements>
  );
};

export default StripeContainer;
