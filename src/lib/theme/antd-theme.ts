import type { ThemeConfig } from "antd";

export const solarized = {
  base3: "#fdf6e3",
  base2: "#eee8d5",
  base1: "#93a1a1",
  base0: "#839496",
  base00: "#657b83",
  base01: "#586e75",
  base02: "#073642",
  base03: "#002b36",
  yellow: "#b58900",
  orange: "#cb4b16",
  red: "#dc322f",
  magenta: "#d33682",
  violet: "#6c71c4",
  blue: "#268bd2",
  cyan: "#2aa198",
  green: "#859900",
};

export const antdTheme: ThemeConfig = {
  hashed: false,
  token: {
    colorPrimary: solarized.cyan,
    colorInfo: solarized.blue,
    colorSuccess: solarized.green,
    colorWarning: solarized.yellow,
    colorError: solarized.red,
    colorLink: solarized.blue,

    colorTextBase: solarized.base02,
    colorBgBase: "#ffffff",
    colorBgLayout: solarized.base3,
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorBorder: "#e4ddc7",
    colorBorderSecondary: "#ece5d0",

    fontFamily:
      "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 8,

    sizeUnit: 4,
    sizeStep: 4,
    controlHeight: 34,

    boxShadow:
      "0 1px 2px 0 rgba(7, 54, 66, 0.04), 0 1px 6px -1px rgba(7, 54, 66, 0.06)",
    boxShadowSecondary:
      "0 2px 8px 0 rgba(7, 54, 66, 0.06), 0 4px 16px -4px rgba(7, 54, 66, 0.08)",
  },
  components: {
    Layout: {
      headerBg: "#ffffff",
      bodyBg: solarized.base3,
      siderBg: "#ffffff",
      headerHeight: 56,
      headerPadding: "0 20px",
    },
    Menu: {
      itemBorderRadius: 8,
      itemMarginInline: 8,
      itemSelectedBg: "#d9f0ee",
      itemSelectedColor: "#1a726a",
      itemHoverBg: solarized.base2,
      itemHeight: 38,
    },
    Card: {
      borderRadiusLG: 14,
      paddingLG: 18,
    },
    Button: {
      controlHeight: 34,
      borderRadius: 8,
      fontWeight: 500,
    },
    Input: {
      controlHeight: 34,
      borderRadius: 8,
      activeBorderColor: solarized.cyan,
      hoverBorderColor: solarized.cyan,
    },
    Select: {
      controlHeight: 34,
      borderRadius: 8,
      optionSelectedBg: "#d9f0ee",
    },
    Table: {
      borderRadius: 10,
      headerBg: solarized.base2,
      headerColor: solarized.base01,
      rowHoverBg: "#f7f7f8",
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Progress: {
      defaultColor: solarized.cyan,
    },
    Modal: {
      borderRadiusLG: 14,
    },
    Drawer: {
      borderRadiusLG: 0,
    },
    Dropdown: {
      borderRadiusLG: 8,
    },
    Tabs: {
      itemSelectedColor: solarized.cyan,
      inkBarColor: solarized.cyan,
    },
  },
};
