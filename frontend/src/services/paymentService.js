import api from './api';

const PAYMENT_ENDPOINTS = {
  CREATE_PAYMENT_INTENT: '/payments/create-payment-intent',
  PROCESS_PAYMENT: '/payments/process',
  GET_CONFIG: '/payments/config'
};

const paymentService = {
  /**
   * Create a payment intent for processing a payment
   * @param {number} amount - The amount to charge in the smallest currency unit (e.g., cents)
   * @param {string} currency - The currency to use (e.g., 'eur', 'usd')
   * @param {number} userId - The ID of the user making the payment
   * @returns {Promise<Object>} - The payment intent response with client secret
   */
  createPaymentIntent: async (amount, currency, userId) => {
    try {
      console.log('Creating payment intent with:', { amount, currency, userId });
      const response = await api.post(PAYMENT_ENDPOINTS.CREATE_PAYMENT_INTENT, {
        amount,
        currency,
        userId
      });
      console.log('Payment intent response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error.response?.data || { message: 'Failed to create payment intent' };
    }
  },

  /**
   * Process a payment directly without using Stripe
   * @param {number} userId - The ID of the user making the payment
   * @param {number} amount - The amount to charge in euros/dollars
   * @param {string} cardNumber - The last 4 digits of the card number
   * @param {string} cardholderName - The name on the card
   * @returns {Promise<Object>} - The payment response with updated balance
   */
  processPayment: async (userId, amount, cardNumber, cardholderName) => {
    try {
      console.log('Processing payment with:', { userId, amount, cardNumber, cardholderName });
      
      // Extract last 4 digits of card number for reference
      const last4 = cardNumber.replace(/\s+/g, '').slice(-4);
      
      const response = await api.post(PAYMENT_ENDPOINTS.PROCESS_PAYMENT, {
        userId,
        amount,
        cardNumber: last4,
        cardholderName
      });
      
      console.log('Payment response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error.response?.data || { message: 'Failed to process payment' };
    }
  },
  getStripeConfig: async () => {
    try {
      const response = await api.get(PAYMENT_ENDPOINTS.GET_CONFIG);
      console.log('Stripe config response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching Stripe config:', error);
      throw error.response?.data || { message: 'Failed to fetch Stripe configuration' };
    }
  }
};

export default paymentService;
