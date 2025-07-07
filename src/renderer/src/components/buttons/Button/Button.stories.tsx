import type { Meta, StoryObj } from "@storybook/react";
import { Mail, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "ghost",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "xs", "lg", "icon"],
    },
    disabled: { control: "boolean" },
    isLoading: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: { children: "Button" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Delete" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ghost" },
};

export const Link: Story = {
  args: { variant: "link", children: "Link" },
};

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

export const SizeLarge: Story = {
  args: { size: "lg", children: "Large" },
};

export const SizeDefault: Story = {
  args: { size: "default", children: "Default" },
};

export const SizeSmall: Story = {
  args: { size: "sm", children: "Small" },
};

export const SizeExtraSmall: Story = {
  args: { size: "xs", children: "Extra Small" },
};

export const SizeIcon: Story = {
  args: { size: "icon", children: <Plus /> },
};

// ---------------------------------------------------------------------------
// With Icons
// ---------------------------------------------------------------------------

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Mail /> Login with Email
      </>
    ),
  },
};

export const IconSmall: Story = {
  args: {
    size: "sm",
    children: (
      <>
        <Save /> Save
      </>
    ),
  },
};

export const IconExtraSmall: Story = {
  args: {
    size: "xs",
    variant: "secondary",
    children: (
      <>
        <RotateCcw /> Restore
      </>
    ),
  },
};

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  args: { disabled: true, children: "Disabled" },
};

export const Loading: Story = {
  args: { isLoading: true, children: "Saving..." },
};

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex items-center gap-3">
        <Button size="lg">Large</Button>
        <Button size="default">Default</Button>
        <Button size="sm">Small</Button>
        <Button size="xs">Extra Small</Button>
        <Button size="icon">
          <Plus />
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button>
          <Mail /> With Icon
        </Button>
        <Button variant="destructive">
          <Trash2 /> Delete
        </Button>
        <Button variant="outline">
          <Save /> Save
        </Button>
        <Button variant="ghost">
          <RotateCcw /> Refresh
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button disabled>Disabled</Button>
        <Button isLoading>Loading</Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
        <Button variant="outline" disabled>
          Disabled
        </Button>
      </div>
    </div>
  ),
};
