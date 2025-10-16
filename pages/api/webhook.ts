// 🚫 No usamos NextApiRequest porque no sirve con raw body
import { buffer } from "micro";
import type { IncomingMessage, ServerResponse } from "http";
import Stripe from "stripe";

// 🧩 Obligatorio desactivar el bodyParser para poder usar `micro`
export const config = {
  api: {
    bodyParser: false,
  },
};

// 🔑 Creamos la instancia de Stripe con tu clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// 🔒 Aquí metes la clave secreta del webhook (la de Vercel, ya la tienes bien)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// 🚀 Esta es la función que escucha los eventos desde Stripe
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  // 1️⃣ Cogemos el contenido sin procesar del body
  const buf = await buffer(req);

  // 2️⃣ Leemos la cabecera especial que Stripe manda para verificar que es real
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // 3️⃣ Aquí Stripe verifica que el contenido es auténtico y no falso
    event = stripe.webhooks.constructEvent(buf, sig!, endpointSecret);
  } catch (err) {
    console.error("❌ Error verificando webhook:", err);
    res.statusCode = 400;
    res.end(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  // 4️⃣ Aquí decides qué hacer con el evento. Puedes hacer lo que quieras.
  switch (event.type) {
    case "checkout.session.completed":
      console.log("✅ Pago recibido:", event.data.object);
      break;
    default:
      console.log("📌 Evento recibido:", event.type);
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ received: true }));
}
