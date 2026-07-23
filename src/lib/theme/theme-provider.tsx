"use client";

import { App, ConfigProvider, Spin } from "antd";
import ptBR from "antd/locale/pt_BR";
import type { ReactNode } from "react";
import { Loader } from "@/components/ui/loader";
import { antdTheme } from "./antd-theme";

Spin.setDefaultIndicator(<Loader variant="spin" size={20} />);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={antdTheme} locale={ptBR}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
