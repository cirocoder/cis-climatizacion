"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { serviceMessage, site, whatsappUrl } from "@/data/site";
import { Icon } from "./icons";
const links = [["Inicio", "#inicio"], ["Servicios", "#servicios"], ["Trabajos", "#trabajos"], ["CIS Academia", "#capacitaciones"], ["Nosotros", "#nosotros"], ["Preguntas frecuentes", "#preguntas"], ["Contacto", "#contacto"]];
export function Header() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);
  return <header className="site-header"><div className="nav-shell">
    <a className="brand" href="#inicio" aria-label={`${site.brand.name}, inicio`}><Image src={site.brand.logo} alt="" width={56} height={56} sizes="56px" priority/><span><b>CIS</b><small>Climatización</small></span></a>
    <button className="menu-button" type="button" aria-expanded={open} aria-controls="main-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"}/></button>
    <nav id="main-menu" className={open ? "nav-links open" : "nav-links"} aria-label="Navegación principal">{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}<a className="button button-small" href={whatsappUrl(serviceMessage("servicios de CIS Climatización"))}>Solicitar presupuesto</a></nav>
  </div></header>;
}
