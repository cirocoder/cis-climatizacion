import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Crear una cuenta en CIS Academia", robots: { index: false, follow: false } };
export default function RegisterPage() { return <AuthForm mode="register"/>; }
