import { initializeMonaco } from "@renderer/components/monaco-editor";
import type * as monaco from "monaco-editor";
import { useEffect, useRef } from "react";

interface ConfigEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

export function ConfigEditor({
  value,
  onChange,
  onSave,
  readOnly = false,
}: ConfigEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const isUpdatingRef = useRef(false);
  // Store the latest value to apply when Monaco finishes initializing
  const latestValueRef = useRef(value);
  const initialReadOnlyRef = useRef(readOnly);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);

  // Keep refs up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  // Initialize Monaco editor (only once on mount)
  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    // Initialize Monaco loader
    initializeMonaco().then((monacoInstance) => {
      if (disposed || !containerRef.current || editorRef.current) return;

      // Use the latest value (might have changed while Monaco was loading)
      const editor = monacoInstance.editor.create(containerRef.current, {
        value: latestValueRef.current,
        language: "json",
        theme: "vs-dark",
        readOnly: initialReadOnlyRef.current,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        minimap: { enabled: false },
        fontSize: 13,
        tabSize: 2,
        formatOnPaste: true,
        formatOnType: true,
        lineNumbers: "on",
        folding: true,
        wordWrap: "on",
        fixedOverflowWidgets: true, // Allow tooltips to overflow editor boundaries
      });

      editorRef.current = editor;

      // Listen for content changes
      editor.onDidChangeModelContent(() => {
        if (isUpdatingRef.current) return;
        onChangeRef.current?.(editor.getValue());
      });

      // Add Ctrl/Cmd+S keybinding for save
      editor.addAction({
        id: "save-config",
        label: "Save Config",
        keybindings: [
          monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
        ],
        run: () => {
          onSaveRef.current?.();
        },
      });
    });

    return () => {
      disposed = true;
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  // Update value when prop changes (for external updates)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentValue = editor.getValue();
    if (currentValue !== value) {
      isUpdatingRef.current = true;
      editor.setValue(value);
      isUpdatingRef.current = false;
    }
  }, [value]);

  // Update readOnly when prop changes
  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly });
  }, [readOnly]);

  return <div ref={containerRef} className="w-full h-full overflow-hidden" />;
}
