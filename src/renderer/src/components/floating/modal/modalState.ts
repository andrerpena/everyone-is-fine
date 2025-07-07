/**
 * Simple reactive store for tracking modal open state.
 * Used by non-React code (like InteractionManager) to check if modals are blocking interactions.
 */

type Listener = (isModalOpen: boolean) => void;

class ModalStateStore {
  private modalCount = 0;
  private listeners = new Set<Listener>();

  /**
   * Increment modal count (called when modal opens)
   */
  increment(): void {
    this.modalCount++;
    this.notify();
  }

  /**
   * Decrement modal count (called when modal closes)
   */
  decrement(): void {
    this.modalCount = Math.max(0, this.modalCount - 1);
    this.notify();
  }

  /**
   * Check if any modal is currently open
   */
  isModalOpen(): boolean {
    return this.modalCount > 0;
  }

  /**
   * Subscribe to modal state changes
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const isOpen = this.isModalOpen();
    for (const listener of this.listeners) {
      listener(isOpen);
    }
  }
}

export const modalStateStore = new ModalStateStore();
