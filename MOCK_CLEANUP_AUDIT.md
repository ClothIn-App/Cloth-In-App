# Mock Cleanup Audit Report

## Summary
This audit checks if the `fe-mock-cleanup` branch has completed all tasks and identifies any missing pieces.

## ✅ Completed Tasks

### 1. EndpointDefinition Pattern Implementation
- ✅ Created `EndpointDefinition` type in `src/services/http.ts`
- ✅ Created endpoint definitions for:
  - Auth endpoints (login, signup)
  - User endpoints (getUser, setUser)
  - Profile endpoints (getCounts)
- ✅ Created API clients:
  - `authClient.ts` ✅
  - `userClient.ts` ✅
- ✅ All endpoint definitions follow consistent pattern with inline mocks

### 2. Code Cleanup
- ✅ Removed 4,500+ lines of unused code
- ✅ Deleted 32 unused files (search category pages, old search components, filters, etc.)
- ✅ Removed 20+ documentation files from planning phase

## ⚠️ Incomplete Tasks / Issues Found

### 1. Direct JSON Imports Still Present

#### Services (Should use EndpointDefinition pattern):
- ❌ **`src/services/searchApi.ts`** - Direct imports:
  - `trendingSearches.json`
  - `searchSuggestions.json`
  - **Status**: Functions exist but use direct JSON imports instead of EndpointDefinition pattern

- ❌ **`src/services/productFitPicService.ts`** - Direct import:
  - `fitpics.json`
  - **Status**: Should potentially use content API client

#### Hooks (May be acceptable, but inconsistent):
- ⚠️ **`src/hooks/useProductData.ts`** - Direct imports:
  - `mock-products.json`
  - `mock-fitpics.json`
  - **Note**: Hooks might be acceptable to use direct imports, but inconsistent with pattern

- ⚠️ **`src/hooks/useMixedFeed.ts`** - Direct imports:
  - `fitpics.json`
  - `products.json`
  - **Note**: Same as above

- ⚠️ **`src/hooks/useAccountData.ts`** - Direct import:
  - `mock-users.json`
  - **Note**: Should probably use `userClient.getUser()` instead

### 2. Missing Endpoint Definitions

The cleanup commit (`0040963`) removed:
- ❌ `src/services/endpoints/content/` directory
- ❌ `src/services/endpoints/search/` directory
- ❌ `src/services/apiClients/contentClient.ts`
- ❌ `src/services/apiClients/searchClient.ts`

**Question**: Were these removed intentionally, or should they exist?

**Evidence from commit `b5b4539`**:
- Created `contentClient.ts` (117 lines)
- Created `searchClient.ts` (185 lines)
- Created endpoints in `endpoints/content/` and `endpoints/search/`

**Current state**: These are all gone in commit `0040963`

### 3. Services Not Using EndpointDefinition Pattern

- ⚠️ **`src/services/fitpicApi.ts`**:
  - Uses inline mock data structure (empty `fitpicsData = { fitpics: [] }`)
  - Does NOT use `EndpointDefinition` pattern
  - Does NOT use `callApiEndpoint`
  - **Status**: Works but doesn't follow the new pattern

### 4. Inconsistencies

1. **Mixed patterns**: Some services use EndpointDefinition, others use direct imports, others use inline mocks
2. **Hooks**: Some hooks use direct JSON imports, others might use API clients (need to verify)
3. **Search service**: `searchApi.ts` was recreated with direct JSON imports instead of EndpointDefinition pattern

## 🔍 Specific Issues

### Issue 1: searchApi.ts Pattern
**Current**: Direct JSON imports
```typescript
import trendingSearchesData from '../mocks/trendingSearches.json';
import searchSuggestionsData from '../mocks/searchSuggestions.json';
```

**Should be**: EndpointDefinition pattern
```typescript
// In src/services/endpoints/search/suggestions.ts
export const getSuggestionsEndpoint: EndpointDefinition<...> = { ... }
// In src/services/apiClients/searchClient.ts
export async function getSuggestions(query: string) { ... }
```

### Issue 2: Missing Content Endpoints
The cleanup removed content endpoints, but:
- `productFitPicService.ts` still needs fitpics data
- `fitpicApi.ts` has empty mock data
- Hooks still import fitpics/products JSON directly

**Question**: Should content endpoints exist?

### Issue 3: Hook Data Access
Hooks are importing JSON directly instead of using API clients:
- `useAccountData` → should use `userClient.getUser()`
- `useProductData` → should use content API client
- `useMixedFeed` → should use content API client

## 📋 Recommendations

### High Priority
1. **Migrate `searchApi.ts` to EndpointDefinition pattern**
   - Create `src/services/endpoints/search/suggestions.ts`
   - Create `src/services/endpoints/search/trending.ts`
   - Create `src/services/apiClients/searchClient.ts`
   - Update `searchApi.ts` to use the client

2. **Decide on content endpoints**
   - If removed intentionally: Update all services/hooks to use alternative pattern
   - If removed accidentally: Restore them

3. **Update hooks to use API clients**
   - `useAccountData` → use `userClient`
   - `useProductData` → use content client (if it exists)
   - `useMixedFeed` → use content client (if it exists)

### Medium Priority
4. **Migrate `productFitPicService.ts`**
   - Either use content API client or inline mocks consistently

5. **Standardize `fitpicApi.ts`**
   - Either migrate to EndpointDefinition or document why it uses inline mocks

### Low Priority
6. **Document the pattern**
   - When to use EndpointDefinition vs inline mocks
   - When hooks can use direct imports vs API clients

## ✅ What's Working

- Auth endpoints fully migrated ✅
- User endpoints fully migrated ✅
- Profile endpoints fully migrated ✅
- HTTP service with EndpointDefinition pattern ✅
- API client pattern established ✅
- Major cleanup completed ✅

## 🎯 Conclusion

The mock cleanup is **mostly complete** but has **inconsistencies**:

1. **Search service** needs to be migrated to EndpointDefinition pattern
2. **Content/search endpoints** were removed - need to decide if this was intentional
3. **Hooks** should use API clients instead of direct JSON imports
4. **Some services** still use direct imports or inline mocks

The branch accomplished the main goal (removing unused code, establishing pattern) but left some services in an inconsistent state.

