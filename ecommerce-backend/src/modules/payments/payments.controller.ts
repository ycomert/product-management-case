import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-intent')
  @ApiOperation({ summary: 'Create a payment intent for Stripe' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createPaymentIntent(
    @Body() body: { amount: number; currency?: string; orderId?: string },
    @Request() req: any,
  ) {
    const metadata = {
      userId: req.user.id,
      orderId: body.orderId,
    };

    const paymentIntent = await this.paymentsService.createPaymentIntent(
      body.amount,
      body.currency || 'usd',
      metadata,
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert back from cents
      currency: paymentIntent.currency,
    };
  }

  @Get('payment-status/:paymentIntentId')
  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    const paymentIntent = await this.paymentsService.getPaymentStatus(paymentIntentId);
    
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
    };
  }

  @Post('refund')
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiResponse({ status: 201, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async refundPayment(
    @Body() body: { paymentIntentId: string; amount?: number },
  ) {
    const refund = await this.paymentsService.refundPayment(
      body.paymentIntentId,
      body.amount,
    );

    return {
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    };
  }
}