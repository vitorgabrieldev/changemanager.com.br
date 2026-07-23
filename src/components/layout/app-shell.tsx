"use client";

import { PiHouseLine, PiListChecks, PiSignOut } from "react-icons/pi";
import { Avatar, Button, Layout, Menu, Typography } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions/auth";
import type { CurrentMember } from "@/lib/data/household";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  {
    key: "/checklist",
    icon: <PiListChecks size={18} />,
    label: <Link href="/checklist">Checklist</Link>,
  },
  {
    key: "/properties",
    icon: <PiHouseLine size={18} />,
    label: <Link href="/properties">Imóveis</Link>,
  },
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({
  member,
  children,
}: {
  member: CurrentMember;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const selectedKey =
    NAV_ITEMS.find((item) => pathname.startsWith(item.key))?.key ??
    "/checklist";

  return (
    <Layout className="h-screen overflow-hidden">
      <Sider
        width={240}
        theme="light"
        breakpoint="lg"
        collapsedWidth={0}
        className="!h-screen border-r border-border"
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-sm text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #cb4b16, #b58900)" }}
          >
            A
          </div>
          <Text strong className="!text-foreground-strong truncate">
            Amber
          </Text>
        </div>

        <div className="flex h-[calc(100%-56px)] flex-col overflow-y-auto py-3">
          <Text className="px-6 pb-1.5 text-[11px] font-semibold tracking-wide text-foreground-muted uppercase">
            Menu
          </Text>
          <Menu
            mode="inline"
            items={NAV_ITEMS}
            selectedKeys={[selectedKey]}
            className="!border-none px-2"
          />
        </div>
      </Sider>

      <Layout className="h-screen overflow-hidden">
        <Header className="flex h-14 shrink-0 items-center justify-between border-b border-border !px-5">
          <div />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar size="small" style={{ backgroundColor: member.color }}>
                {initials(member.display_name)}
              </Avatar>
              <Text className="text-foreground-strong">
                {member.display_name}
              </Text>
            </div>
            <form action={signOut}>
              <Button
                type="text"
                htmlType="submit"
                icon={<PiSignOut size={16} />}
                title="Sair"
              />
            </form>
          </div>
        </Header>

        <Content className="flex-1 overflow-y-auto p-6">{children}</Content>
      </Layout>
    </Layout>
  );
}
