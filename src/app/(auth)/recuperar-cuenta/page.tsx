import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Recuperar cuenta de CIS Academia", robots: { index: false, follow: false } };
export default function RecoveryPage() { return <AuthForm mode="recovery"/>; }
