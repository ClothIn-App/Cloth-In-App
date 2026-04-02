let pendingThankYou = false;

export function setPendingEditSubmissionThankYou(): void {
  pendingThankYou = true;
}

export function consumePendingEditSubmissionThankYou(): boolean {
  const v = pendingThankYou;
  pendingThankYou = false;
  return v;
}
