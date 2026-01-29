# Mock Cleanup Status - What's Missing

## ❌ **CRITICAL ISSUE: Branch is Incomplete**

The cleanup commit (`0040963`) **accidentally deleted** the API clients that were created in `b5b4539`, and the migration of hooks/services **never happened**.

## What SHOULD Exist (from your summary):

### ✅ **Completed:**
1. ✅ Endpoint definitions created (auth, users, profile)
2. ✅ `authClient.ts` exists and works
3. ✅ `userClient.ts` exists and works
4. ✅ Pattern established in `http.ts`

### ❌ **Missing/Incomplete:**

#### 1. **API Clients Were Deleted:**
- ❌ `src/services/apiClients/searchClient.ts` - **DELETED in cleanup commit**
- ❌ `src/services/apiClients/contentClient.ts` - **DELETED in cleanup commit**

**Evidence:**
- Created in commit `b5b4539` (185 lines for searchClient, 117 lines for contentClient)
- Deleted in commit `0040963` (cleanup removed them)

#### 2. **Endpoint Definitions Were Deleted:**
- ❌ `src/services/endpoints/search/` directory - **DELETED**
- ❌ `src/services/endpoints/content/` directory - **DELETED**

**Should contain:**
- `search/suggestions.ts` - getSuggestionsEndpoint
- `search/trending.ts` - getTrendingEndpoint  
- `search/users.ts` - searchUsersEndpoint
- `search/fitpics.ts` - searchFitPicsEndpoint
- `search/products.ts` - searchProductsEndpoint
- `search/hashtags.ts` - searchHashtagsEndpoint
- `search/top.ts` - searchTopEndpoint
- `content/fitpics.ts` - getFitPicsEndpoint
- `content/products.ts` - getProductsEndpoint, getProductEndpoint

#### 3. **Services Still Use Direct Imports:**
- ❌ `src/services/searchApi.ts` - Uses direct JSON imports (should use searchClient)
- ❌ `src/services/productFitPicService.ts` - Uses direct JSON import (should use contentClient)
- ❌ `src/services/fitpicApi.ts` - Uses empty inline mock (should use contentClient)

#### 4. **Hooks Never Migrated:**
- ❌ `src/hooks/useAccountData.ts` - Still imports `mock-users.json` directly
  - **Should use:** `userClient.getUser(userId)`
  
- ❌ `src/hooks/useProductData.ts` - Still imports `mock-products.json`, `mock-fitpics.json`
  - **Should use:** `contentClient.getProduct(productId)`, `contentClient.getFitPicsForProduct()`
  
- ❌ `src/hooks/useMixedFeed.ts` - Still imports `fitpics.json`, `products.json`
  - **Should use:** `contentClient.getFitPics()`, `contentClient.getProducts()`

#### 5. **Components May Not Be Updated:**
- ⚠️ Need to verify components are using API clients (not direct imports)

## Why Search Broke:

1. `searchApi.ts` was emptied during cleanup
2. It was recreated with direct JSON imports (wrong pattern)
3. `searchClient` was deleted, so it can't use the correct pattern
4. Search endpoints were deleted, so there's no EndpointDefinition to use

## What Needs to Happen:

### Step 1: Restore Missing Files
- Restore `src/services/apiClients/searchClient.ts` from commit `b5b4539`
- Restore `src/services/apiClients/contentClient.ts` from commit `b5b4539`
- Restore `src/services/endpoints/search/` directory from commit `b5b4539`
- Restore `src/services/endpoints/content/` directory from commit `b5b4539`

### Step 2: Migrate Services
- Update `searchApi.ts` to use `searchClient` functions
- Update `productFitPicService.ts` to use `contentClient` functions
- Update `fitpicApi.ts` to use `contentClient` functions

### Step 3: Migrate Hooks
- Update `useAccountData.ts` to use `userClient.getUser()`
- Update `useProductData.ts` to use `contentClient.getProduct()` and related functions
- Update `useMixedFeed.ts` to use `contentClient.getFitPics()` and `getProducts()`

### Step 4: Verify Components
- Check all components use API clients (not direct imports)
- Update any that still use direct imports

### Step 5: Remove Direct JSON Imports
- Remove all `import ... from '../mocks/...json'` statements
- Ensure all data access goes through `http.ts` → EndpointDefinition → mock functions

## Summary:

**The branch is ~40% complete:**
- ✅ Pattern established
- ✅ Auth/User endpoints done
- ❌ Search/Content endpoints deleted (need restore)
- ❌ Search/Content clients deleted (need restore)
- ❌ Services not migrated (need update)
- ❌ Hooks not migrated (need update)
- ❌ Direct imports still exist everywhere

**The cleanup commit went too far** and removed files that were supposed to be used, not deleted.

