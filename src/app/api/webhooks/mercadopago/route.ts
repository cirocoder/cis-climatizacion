import { NextResponse } from "next/server";
import { z } from "zod";
import { getMercadoPagoEnvironment } from "@/lib/env/server";
import { createMercadoPagoGateway, validateMercadoPagoSignature } from "@/lib/payments/mercadopago";
import { processPaymentNotification } from "@/services/purchases";

const webhookSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  type: z.string(),
  action: z.string().optional(),
  live_mode: z.boolean().optional(),
  data: z.object({ id: z.union([z.string(), z.number()]).transform(String) }),
});

export async function POST(request: Request) {
  let environment;
  try {
    environment = getMercadoPagoEnvironment();
  } catch {
    return NextResponse.json({ error: "Integración no configurada." }, { status: 503 });
  }

  const dataId = new URL(request.url).searchParams.get("data.id");
  if (!validateMercadoPagoSignature({
    signature: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
    secret: environment.MERCADOPAGO_WEBHOOK_SECRET,
  })) return NextResponse.json({ error: "Firma inválida." }, { status: 401 });

  const parsed = webhookSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.type !== "payment" || parsed.data.data.id !== dataId) {
    return NextResponse.json({ error: "Notificación inválida." }, { status: 400 });
  }

  try {
    await processPaymentNotification({
      gateway: createMercadoPagoGateway(environment),
      expectedCollectorId: environment.MERCADOPAGO_COLLECTOR_ID,
      event: {
        providerEventId: parsed.data.id,
        eventType: parsed.data.action ?? parsed.data.type,
        providerResourceId: parsed.data.data.id,
        payload: {
          type: parsed.data.type,
          action: parsed.data.action ?? null,
          liveMode: parsed.data.live_mode ?? null,
        },
      },
    });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la notificación." }, { status: 503 });
  }
}
