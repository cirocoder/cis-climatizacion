import Link from "next/link";
import { Icon } from "@/components/icons";
import { CheckoutButton } from "@/components/academy/CheckoutButton";

type PurchaseState = "upcoming" | "login" | "buy" | "owned";

export function KitPurchaseCta({ state, launchUrl }: { state: PurchaseState; launchUrl: string }) {
  if (state === "owned") return <Link className="academy-button academy-button-primary" href="/academia/mi-academia/productos/kit-cis-5p">Abrir producto <Icon name="arrow"/></Link>;
  if (state === "login") return <Link className="academy-button academy-button-primary" href="/ingresar?callbackUrl=%2Facademia%2Fkit-5p">Ingresar para comprar <Icon name="arrow"/></Link>;
  if (state === "buy") return <CheckoutButton slug="kit-cis-5p"/>;
  return <a className="academy-button academy-button-primary" href={launchUrl}>Quiero enterarme del lanzamiento <Icon name="arrow"/></a>;
}
