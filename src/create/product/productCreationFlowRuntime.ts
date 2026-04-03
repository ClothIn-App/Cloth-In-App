import type { ProductCreationReturnContext, ResolvedProductOutcome } from './productCreationFlowTypes';

let active: ProductCreationReturnContext | null = null;

export function setActiveProductCreationReturnContext(ctx: ProductCreationReturnContext): void {
  active = ctx;
}

export function getActiveProductCreationReturnContext(): ProductCreationReturnContext | null {
  return active;
}

export function patchActiveResolvedProductOutcome(outcome: ResolvedProductOutcome): void {
  if (active) {
    active = { ...active, resolvedProductOutcome: outcome };
  }
}

export function clearActiveProductCreationReturnContext(): void {
  active = null;
}
