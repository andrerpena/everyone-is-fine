import {
  createContext,
  type FC,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Modal } from "./Modal";
import { modalStateStore } from "./modalState";
import type { ModalConfig, ModalInstance } from "./types";

type ModalContextType = {
  openModal: (config: ModalConfig) => string;
  closeModal: (id?: string) => void;
  closeAllModals: () => void;
  modals: ModalInstance[];
};

export const ModalContext = createContext<ModalContextType | null>(null);

/**
 * Provides modal state management without rendering modals.
 * Use ModalRenderer to render modals in the appropriate place in the component tree.
 */
export const ModalProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [modals, setModals] = useState<ModalInstance[]>([]);

  const openModal = useCallback((config: ModalConfig) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newModal: ModalInstance = {
      id,
      config,
    };

    setModals((prev) => [...prev, newModal]);
    return id;
  }, []);

  const closeModal = useCallback((id?: string) => {
    setModals((prev) => {
      if (id) {
        return prev.filter((modal) => modal.id !== id);
      }
      return prev.slice(0, -1);
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  return (
    <ModalContext.Provider
      value={{
        openModal,
        closeModal,
        closeAllModals,
        modals,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

/**
 * Renders modals from the ModalContext.
 * Place this component where you want modals to appear in the React tree,
 * ensuring they have access to any required context providers.
 */
export const ModalRenderer: FC = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("ModalRenderer must be used within a ModalProvider");
  }

  const { modals, closeModal } = context;
  const prevCountRef = useRef(0);

  // Sync modal count with the global store for non-React code
  useEffect(() => {
    const prevCount = prevCountRef.current;
    const currentCount = modals.length;

    if (currentCount > prevCount) {
      // Modals were opened
      for (let i = 0; i < currentCount - prevCount; i++) {
        modalStateStore.increment();
      }
    } else if (currentCount < prevCount) {
      // Modals were closed
      for (let i = 0; i < prevCount - currentCount; i++) {
        modalStateStore.decrement();
      }
    }

    prevCountRef.current = currentCount;
  }, [modals.length]);

  const handleModalClose = useCallback(
    (modalId: string) => {
      const modal = modals.find((m) => m.id === modalId);
      if (modal?.config.onDismiss) {
        modal.config.onDismiss();
      }
      closeModal(modalId);
    },
    [closeModal, modals],
  );

  return (
    <>
      {modals.map((modal, index) => {
        const { content, ...modalProps } = modal.config;
        return (
          <Modal
            key={modal.id}
            open={true}
            onClose={() => handleModalClose(modal.id)}
            content={content}
            zIndex={(modalProps.zIndex || 50) + index}
            {...modalProps}
          />
        );
      })}
    </>
  );
};

export type UseModalResult = {
  openModal: (config: ModalConfig) => string;
  closeModal: (id?: string) => void;
  closeAllModals: () => void;
  modalCount: number;
};

export const useModal = (): UseModalResult => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }

  const { openModal, closeModal, closeAllModals, modals } = context;
  const modalApiRef = useRef<UseModalResult | null>(null);

  if (!modalApiRef.current) {
    modalApiRef.current = {
      openModal,
      closeModal,
      closeAllModals,
      modalCount: modals.length,
    };
  } else {
    modalApiRef.current.openModal = openModal;
    modalApiRef.current.closeModal = closeModal;
    modalApiRef.current.closeAllModals = closeAllModals;
    modalApiRef.current.modalCount = modals.length;
  }

  return modalApiRef.current;
};
