import { Activity } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { usePerformanceStore } from "../../../lib/performance-store";
import type { ChartConfig } from "../../charts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../charts";
import type { WidgetComponentProps, WidgetDefinition } from "../types";

const chartConfig = {
  fps: {
    label: "FPS",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function PerformanceWidget(_props: WidgetComponentProps) {
  const fpsHistory = usePerformanceStore((state) => state.fpsHistory);

  // Debug: log data length and first/last values to verify circular buffer
  console.info(
    "[PerformanceWidget] length:",
    fpsHistory.length,
    "first:",
    fpsHistory[0]?.fps,
    "last:",
    fpsHistory[fpsHistory.length - 1]?.fps,
  );

  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="text-sm font-medium mb-2">FPS Over Time</h3>
      <div className="flex-1 min-h-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart
            data={fpsHistory}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="index"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={() => ""}
            />
            <YAxis
              domain={[0, 165]}
              ticks={[0, 30, 60, 90, 120, 150]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={30}
            />
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={{ stroke: "var(--border)" }}
            />
            <Line
              type="monotone"
              dataKey="fps"
              stroke="var(--color-fps)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}

export const performanceWidget: WidgetDefinition = {
  id: "performance",
  label: "Performance",
  icon: Activity,
  component: PerformanceWidget,
};
