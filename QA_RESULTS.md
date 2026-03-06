# Frontend Integration QA Results

**Plan:** Frontend Integration Stabilization (Post-Backend Fixes)  
**Date:** 2026-03-06  
**Branch:** main

## How to Run QA

### Mock Mode
1. Set `EXPO_PUBLIC_API_MODE=mock` (or leave unset; defaults to mock if `EXPO_PUBLIC_USE_MOCKS=true`).
2. Run `npx expo start`.
3. Open in simulator/device.

### Real Mode
1. Set `EXPO_PUBLIC_API_MODE=real`.
2. Ensure backend is running and `EXPO_PUBLIC_API_URL` points to it.
3. Run `npx expo start`.
4. Log in with a valid account.

---

## Test Checklist

### Real Mode

| Scenario | Expected | Pass/Fail | Notes |
|----------|----------|-----------|-------|
| Home streak fetch uses authenticated UID | Streak shows for logged-in user, no mock IDs | | |
| Streak drawer fitpic fetch uses authenticated UID | Calendar shows user's fitpics | | |
| Account reflects updated counts after leaving/returning | Navigate away (e.g. to profile edit) and back; counts refresh | | |
| User-profile follow-state changes propagate to header | Follow/unfollow; header counts and button update | | |
| Followers/following modal toggles stay consistent with parent | Follow in modal; close; header counts match | | |
| Cold-start auth guard path | Restart app with stale token; no profile trap loop | | |

### Error UX

| Scenario | Expected | Pass/Fail | Notes |
|----------|----------|-----------|-------|
| Self-follow (400 validation) | Clear message from backend `detail`, not generic | | |

### Mock Mode

| Scenario | Expected | Pass/Fail | Notes |
|----------|----------|-----------|-------|
| App loads | No crash on boot | | |
| Home/account basic load | Tabs load and show content | | |
| Tab navigation | Home ↔ Account works | | |

---

## Implementation Summary

1. **Phase 1 (Real-mode identity):** Home and StreakDrawer use `useCurrentUserId`; no mock session bleed-through in real mode.
2. **Phase 2 (Focus refetch):** Account and user-profile refetch on focus (skip first focus to avoid duplicate initial load).
3. **Phase 3 (Modal sync):** Followers/Following modals call `onFollowChange` on success; ProfileHeader and PublicProfileHeader pass refresh callbacks.
4. **Phase 4 (Error UX):** Follow/unfollow errors use backend `detail` when present; mock follow returns throw on `success: false`; self-follow shows validation message.
