import { Tabs } from "@renderer/components/tabs";
import type { TabItem } from "@renderer/components/tabs/types";
import { useConfigStore } from "@renderer/config/config-store";
import { DEFAULT_CONFIG } from "@renderer/config/defaults";
import { useCallback, useMemo, useState } from "react";
import { ConfigEditor } from "./ConfigEditor";
import { ConfigEditorToolbar } from "./ConfigEditorToolbar";

type SettingsTab = "overrides" | "defaults" | "calculated";

export function SettingsContent() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("overrides");
  const [isDirty, setIsDirty] = useState(false);

  // Get store state - use overridesText for editor, parseError for validation
  const overridesText = useConfigStore((state) => state.overridesText);
  const parseError = useConfigStore((state) => state.parseError);
  const computed = useConfigStore((state) => state.computed);
  const setOverridesText = useConfigStore((state) => state.setOverridesText);
  const save = useConfigStore((state) => state.save);

  // Computed values for read-only tabs
  const defaultsJson = useMemo(
    () => JSON.stringify(DEFAULT_CONFIG, null, 2),
    [],
  );

  const computedJson = useMemo(
    () => JSON.stringify(computed, null, 2),
    [computed],
  );

  // Track the last saved text to detect dirty state
  const [lastSavedText, setLastSavedText] = useState(overridesText);

  // Handlers
  const handleOverridesChange = useCallback(
    (value: string) => {
      setOverridesText(value);
      setIsDirty(value !== lastSavedText);
    },
    [setOverridesText, lastSavedText],
  );

  const handleSave = useCallback(async () => {
    // Save raw text (validation happens in store)
    await save();
    setLastSavedText(overridesText);
    setIsDirty(false);
  }, [save, overridesText]);

  const handleRestore = useCallback(() => {
    // Restore to last saved text
    setOverridesText(lastSavedText);
    setIsDirty(false);
  }, [setOverridesText, lastSavedText]);

  // Build tab items with Monaco editors
  const tabs: TabItem[] = useMemo(
    () => [
      {
        id: "overrides",
        label: "Overrides",
        dirty: isDirty,
        content: (
          <div className="flex flex-col h-full">
            <ConfigEditorToolbar
              onSave={handleSave}
              onRestore={handleRestore}
              isDirty={isDirty}
              isReadOnly={false}
              parseError={parseError}
            />
            <div className="flex-1 min-h-0">
              <ConfigEditor
                value={overridesText}
                onChange={handleOverridesChange}
                onSave={handleSave}
                readOnly={false}
              />
            </div>
          </div>
        ),
      },
      {
        id: "defaults",
        label: "Defaults",
        content: (
          <div className="flex flex-col h-full">
            <ConfigEditorToolbar isReadOnly={true} />
            <div className="flex-1 min-h-0">
              <ConfigEditor value={defaultsJson} readOnly={true} />
            </div>
          </div>
        ),
      },
      {
        id: "calculated",
        label: "Calculated",
        content: (
          <div className="flex flex-col h-full">
            <ConfigEditorToolbar isReadOnly={true} />
            <div className="flex-1 min-h-0">
              <ConfigEditor value={computedJson} readOnly={true} />
            </div>
          </div>
        ),
      },
    ],
    [
      overridesText,
      defaultsJson,
      computedJson,
      isDirty,
      parseError,
      handleOverridesChange,
      handleSave,
      handleRestore,
    ],
  );

  return (
    <Tabs
      tabs={tabs}
      activeTabId={activeTab}
      onTabChange={(id) => setActiveTab(id as SettingsTab)}
      variant="secondary"
      keepMounted={true}
    />
  );
}
