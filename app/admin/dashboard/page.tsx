import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (token !== process.env.ADMIN_TOKEN_SECRET) redirect("/admin");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

  const [dV, mV, yV, tV, dS, mS, yS, tS, topRaw] = await Promise.all([
    supabase.from("page_visits").select("*", { count: "exact", head: true }).gte("visited_at", todayStart),
    supabase.from("page_visits").select("*", { count: "exact", head: true }).gte("visited_at", monthStart),
    supabase.from("page_visits").select("*", { count: "exact", head: true }).gte("visited_at", yearStart),
    supabase.from("page_visits").select("*", { count: "exact", head: true }),
    supabase.from("searches").select("*", { count: "exact", head: true }).gte("searched_at", todayStart),
    supabase.from("searches").select("*", { count: "exact", head: true }).gte("searched_at", monthStart),
    supabase.from("searches").select("*", { count: "exact", head: true }).gte("searched_at", yearStart),
    supabase.from("searches").select("*", { count: "exact", head: true }),
    supabase.from("searches").select("query").gte("searched_at", monthStart),
  ]);

  const qMap: Record<string, number> = {};
  (topRaw.data || []).forEach(({ query }: { query: string }) => {
    qMap[query] = (qMap[query] || 0) + 1;
  });
  const topQueries = Object.entries(qMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  const data = {
    visits: { daily: dV.count ?? 0, monthly: mV.count ?? 0, yearly: yV.count ?? 0, total: tV.count ?? 0 },
    searches: { daily: dS.count ?? 0, monthly: mS.count ?? 0, yearly: yS.count ?? 0, total: tS.count ?? 0 },
    topQueries,
  };

  return <AdminDashboardClient data={data} />;
}
