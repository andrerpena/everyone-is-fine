import { useMemo } from "react";
import {
  type ActiveAlert,
  type AlertSeverity,
  evaluateAlerts,
} from "../../alerts/alert-definitions";
import { useCharactersArray, useGameStore } from "../../game-state";
import { ALL_EVENTS } from "../../simulation";

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  critical: "bg-red-900/80 border-red-600 text-red-200",
  warning: "bg-yellow-900/80 border-yellow-600 text-yellow-200",
  info: "bg-neutral-800/80 border-neutral-600 text-neutral-300",
};

const SEVERITY_ICONS: Record<AlertSeverity, string> = {
  critical: "!!",
  warning: "!",
  info: "i",
};

function AlertItem({ alert }: { alert: ActiveAlert }) {
  return (
    <div
      className={`px-2 py-1.5 rounded border text-xs ${SEVERITY_STYLES[alert.severity]}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-[10px] opacity-70">
          {SEVERITY_ICONS[alert.severity]}
        </span>
        <span className="font-medium">{alert.label}</span>
      </div>
      <div className="text-[10px] opacity-70 mt-0.5 ml-4">{alert.detail}</div>
    </div>
  );
}

function ActiveEventBanner({ eventId }: { eventId: string }) {
  const event = ALL_EVENTS.find((e) => e.id === eventId);
  if (!event) return null;

  return (
    <div className="px-2 py-1.5 rounded border text-xs bg-indigo-900/80 border-indigo-500 text-indigo-200">
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-[10px] opacity-70 animate-pulse">
          *
        </span>
        <span className="font-medium">{event.label}</span>
      </div>
      <div className="text-[10px] opacity-70 mt-0.5 ml-4">
        {event.description}
      </div>
    </div>
  );
}

export function AlertOverlay() {
  const characters = useCharactersArray();
  const activeEvents = useGameStore((s) => s.simulation.activeEvents);

  const alerts = useMemo(() => evaluateAlerts(characters), [characters]);

  const activeEventIds = useMemo(() => [...activeEvents], [activeEvents]);

  if (alerts.length === 0 && activeEventIds.length === 0) return null;

  return (
    <div className="fixed top-12 right-2 z-40 flex flex-col gap-1 max-w-56 pointer-events-auto">
      {activeEventIds.map((id) => (
        <ActiveEventBanner key={id} eventId={id} />
      ))}
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
