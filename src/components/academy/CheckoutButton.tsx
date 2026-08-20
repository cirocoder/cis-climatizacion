"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

export function CheckoutButton({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function startCheckout() {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch("/api/checkout/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const payload = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error ?? "No se pudo iniciar el pago.");
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "No se pudo iniciar el pago.");
    }
  }

  return <div className="checkout-action">
    <button className="academy-button academy-button-primary" type="button" onClick={startCheckout} disabled={state === "loading"}>
      {state === "loading" ? "Preparando pago…" : "Comprar Kit CIS 5P"} <Icon name="arrow"/>
    </button>
    <p className="checkout-message" role="status" aria-live="polite">{state === "error" ? message : ""}</p>
  </div>;
}
