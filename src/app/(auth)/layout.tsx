import { AcademyFooter, AcademyHeader } from "@/components/AcademyShell";
import "../academia/academy.css";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="academy-site auth-site"><AcademyHeader/><main id="contenido" className="auth-main"><div className="academy-container">{children}</div></main><AcademyFooter/></div>;
}
