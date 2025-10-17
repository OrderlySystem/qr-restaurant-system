// pages/api/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro'; // Necesitarás instalar esto: npm install micro
import Stripe from 'stripe';

// Asumiendo que tienes estas variables de entorno en Vercel
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10', // Usa una versión de API explícita
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ¡MUY IMPORTANTE! Deshabilita el bodyParser para que Stripe pueda verificar la firma
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo aceptamos peticiones POST de Stripe
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req); // Obtenemos el "raw body"
  const sig = req.headers['stripe-signature']; // Obtenemos la firma

  let event: Stripe.Event;

  // 1. VERIFICAR LA FIRMA DE STRIPE
  try {
    if (!sig || !webhookSecret) {
      console.error('Webhook secret or signature missing');
      return res.status(400).send('Webhook secret or signature missing');
    }
    
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error al verificar el webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Evento recibido: ${event.type}`);

  // 2. PROCESAR EL EVENTO (Aquí va tu lógica)
  // Esta es la parte que tenías rota
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`✅ Pago recibido para la sesión: ${session.id}`);
      
      // TODO: Aquí es donde llamas a tu lógica de Manus
      // Ejemplo: await activarAfiliacionManus(session.client_reference_id);
      
      // TODO: Aquí actualizas tu base de datos en Supabase
      // Ejemplo: await supabase.from('pedidos').update({ pagado: true }).eq('checkout_session_id', session.id);
      
      break;
    
    // Puedes añadir más eventos si los necesitas
    // case 'payment_intent.succeeded':
    //   const paymentIntent = event.data.object;
    //   console.log('PaymentIntent fue exitoso!');
    //   break;

    default:
      console.warn(`✴️ Evento no manejado: ${event.type}`);
  }

  // 3. RESPONDER A STRIPE
  // Envía una respuesta 200 para avisar a Stripe que recibiste el evento
  res.status(200).json({ received: true });
}
