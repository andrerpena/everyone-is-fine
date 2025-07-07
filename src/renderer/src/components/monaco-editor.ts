import loader from "@monaco-editor/loader";
import { getConfigJsonSchema } from "@renderer/config/config-schema";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  createTrustedTypesPolicy(): undefined | monaco.ITrustedTypePolicy {
    return undefined;
  },
  getWorker(_: unknown, label: string): Worker {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    return new editorWorker();
  },
};

export async function initializeJsonSchema(): Promise<void> {
  try {
    // Get the JSON Schema generated from Zod
    const schema = getConfigJsonSchema();

    // Configure JSON validation with the config schema
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [
        {
          uri: "config-schema.json",
          fileMatch: ["*"],
          schema: schema,
        },
      ],
      enableSchemaRequest: false, // We provide the schema directly
    });

    // Configure completion settings for better intellisense
    // Note: colors is false — we register our own color provider below
    monaco.languages.json.jsonDefaults.setModeConfiguration({
      documentFormattingEdits: true,
      documentRangeFormattingEdits: true,
      completionItems: true,
      hovers: true,
      documentSymbols: true,
      tokens: true,
      colors: false,
      foldingRanges: true,
      diagnostics: true,
    });

    // Register a custom color provider to show inline color swatches for hex values
    registerJsonColorProvider();
  } catch (error) {
    console.error("Error configuring JSON schema validation:", error);
  }
}

/**
 * Registers a DocumentColorProvider for JSON that detects #RRGGBB hex strings
 * and shows inline color swatches with Monaco's native color picker.
 */
let colorProviderRegistered = false;
function registerJsonColorProvider(): void {
  if (colorProviderRegistered) return;
  colorProviderRegistered = true;

  const hexPattern = /"(#[0-9a-fA-F]{6})"/g;

  monaco.languages.registerColorProvider("json", {
    provideDocumentColors(model) {
      const text = model.getValue();
      const colors: monaco.languages.IColorInformation[] = [];

      hexPattern.lastIndex = 0;
      for (
        let match = hexPattern.exec(text);
        match !== null;
        match = hexPattern.exec(text)
      ) {
        const hex = match[1];
        // Get position of the hex value (inside the quotes)
        const startOffset = match.index + 1; // skip opening "
        const endOffset = startOffset + hex.length;
        const startPos = model.getPositionAt(startOffset);
        const endPos = model.getPositionAt(endOffset);

        const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
        const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
        const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

        colors.push({
          range: {
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column,
          },
          color: { red: r, green: g, blue: b, alpha: 1 },
        });
      }
      return colors;
    },

    provideColorPresentations(_model, colorInfo) {
      const { red, green, blue } = colorInfo.color;
      const toHex = (n: number) =>
        Math.round(n * 255)
          .toString(16)
          .padStart(2, "0");
      const hex = `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
      return [{ label: hex }];
    },
  });
}

export async function initializeMonaco(): Promise<typeof monaco> {
  loader.config({ monaco });
  await initializeJsonSchema();

  return loader.init();
}
