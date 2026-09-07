import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Header } from "@/components/app/Header";
import { SessionWatcher } from "@/components/app/SessionWatcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div data-theme="dark">
      <Header user={user} />
      <SessionWatcher user={user}>{children}</SessionWatcher>
    </div>
  );
}
