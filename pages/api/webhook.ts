import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"]!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } catch (err) {
      console.error("Error verificando webhook:", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Aquí decides qué hacer según el tipo de evento
    switch (event.type) {
      case "checkout.session.completed":
        console.log("✅ Pago recibido:", event.data.object);
        break;
      default:
        console.log("Evento recibido:", event.type);
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
add webhook handler
