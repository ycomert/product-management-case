# Payment System Setup Guide

## Overview
This ecommerce backend now includes Stripe payment processing integration. The payment system allows users to create payment intents, process payments, and handle refunds.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file based on `.env.example` and add your Stripe keys:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 3. Get Stripe API Keys
1. Sign up for a Stripe account at https://stripe.com
2. Go to the Stripe Dashboard
3. Navigate to Developers > API Keys
4. Copy your Publishable Key and Secret Key
5. Use test keys for development (start with `pk_test_` and `sk_test_`)

### 4. Database Migration
The Order entity has been updated with payment fields. Run the application to automatically sync the database schema:

```bash
npm run start:dev
```

## API Endpoints

### Payment Endpoints

#### Create Payment Intent
```http
POST /payments/create-payment-intent
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 99.99,
  "currency": "usd",
  "orderId": "order-uuid"
}
```

Response:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 99.99,
  "currency": "usd"
}
```

#### Get Payment Status
```http
GET /payments/payment-status/:paymentIntentId
Authorization: Bearer <jwt_token>
```

#### Process Payment for Order
```http
POST /orders/:orderId/process-payment
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "paymentIntentId": "pi_xxx"
}
```

#### Refund Payment
```http
POST /payments/refund
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "paymentIntentId": "pi_xxx",
  "amount": 50.00  // Optional, if not provided, full refund
}
```

## Frontend Integration

### 1. Install Stripe.js
```html
<script src="https://js.stripe.com/v3/"></script>
```

### 2. Initialize Stripe
```javascript
const stripe = Stripe('pk_test_your_publishable_key');
```

### 3. Create Payment Flow
```javascript
// 1. Create payment intent
const response = await fetch('/payments/create-payment-intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: orderTotal,
    currency: 'usd',
    orderId: orderId
  })
});

const { clientSecret } = await response.json();

// 2. Confirm payment
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: customerName
    }
  }
});

if (result.error) {
  console.error('Payment failed:', result.error);
} else {
  // 3. Process payment on backend
  await fetch(`/orders/${orderId}/process-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      paymentIntentId: result.paymentIntent.id
    })
  });
}
```

## Error Handling

The payment system includes comprehensive error handling:

- **Invalid Payment Intent**: Returns 400 with error message
- **Payment Not Completed**: Returns 400 if payment status is not 'succeeded'
- **Stripe API Errors**: Properly formatted error messages
- **Authentication Errors**: 401 for invalid tokens
- **Authorization Errors**: 403 for insufficient permissions

## Testing

### Test Card Numbers
Use these test card numbers for testing:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995
- **Expired Card**: 4000 0000 0000 0069

### Test CVC and Expiry
- **CVC**: Any 3 digits (e.g., 123)
- **Expiry**: Any future date (e.g., 12/25)

## Security Considerations

1. **Never expose secret keys** in frontend code
2. **Always verify payments** on the backend before updating order status
3. **Use HTTPS** in production
4. **Implement webhook handling** for production (not included in this basic setup)
5. **Validate payment amounts** to prevent manipulation

## Rate Limiting

The application includes rate limiting to prevent abuse:

- **Global**: 500 requests per 15 minutes per IP
- **Authentication**: 20 requests per 15 minutes per IP
- **NestJS Throttler**: 50 requests per minute

You can adjust these limits in:
- `src/common/config/security.config.ts`
- `src/app.module.ts`

## Production Deployment

1. **Use production Stripe keys** (start with `pk_live_` and `sk_live_`)
2. **Set up webhook endpoints** for payment status updates
3. **Implement proper logging** for payment events
4. **Add monitoring** for failed payments
5. **Set up automated refunds** for failed orders