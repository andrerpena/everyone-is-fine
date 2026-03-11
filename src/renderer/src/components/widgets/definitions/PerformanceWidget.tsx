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
  const fps = usePerformanceStore((state) => state.fps);
  const tps = usePerformanceStore((state) => state.tps);
  const entityCount = usePerformanceStore((state) => state.entityCount);
  const systemTimings = usePerformanceStore((state) => state.systemTimings);

  const timingEntries = Object.entries(systemTimings);

  return (
    <div className="p-4 h-full flex flex-col gap-3 overflow-auto">
      {/* Summary row */}
      <div className="flex gap-4 text-xs font-mono">
        <span>
          FPS: <strong>{fps}</strong>
        </span>
        <span>
          TPS: <strong>{tps}</strong>
        </span>
        <span>
          Entities: <strong>{entityCount}</strong>
        </span>
      </div>

      {/* FPS chart */}
      <div>
        <h3 className="text-sm font-medium mb-2">FPS Over Time</h3>
        <div className="h-40">
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

      {/* Per-system timing breakdown */}
      {timingEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">System Timings (ms/tick)</h3>
          <div className="flex flex-col gap-1 text-xs font-mono">
            {timingEntries.map(([name, ms]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-32 truncate text-muted-foreground">
                  {name}
                </span>
                <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary rounded"
                    style={{
                      width: `${Math.min(100, ms * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-16 text-right">{ms.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const performanceWidget: WidgetDefinition = {
  id: "performance",
  label: "Performance",
  icon: Activity,
  component: PerformanceWidget,
};
