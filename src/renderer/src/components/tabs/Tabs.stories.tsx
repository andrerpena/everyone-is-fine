import type { Meta, StoryObj } from "@storybook/react";
import { Code, FileText, Search, Settings, Terminal } from "lucide-react";
import { Tabs } from "./Tabs";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] h-[300px] bg-background border border-border rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof Tabs>;

const TabContent = ({ title }: { title: string }) => (
  <div className="p-4 h-full">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    <p className="text-muted-foreground mt-2">Content for {title}</p>
  </div>
);

export const PrimaryVariant: Story = {
  args: {
    tabs: [
      {
        id: "file1",
        label: "index.tsx",
        icon: Code,
        closable: true,
        content: <TabContent title="index.tsx" />,
      },
      {
        id: "file2",
        label: "styles.css",
        icon: FileText,
        closable: true,
        dirty: true,
        content: <TabContent title="styles.css (unsaved)" />,
      },
      {
        id: "file3",
        label: "README.md",
        icon: FileText,
        closable: true,
        content: <TabContent title="README.md" />,
      },
    ],
    variant: "primary",
    defaultActiveTabId: "file1",
  },
};

export const SecondaryVariant: Story = {
  args: {
    tabs: [
      {
        id: "explorer",
        label: "Explorer",
        icon: Search,
        content: <TabContent title="Explorer Panel" />,
      },
      {
        id: "terminal",
        label: "Terminal",
        icon: Terminal,
        content: <TabContent title="Terminal Panel" />,
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        content: <TabContent title="Settings Panel" />,
      },
    ],
    variant: "secondary",
    defaultActiveTabId: "explorer",
  },
};

export const WithDirtyIndicator: Story = {
  args: {
    tabs: [
      {
        id: "file1",
        label: "modified.ts",
        icon: Code,
        closable: true,
        dirty: true,
        content: <TabContent title="Modified file" />,
      },
      {
        id: "file2",
        label: "saved.ts",
        icon: Code,
        closable: true,
        dirty: false,
        content: <TabContent title="Saved file" />,
      },
    ],
    variant: "primary",
    defaultActiveTabId: "file1",
  },
};

export const ManyTabs: Story = {
  args: {
    tabs: Array.from({ length: 10 }, (_, i) => ({
      id: `file${i}`,
      label: `file${i}.tsx`,
      icon: Code,
      closable: true,
      content: <TabContent title={`file${i}.tsx`} />,
    })),
    variant: "primary",
    defaultActiveTabId: "file0",
  },
};

export const NonClosableTabs: Story = {
  args: {
    tabs: [
      {
        id: "main",
        label: "Main",
        content: <TabContent title="Main (cannot close)" />,
      },
      {
        id: "help",
        label: "Help",
        content: <TabContent title="Help (cannot close)" />,
      },
    ],
    variant: "secondary",
    defaultActiveTabId: "main",
  },
};

export const SingleTab: Story = {
  args: {
    tabs: [
      {
        id: "only",
        label: "Only Tab",
        icon: FileText,
        content: <TabContent title="Only Tab" />,
      },
    ],
    variant: "primary",
    defaultActiveTabId: "only",
  },
};

export const EmptyState: Story = {
  args: {
    tabs: [],
    variant: "primary",
  },
};
