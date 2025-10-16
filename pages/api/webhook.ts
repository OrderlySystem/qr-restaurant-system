// pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("🔔 Webhook recibido:", req.body);
  res.status(200).send("Webhook recibido correctamente");
}

      console.log("✅ Pago recibido:", event.data.object);
      break;
    default:
      console.log("📌 Evento recibido:", event.type);
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ received: true }));
}
