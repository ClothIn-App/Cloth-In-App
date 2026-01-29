---
name: Frontend-Backend API Integration Plan
overview: Migrate all frontend services from direct mock imports to the EndpointDefinition pattern, create missing endpoint definitions that map to backend routes, and ensure seamless transition between mock and real API modes for MVP.
todos:
  - id: fix-broken-imports
    content: Fix broken imports in productFitPicService.ts and useMixedFeed.ts (fitpics.json → mock-fitpics.json, products.json → mock-products.json)
    status: pending
  - id: create-fitpic-endpoints
    content: Create endpoint definitions for all FitPic operations (create, get, getFeed, updateEngagement, delete) in src/services/endpoints/fitpics/
    status: pending
    dependencies:
      - fix-broken-imports
  - id: create-fitpic-client
    content: Create fitpicClient.ts API client wrapping FitPic endpoints (following authClient/userClient pattern)
    status: pending
    dependencies:
      - create-fitpic-endpoints
  - id: migrate-fitpic-api
    content: Refactor fitpicApi.ts to use endpoint-based calls instead of direct mock imports, maintaining backward compatibility
    status: pending
    dependencies:
      - create-fitpic-client
  - id: create-search-endpoints
    content: Create endpoint definitions for all search operations (trending, suggestions, searchTop, searchUsers, searchFitPics, searchProducts, searchHashtags) in src/services/endpoints/search/
    status: pending
    dependencies:
      - fix-broken-imports
  - id: migrate-search-api
    content: Update searchApi.ts to route to endpoint-based implementations while maintaining facade pattern
    status: pending
    dependencies:
      - create-search-endpoints
  - id: verify-type-alignment
    content: Verify frontend TypeScript types match backend Pydantic models (FitPic, User, etc.)
    status: pending
    dependencies:
      - create-fitpic-endpoints
  - id: test-mock-mode
    content: Test all endpoints in mock mode to ensure they work correctly
    status: pending
    dependencies:
      - migrate-fitpic-api
      - migrate-search-api
---

# Frontend-Backend

API Integration Plan

## Current State Analysis

### ✅ Already Using EndpointDefinition Pattern

- **Auth**: `signup`, `login` → `/v1/auth/signup`, `/v1/auth/login`
- **Users**: `getUser`, `setUser` → `/v1/users/{user_id}`, `/v1/users` (POST)
- **Profile**: `getCounts` → `/v1/profile/counts` (needs backend route)

### ❌ Using Direct Mock Imports (Need Migration)

1. **FitPic Services** (`src/services/fitpicApi.ts`)

- `createFitPic` → `POST /v1/fitpics`
- `getFitPicById` → `GET /v1/fitpics/{fitpic_id}`
- `getUserFitPics` → `GET /v1/fitpics?user_id={userId}`
- `getFeedFitPics` → `GET /v1/fitpics/feed?type={type}&cursor={cursor}&limit={limit}`
- `updateFitPicEngagement` → `POST /v1/fitpics/{fitpic_id}/engagement`
- `deleteFitPic` → `DELETE /v1/fitpics/{fitpic_id}`

2. **Search Services** (`src/services/search/`)

- `getTrending`, `getSuggestions`, `searchTop` → Need backend routes
- `searchUsers` → Need backend route
- `searchFitPics` → Need backend route
- `searchProducts` → Need backend route
- `searchHashtags` → Need backend route

3. **Feed Services** (`src/services/feedApi.ts`)

- `fetchAllPosts`, `fetchFollowedPosts` → May map to `/v1/fitpics/feed`

4. **Broken Files** (Critical Fixes)

- `src/services/productFitPicService.ts` - Wrong import: `fitpics.json` → `mock-fitpics.json`
- `src/hooks/useMixedFeed.ts` - Wrong imports: `fitpics.json`, `products.json` → `mock-fitpics.json`, `mock-products.json`

5. **Component/Hook Direct Imports**

- Multiple components importing mock JSON directly (should use services)

## Implementation Plan

### Phase 1: Critical Fixes

**Files**: `productFitPicService.ts`, `useMixedFeed.ts`

- Fix broken import paths
- Verify file structure access (`.fitpics`, `.products` properties)

### Phase 2: FitPic Endpoints Migration

**Create**: `src/services/endpoints/fitpics/`

- `createFitPic.ts` - POST `/v1/fitpics`
- `getFitPic.ts` - GET `/v1/fitpics/{fitpic_id}`
- `getFitPics.ts` - GET `/v1/fitpics?user_id={userId}`
- `getFeed.ts` - GET `/v1/fitpics/feed`
- `updateEngagement.ts` - POST `/v1/fitpics/{fitpic_id}/engagement`
- `deleteFitPic.ts` - DELETE `/v1/fitpics/{fitpic_id}`
- `index.ts` - Export all endpoints

**Create**: `src/services/apiClients/fitpicClient.ts`

