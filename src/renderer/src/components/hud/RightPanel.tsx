import type React from "react";
import { PropertyInspector } from "../inspector";

export const RightPanel: React.FC = () => {
  return (
    <div className="h-full pointer-events-auto">
      <PropertyInspector />
    </div>
  );
};
