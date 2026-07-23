import { AppShell } from "@/components/layout/app-shell";
import { NoAccess } from "@/components/layout/no-access";
import { getCurrentMember } from "@/lib/data/household";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();

  if (!member) {
    return <NoAccess />;
  }

  return <AppShell member={member}>{children}</AppShell>;
}
