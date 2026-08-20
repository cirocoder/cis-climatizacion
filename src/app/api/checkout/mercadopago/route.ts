import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/dal/auth";
import { getMercadoPagoEnvironment } from "@/lib/env/server";
import { createMercadoPagoGateway } from "@/lib/payments/mercadopago";
import { createCheckout, PurchaseError } from "@/services/purchases";

const checkoutSchema = z.object({ slug: z.string().trim().min(1).max(100) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  try {
    const environment = getMercadoPagoEnvironment();
    const requestOrigin = request.headers.get("origin");
    if (!requestOrigin || requestOrigin !== new URL(environment.APP_URL).origin) {
      return NextResponse.json({ error: "Origen de solicitud inválido." }, { status: 403 });
    }
    const result = await createCheckout({
      userId: user.id,
      slug: parsed.data.slug,
      appUrl: environment.APP_URL,
      gateway: createMercadoPagoGateway(environment),
    });
    return NextResponse.json({ checkoutUrl: result.checkoutUrl });
  } catch (error) {
    if (error instanceof PurchaseError) {
      const status = error.code === "NOT_FOUND" ? 404
        : error.code === "RATE_LIMITED" ? 429
          : ["ALREADY_OWNED", "IN_PROGRESS"].includes(error.code) ? 409
            : error.code === "PROVIDER_ERROR" ? 502 : 422;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 500 });
  }
}
