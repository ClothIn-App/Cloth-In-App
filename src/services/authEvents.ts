// src/services/authEvents.ts
// Event emitter system for decoupled auth state management

type AuthEventType = 'token_expired' | 'logout_required';

type AuthEventListener = () => void;

/**
 * Event emitter for authentication state changes.
 * Prevents circular dependencies between HTTP service and navigation.
 */
class AuthEventEmitter {
  private listeners: Map<AuthEventType, Set<AuthEventListener>> = new Map();

  /**
   * Subscribe to an auth event
   * @param event - Event type to listen for
   * @param listener - Callback function to execute when event is emitted
   * @returns Unsubscribe function
   */
  on(event: AuthEventType, listener: AuthEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Emit an auth event to all registered listeners
   * @param event - Event type to emit
   */
  emit(event: AuthEventType): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // Create a copy of the set to avoid issues if listeners modify during iteration
      const listenersArray = Array.from(eventListeners);
      listenersArray.forEach((listener) => {
        try {
          listener();
        } catch (error) {
          // Log error but don't crash - one listener failure shouldn't break others
          console.error(`[AUTH_EVENTS] Error in listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event
   * @param event - Event type to clear
   */
  removeAllListeners(event?: AuthEventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Export singleton instance
export const authEvents = new AuthEventEmitter();

