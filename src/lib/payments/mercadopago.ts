import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getMercadoPagoEnvironment, type MercadoPagoEnvironment } from "@/lib/env/server";

const API_URL = "https://api.mercadopago.com";

export type MercadoPagoPayment = {
  id: string;
  status: string;
  externalReference: string | null;
  transactionAmount: string;
  currency: string;
  collectorId: string | null;
  dateApproved: Date | null;
  amountRefunded: string;
};

export type PreferenceInput = {
  purchaseId: string;
  title: string;
  unitPrice: string;
  currency: string;
  externalReference: string;
  notificationUrl: string;
  successUrl: string;
  pendingUrl: string;
  failureUrl: string;
};

export type PreferenceResult = {
  id: string;
  checkoutUrl: string;
};

export interface MercadoPagoGateway {
  createPreference(input: PreferenceInput): Promise<PreferenceResult>;
  getPayment(paymentId: string): Promise<MercadoPagoPayment>;
}

type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
};

type MercadoPagoPaymentResponse = {
  id?: number | string;
  status?: string;
  external_reference?: string | null;
  transaction_amount?: number | string;
  currency_id?: string;
  collector_id?: number | string;
  date_approved?: string | null;
  transaction_amount_refunded?: number | string;
};

async function mercadoPagoRequest<T>(path: string, init: RequestInit, environment: MercadoPagoEnvironment): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${environment.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago respondió ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function createMercadoPagoGateway(environment = getMercadoPagoEnvironment()): MercadoPagoGateway {
  return {
    async createPreference(input) {
      const response = await mercadoPagoRequest<MercadoPagoPreferenceResponse>("/checkout/preferences", {
        method: "POST",
        headers: { "X-Idempotency-Key": input.purchaseId },
        body: JSON.stringify({
          items: [{
            id: input.purchaseId,
            title: input.title,
            quantity: 1,
            unit_price: Number(input.unitPrice),
            currency_id: input.currency,
          }],
          external_reference: input.externalReference,
          notification_url: input.notificationUrl,
          back_urls: {
            success: input.successUrl,
            pending: input.pendingUrl,
            failure: input.failureUrl,
          },
          auto_return: "approved",
        }),
      }, environment);

      const checkoutUrl = environment.MERCADOPAGO_ENVIRONMENT === "TEST"
        ? response.sandbox_init_point ?? response.init_point
        : response.init_point;
      if (!response.id || !checkoutUrl) throw new Error("Mercado Pago no devolvió una preferencia utilizable");
      return { id: response.id, checkoutUrl };
    },

    async getPayment(paymentId) {
      const response = await mercadoPagoRequest<MercadoPagoPaymentResponse>(
        `/v1/payments/${encodeURIComponent(paymentId)}`,
        { method: "GET" },
        environment,
      );
      if (response.id === undefined || !response.status || response.transaction_amount === undefined || !response.currency_id) {
        throw new Error("La respuesta del pago está incompleta");
      }
      return {
        id: String(response.id),
        status: response.status,
        externalReference: response.external_reference ?? null,
        transactionAmount: String(response.transaction_amount),
        currency: response.currency_id,
        collectorId: response.collector_id === undefined ? null : String(response.collector_id),
        dateApproved: response.date_approved ? new Date(response.date_approved) : null,
        amountRefunded: String(response.transaction_amount_refunded ?? 0),
      };
    },
  };
}

function signatureParts(value: string) {
  return Object.fromEntries(value.split(",").map(part => part.trim().split("=", 2))) as Record<string, string>;
}

export function validateMercadoPagoSignature(input: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string;
}) {
  if (!input.signature || !input.requestId || !input.dataId || !input.secret) return false;
  const { ts, v1 } = signatureParts(input.signature);
  if (!ts || !v1 || !/^[a-f\d]{64}$/i.test(v1)) return false;
  const manifest = `id:${input.dataId.toLowerCase()};request-id:${input.requestId};ts:${ts};`;
  const expected = createHmac("sha256", input.secret).update(manifest).digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
}

export function assertPublicApplicationUrl(value: string) {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    throw new Error("APP_URL debe ser una URL HTTPS pública para iniciar Checkout Pro");
  }
  return url.origin;
}
