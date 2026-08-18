"use client";

import { useEffect, useState } from "react";
import { serviceMessage, whatsappUrl } from "@/data/site";

export function WhatsAppFloat() {
  const [contactVisible, setContactVisible] = useState(false);

  useEffect(() => {
    const contact = document.getElementById("contacto");
    if (!contact) return;

    const observer = new IntersectionObserver(
      ([entry]) => setContactVisible(entry.isIntersecting),
      { threshold: 0.02 },
    );

    observer.observe(contact);
    return () => observer.disconnect();
  }, []);

  return (
    <a
      className={`whatsapp-float${contactVisible ? " is-hidden" : ""}`}
      href={whatsappUrl(serviceMessage("servicios de CIS Climatización"))}
      aria-label="Consultar por WhatsApp"
      aria-hidden={contactVisible}
      tabIndex={contactVisible ? -1 : undefined}
    >
      <span>WA</span>
    </a>
  );
}