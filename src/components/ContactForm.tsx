"use client";
import { FormEvent, useState } from "react";
import { academy } from "@/data/academy";
import { serviceMessage, site, whatsappUrl } from "@/data/site";

export function ContactForm() {
  const [status, setStatus] = useState("");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      setStatus("Revisá los campos obligatorios marcados.");
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const interest = String(data.get("service"));
    const opening = interest === academy.name
      ? academy.featuredProduct.launchMessage
      : serviceMessage(interest);
    const message = `${opening}\n\nNombre: ${data.get("name")}\nTeléfono: ${data.get("phone")}\nTipo de cliente: ${data.get("client")}\nLocalidad: ${data.get("location")}\nMensaje: ${data.get("message")}`;
    setStatus("Abriendo WhatsApp con tu consulta preparada...");
    window.location.assign(whatsappUrl(message));
  }

  return <form className="contact-form" onSubmit={submit} noValidate><p className="form-explainer">Este formulario no envía datos a un servidor. Prepara tu consulta y la abre en WhatsApp para que puedas revisarla antes de enviarla.</p><div className="form-grid">
    <label>Nombre *<input name="name" required autoComplete="name" /></label><label>Teléfono *<input name="phone" required inputMode="tel" autoComplete="tel" /></label>
    <label>Tipo de cliente *<select name="client" required defaultValue=""><option value="" disabled>Seleccionar</option><option>Particular</option><option>Comercio</option><option>Empresa</option><option>Técnico</option></select></label>
    <label>Servicio requerido *<select name="service" required defaultValue=""><option value="" disabled>Seleccionar</option>{site.services.map(s => <option key={s.title}>{s.title}</option>)}<option>{academy.name}</option></select></label>
    <label className="full">Localidad *<input name="location" required autoComplete="address-level2" /></label><label className="full">Mensaje *<textarea name="message" required rows={4}/></label>
  </div><button className="button" type="submit">Preparar consulta por WhatsApp</button><p className="form-status" role="status" aria-live="polite">{status}</p></form>;
}
