export const prerender = false;
import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export const POST: APIRoute = async ({ request }) => {
  const { title, price, slug } = await request.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: title,
          },
          unit_amount: Math.round(price * 100), // Stripe uses cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}&slug=${slug}`,
    cancel_url: `${request.headers.get('origin')}/photo/${slug}`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};