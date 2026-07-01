import { useCallback, useState } from "react";
import { ConfirmDialog, type ConfirmConfig } from "../components/ConfirmDialog";

/**
 * Ergonomischer Zugang zum ruhigen Bestätigungsdialog: `ask(config, onConfirm)`
 * öffnet ihn, `dialog` wird einmal in der Seite gerendert. Ersetzt native
 * `confirm()`-Aufrufe ohne pro Stelle eigenen State — mehrere Aufrufer teilen
 * sich einen Dialog.
 */
export function useConfirm() {
  const [state, setState] = useState<
    (ConfirmConfig & { onConfirm: () => void }) | null
  >(null);

  const ask = useCallback((config: ConfirmConfig, onConfirm: () => void) => {
    setState({ ...config, onConfirm });
  }, []);

  const close = useCallback(() => setState(null), []);

  const dialog = (
    <ConfirmDialog
      open={state !== null}
      title={state?.title ?? ""}
      body={state?.body}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      danger={state?.danger}
      onConfirm={() => {
        state?.onConfirm();
        close();
      }}
      onCancel={close}
    />
  );

  return { ask, dialog };
}
