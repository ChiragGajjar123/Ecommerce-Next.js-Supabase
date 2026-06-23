import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    // Verify signature using the webhook secret
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    
    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
      }
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    // Handle payment capture events
    if (event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      const supabase = createClient();
      
      // Update order status in database if order matches
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'paid', 
          razorpay_payment_id: paymentId,
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_order_id', orderId);

      if (error) {
        console.error('Webhook database update error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
