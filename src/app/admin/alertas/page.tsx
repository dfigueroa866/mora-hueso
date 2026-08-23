import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminAlertsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");
  redirect("/admin?vista=alertas");
}