- Wrap endpoints in client functions (like `authClient.ts`, `userClient.ts`)

**Update**: `src/services/fitpicApi.ts`

- Replace direct mock imports with endpoint calls
- Keep transformation logic in mock functions
- Maintain backward compatibility for existing hooks

### Phase 3: Search Endpoints Migration

**Create**: `src/services/endpoints/search/`

- `getTrending.ts` - GET `/v1/search/trending` (needs backend)
- `getSuggestions.ts` - GET `/v1/search/suggestions?q={query}` (needs backend)
- `searchTop.ts` - GET `/v1/search/top?q={query}` (needs backend)
- `searchUsers.ts` - GET `/v1/search/users?q={query}` (needs backend)
- `searchFitPics.ts` - GET `/v1/search/fitpics?q={query}` (needs backend)
- `searchProducts.ts` - GET `/v1/search/products?q={query}` (needs backend)
- `searchHashtags.ts` - GET `/v1/search/hashtags?q={query}` (needs backend)
- `index.ts` - Export all endpoints

**Update**: `src/services/searchApi.ts`

- Keep as facade, but route to endpoint-based implementations
- Maintain existing exports for backward compatibility

**Note**: Backend search routes don't exist yet - mocks will be used until backend implements them

### Phase 4: Feed Endpoints Migration

**Update**: `src/services/feedApi.ts`

- Replace with endpoint definition pointing to `/v1/fitpics/feed`
- Or consolidate into fitpic endpoints

### Phase 5: Type Alignment

**Verify**: Frontend types match backend models

- `FitPic` type alignment (`src/types/fitpic.ts` ↔ `app/models/fitpic.py`)
- `User` type alignment
- Request/Response type consistency

### Phase 6: Component Cleanup (Optional for MVP)

- Replace direct mock imports in components with service calls
- Update hooks to use endpoint-based services
- Files: `components/account/`, `components/fitpic-modal/`, `app/*.tsx`

## Mock Implementation Strategy

Each endpoint mock function should:

1. **Load mock data** using dynamic imports: `(await import("../../../mocks/mock-*.json")).default`
2. **Transform data** to match backend response format
3. **Simulate latency** with `setTimeout` (200-800ms)
4. **Handle edge cases** (missing data, errors)
5. **Maintain type safety** with TypeScript

## Backend Route Gaps

Routes that need to be implemented in backend:

- `GET /v1/profile/counts` - Profile counts endpoint
- `GET /v1/search/*` - All search endpoints (trending, suggestions, top, users, fitpics, products, hashtags)

## Migration Pattern Example

**Before** (`fitpicApi.ts`):

```typescript
import rawFitpicsData from '../mocks/mock-fitpics.json';
export const getFitPicById = async (id: string) => {
  const fitpic = fitpicsData.fitpics.find(fp => fp.id === id);
  // ...
};
```

**After** (`endpoints/fitpics/getFitPic.ts`):

```typescript
export const getFitPicEndpoint: EndpointDefinition<undefined, GetFitPicResponse> = {
  key: "fitpics.get",
  method: "GET",
  pathTemplate: "/v1/fitpics/:fitpic_id",
  mock: async ({ pathParameters }) => {
    await new Promise(r => setTimeout(r, 400));
    const data = (await import("../../../mocks/mock-fitpics.json")).default;
    const fitpic = data.fitpics.find(fp => fp.id === pathParameters.fitpic_id);
    // Transform and return
  },
};
```



## Testing Strategy

1. **Mock Mode**: Verify all endpoints work with mocks
2. **Hybrid Mode**: Test selective endpoint mocking
3. **Real Mode**: Test against backend (when available)
4. **Type Safety**: Ensure TypeScript compilation passes

## Files to Create/Modify

### New Files (Endpoints)

- `src/services/endpoints/fitpics/createFitPic.ts`
- `src/services/endpoints/fitpics/getFitPic.ts`
- `src/services/endpoints/fitpics/getFitPics.ts`
- `src/services/endpoints/fitpics/getFeed.ts`
- `src/services/endpoints/fitpics/updateEngagement.ts`
- `src/services/endpoints/fitpics/deleteFitPic.ts`
- `src/services/endpoints/fitpics/index.ts`
- `src/services/endpoints/search/*.ts` (7 files)
- `src/services/apiClients/fitpicClient.ts`

### Files to Modify

- `src/services/fitpicApi.ts` - Migrate to use endpoints
- `src/services/searchApi.ts` - Route to endpoints
- `src/services/productFitPicService.ts` - Fix imports
- `src/hooks/useMixedFeed.ts` - Fix imports
- `src/services/feedApi.ts` - Migrate to endpoints

## Success Criteria

1. ✅ All services use `EndpointDefinition` pattern
2. ✅ No direct mock JSON imports in services (only in endpoint mocks)
3. ✅ Seamless switching between mock/real/hybrid modes
4. ✅ All backend routes have corresponding frontend endpoints