import { Dock } from "@renderer/components/dock/Dock";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Components/Dock",
  component: Dock,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Dock>;

export default meta;

type Story = StoryObj<typeof Dock>;

const PanelContent = ({ title }: { title: string }) => (
  <div className="p-4 h-full flex items-center justify-center text-foreground">
    <h2 className="text-lg font-semibold">{title}</h2>
  </div>
);

export const Default: Story = {
  args: {
    center: <PanelContent title="Center Panel" />,
    leftTop: <PanelContent title="Left Top Panel" />,
    leftBottom: <PanelContent title="Left Bottom Panel" />,
    rightTop: <PanelContent title="Right Top Panel" />,
    rightBottom: <PanelContent title="Right Bottom Panel" />,
    centerBottom: <PanelContent title="Center Bottom Panel" />,
  },
};

export const OnlyLeftPanels: Story = {
  args: {
    center: <PanelContent title="Center Panel" />,
    leftTop: <PanelContent title="Left Top Panel" />,
    leftBottom: <PanelContent title="Left Bottom Panel" />,
  },
};

export const OnlyRightPanels: Story = {
  args: {
    center: <PanelContent title="Center Panel" />,
    rightTop: <PanelContent title="Right Top Panel" />,
    rightBottom: <PanelContent title="Right Bottom Panel" />,
  },
};

export const CenterWithBottom: Story = {
  args: {
    center: <PanelContent title="Center Panel" />,
    centerBottom: <PanelContent title="Center Bottom Panel" />,
  },
};

export const SimpleThreeColumn: Story = {
  args: {
    center: <PanelContent title="Center Panel" />,
    leftTop: <PanelContent title="Left Panel" />,
    rightTop: <PanelContent title="Right Panel" />,
  },
};

export const ComplexLayout: Story = {
  args: {
    center: (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Main Content Area</h2>
        <p className="text-muted-foreground">
          This is the main content area. It can contain any React component.
        </p>
        <div className="mt-4 p-4 bg-muted rounded">
          <p>Nested content example</p>
        </div>
      </div>
    ),
    leftTop: (
      <div className="p-4">
        <h3 className="font-semibold mb-2">Navigation</h3>
        <ul className="space-y-2">
          <li className="p-2 hover:bg-accent rounded cursor-pointer">Item 1</li>
          <li className="p-2 hover:bg-accent rounded cursor-pointer">Item 2</li>
          <li className="p-2 hover:bg-accent rounded cursor-pointer">Item 3</li>
        </ul>
      </div>
    ),
    leftBottom: (
      <div className="p-4">
        <h3 className="font-semibold mb-2">Tools</h3>
        <div className="space-y-2">
          <button
            type="button"
            className="w-full p-2 bg-primary text-primary-foreground rounded"
          >
            Tool 1
          </button>
          <button
            type="button"
            className="w-full p-2 bg-secondary text-secondary-foreground rounded"
          >
            Tool 2
          </button>
        </div>
      </div>
    ),
    rightTop: (
      <div className="p-4">
        <h3 className="font-semibold mb-2">Properties</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Width:</span>
            <span className="text-muted-foreground">100%</span>
          </div>
          <div className="flex justify-between">
            <span>Height:</span>
            <span className="text-muted-foreground">Auto</span>
          </div>
        </div>
      </div>
    ),
    rightBottom: (
      <div className="p-4">
        <h3 className="font-semibold mb-2">Console</h3>
        <div className="font-mono text-xs space-y-1">
          <div className="text-green-500">✓ Component loaded</div>
          <div className="text-yellow-500">⚠ Warning: Demo mode</div>
          <div className="text-muted-foreground">Ready...</div>
        </div>
      </div>
    ),
    centerBottom: (
      <div className="p-4">
        <h3 className="font-semibold mb-2">Terminal</h3>
        <div className="font-mono text-sm bg-surface-0 text-green-400 p-2 rounded">
          <div>$ npm run dev</div>
          <div>Server running on http://localhost:3000</div>
        </div>
      </div>
    ),
  },
};

export const NestedDock: Story = {
  args: {
    center: (
      <Dock
        center={<PanelContent title="Nested Center" />}
        leftTop={<PanelContent title="Nested Left" />}
        rightTop={<PanelContent title="Nested Right" />}
      />
    ),
    leftTop: <PanelContent title="Outer Left Panel" />,
    rightTop: <PanelContent title="Outer Right Panel" />,
  },
};
