# In-Depth Analysis of Mock Implementation in Cloth-In-App

## Executive Summary

This document provides a comprehensive analysis of how mocks function throughout the Cloth-In-App repository, identifies ksaiyed's implementation patterns as the standard, and documents all inconsistencies that need to be addressed.

---

## 1. Canonical Mock Files (ksaiyed's Standard)

### 1.1 Core Mock Data Files
All canonical mock files follow the `mock-*.json` naming convention and are located in `src/mocks/`:

#### Primary Mock Files:
- **`mock-users.json`** - User data with complete profiles (u_1 through u_8)
  - Structure: Object keyed by user ID (e.g., `"u_1"`, `"u_8"`)
  - Contains: profile data, followers/following, closet, fitpics, saved items, streaks
  - Used by: `fitpicApi.ts`, `userSearch.ts`, `mockSearch.ts`, `useAccountData.ts`, `useProductData.ts`

- **`mock-fitpics.json`** - FitPic data with engagement metrics
  - Structure: `{ "fitpics": [...] }` array
  - Contains: fitpic metadata, captions, featured products, reactions, comments
  - Used by: `fitpicApi.ts`, `fitpicSearch.ts`, `hashtagSearch.ts`, `mockSearch.ts`, `mappers.ts`, `useProductData.ts`, `normalizeFeed.ts`

- **`mock-products.json`** - Product catalog data
  - Structure: `{ "products": [...] }` array
  - Contains: product details, prices, descriptions, reactions, comments
  - Used by: `fitpicApi.ts`, `productSearch.ts`, `fitpicSearch.ts`, `mockSearch.ts`, `mappers.ts`, `useProductData.ts`, `normalizeFeed.ts`

- **`mock-session.json`** - Current session state
  - Structure: `{ "currentUserId": "u_8", "isLoggedIn": false }`
  - Used by: `useProductData.ts`

#### Profile-Specific Mock Files (in `src/mocks/profile/`):
- **`me.json`** - Current user profile data
- **`counts.json`** - Profile counts (posts, following, followers)
- **`tabs.json`** - Profile tab configuration

#### Search-Specific Mock Files:
- **`searchResults.json`** - Search result examples
- **`searchSuggestions.json`** - Search suggestion data
- **`trendingSearches.json`** - Trending search terms array

---

## 2. Mock Implementation Patterns (ksaiyed's Standard)

### 2.1 Import Patterns

#### Pattern A: Direct Static Imports (Most Common)
```typescript
// Used in: fitpicApi.ts, userSearch.ts, productSearch.ts, fitpicSearch.ts, etc.
import rawFitpicsData from '../mocks/mock-fitpics.json';
import rawUsersData from '../mocks/mock-users.json';
import rawProductsData from '../mocks/mock-products.json';
```

**Characteristics:**
- Direct import at module level
- Type-safe with TypeScript
- Synchronous access to data
- Used when data is needed immediately

#### Pattern B: Dynamic Async Imports (Endpoint Definitions)
```typescript
// Used in: src/services/endpoints/profile/getCounts.ts
mock: async (): Promise<ProfileCounts> =>
  (await import("../../../mocks/profile/counts.json")).default as ProfileCounts,
```

**Characteristics:**
- Async import for lazy loading
- Used in endpoint mock functions
- Allows for code splitting
- Returns `.default` property

### 2.2 Service Layer Mock Implementation

#### Standard Service Pattern (ksaiyed's approach):
```typescript
// Example from fitpicApi.ts
import rawFitpicsData from '../mocks/mock-fitpics.json';
import rawUsersData from '../mocks/mock-users.json';
import rawProductsData from '../mocks/mock-products.json';

// Transform raw data to application types
const transformedFitPics: FitPic[] = rawFitpicsData.fitpics
  .map(transformRawFitPic)
  .filter((fp): fp is FitPic => fp !== null);

// Use transformed data in service functions
export const getFitPicById = async (id: string) => {
  await delay(API_DELAY);
  const fitpic = fitpicsData.fitpics.find(fp => fp.id === id);
  // ...
};
```

**Key Principles:**
1. **Separation of Concerns**: Raw JSON data is transformed to application types
2. **Data Transformation**: Raw mock data is mapped to FitPic/Product/User types
3. **Simulated Latency**: API delays are simulated with `delay()` functions
4. **Non-Mutating**: Mock data is not mutated (read-only pattern)
5. **Cross-Reference Resolution**: Data from multiple mock files is combined (e.g., fitpics reference users and products)

### 2.3 Search Service Mock Pattern

#### Enhanced Matching Pattern (ksaiyed's approach):
```typescript
// Example from userSearch.ts
async function fetchUsersFromMockData(queryLower: string): Promise<UserSearchResult[]> {
  // Search ONLY in canonical mock-users.json (u_1 through u_8)
  const usersFromMock = Object.values(usersData as Record<string, any>)
    .filter((user: any) => {
      const usernameMatch = matchesQuery(queryLower, user.username);
      const displayNameMatch = matchesQuery(queryLower, user.displayName);
      const bioMatch = matchesQuery(queryLower, user.bio);
      // Enhanced word-based matching
      return usernameMatch || displayNameMatch || bioMatch || nameMatch;
    })
    .map((user: any): UserSearchResult => ({
      // Transform to search result format
    }));
}
```

**Key Principles:**
1. **Canonical Data Only**: Uses only `mock-users.json`, `mock-fitpics.json`, `mock-products.json`
2. **Enhanced Matching**: Word-based matching, not just substring
3. **Relevance Scoring**: Results are scored and sorted by relevance
4. **Data Transformation**: Raw mock data transformed to search result types via mappers

### 2.4 HTTP Service Endpoint Pattern

#### Endpoint Definition Pattern:
```typescript
// Example from src/services/endpoints/auth/signup.ts
export const signupEndpoint: EndpointDefinition<SignupPayload, SignupResponse> = {
  key: "auth.signup",
  method: "POST",
  auth: "none",
  pathTemplate: "/v1/auth/signup",
  mock: async ({ body }) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    // Return mock response
    return { idToken: "mock-id-token", ... };
  },
};
```

**Key Principles:**
1. **Inline Mock Functions**: Mock logic defined in endpoint definition
2. **Simulated Latency**: Uses `setTimeout` for realistic delays
3. **Type Safety**: Full TypeScript typing for request/response
4. **Auth Policy**: Configurable auth requirements per endpoint
5. **In-Memory State**: Some endpoints use module-scoped Maps for state (e.g., `setUser.ts`)

---

## 3. Inconsistencies and Issues

### 3.1 ❌ CRITICAL: Broken Mock File References

#### Issue 1: `productFitPicService.ts`
**Location:** `src/services/productFitPicService.ts:6`

**Problem:**
```typescript
import fitpicsData from '../mocks/fitpics.json';  // ❌ File doesn't exist
```

**Should be:**
```typescript
import fitpicsData from '../mocks/mock-fitpics.json';  // ✅ Correct
```

**Impact:** This service is completely broken and will cause runtime errors.

---

#### Issue 2: `useMixedFeed.ts`
**Location:** `src/hooks/useMixedFeed.ts:10-11`

**Problem:**
```typescript
import fitpicsData from '../mocks/fitpics.json';      // ❌ File doesn't exist
import productsData from '../mocks/products.json';    // ❌ File doesn't exist
```

**Should be:**
```typescript
import fitpicsData from '../mocks/mock-fitpics.json';    // ✅ Correct
import productsData from '../mocks/mock-products.json';  // ✅ Correct
```

**Impact:** This hook is completely broken and will cause runtime errors.

---

### 3.2 ⚠️ MINOR: Inconsistent Mock Data Structure Access

#### Issue 3: Mixed Data Structure Access Patterns

**Pattern A (Correct - Most Common):**
```typescript
// mock-fitpics.json structure: { "fitpics": [...] }
import fitpicsData from '../mocks/mock-fitpics.json';
const fitpics = fitpicsData.fitpics;  // ✅ Access .fitpics property
```

**Pattern B (Inconsistent):**
```typescript
// Some code assumes direct array import
// This works but is inconsistent with the JSON structure
```

**Recommendation:** All code should consistently access `.fitpics` and `.products` properties from the imported JSON objects.

---

### 3.3 ⚠️ MINOR: Inconsistent Mock File Naming in Comments

Some files reference mock files in comments without the `mock-` prefix, which could cause confusion:
- Comments should consistently reference `mock-*.json` files
- Documentation should use canonical naming

---

## 4. Mock Data Relationships and Cross-References

### 4.1 Data Relationships

The mock data files are designed to work together:

1. **FitPics → Users**: FitPics reference users via `author` field (e.g., `"u_1"`)
2. **FitPics → Products**: FitPics reference products via `featuredProducts.productIds` array
3. **Users → FitPics**: Users have `fitpics.postedIds` array
4. **Users → Products**: Users have `closet.base.productIds` and `closet.racks[].productIds`
5. **Users → Users**: Users have `followers.userIds` and `following.userIds` arrays

### 4.2 Data Resolution Pattern

Services resolve cross-references by:
1. Loading all related mock files
2. Transforming raw data to application types
3. Resolving IDs to full objects (e.g., productIds → Product objects)
4. Combining data from multiple sources

**Example from `fitpicApi.ts`:**
```typescript
// Get user data for author info
const userData = rawUsersData[rawFitpic.author as keyof typeof rawUsersData];

// Transform products from productIds to ProductLite format
const products = (rawFitpic.featuredProducts?.productIds || []).map((productId: string) => {
  const product = rawProductsData.products.find((p: any) => p.id === productId);
  // ...
});
```

---

## 5. Mock Service Architecture

### 5.1 Service Layer Organization

```
src/services/
├── fitpicApi.ts              # FitPic CRUD operations (uses mock-*.json)
├── search/
│   ├── mockSearch.ts         # Top-level search (uses mock-*.json)
│   ├── userSearch.ts         # User search (uses mock-users.json)
│   ├── productSearch.ts      # Product search (uses mock-products.json)
│   ├── fitpicSearch.ts       # FitPic search (uses mock-fitpics.json)
│   ├── hashtagSearch.ts      # Hashtag search (uses mock-fitpics.json)
│   └── mappers.ts            # Data transformers (uses mock-*.json)
├── endpoints/
│   ├── auth/
│   │   ├── signup.ts         # Inline mock function
│   │   └── login.ts          # Inline mock function
│   ├── users/
│   │   ├── getUser.ts        # Inline mock function
│   │   └── setUser.ts        # Inline mock with in-memory DB
│   └── profile/
│       └── getCounts.ts       # Dynamic import from profile/counts.json
└── http.ts                    # HTTP client with mock/real/hybrid modes
```

### 5.2 Mock Mode Configuration

The HTTP service supports three modes (configured via environment variables):

1. **`real`**: All requests go to real API
2. **`mock`**: All requests use mocks
3. **`hybrid`**: Selected endpoints use mocks (via `EXPO_PUBLIC_MOCK_ROUTES`)

**Configuration:**
```typescript
// From http.ts
const apiModeFromEnvironment: ApiMode =
  (process.env.EXPO_PUBLIC_API_MODE as ApiMode | undefined) ??
  (process.env.EXPO_PUBLIC_USE_MOCKS === "true" ? "mock" : "real");
```

---

## 6. Best Practices (Based on ksaiyed's Implementation)

### 6.1 File Naming
✅ **DO:** Use `mock-*.json` prefix for all mock data files
❌ **DON'T:** Use `*.json` without `mock-` prefix

### 6.2 Import Patterns
✅ **DO:** Use direct imports for service layer: `import data from '../mocks/mock-*.json'`
✅ **DO:** Use dynamic imports for endpoint mocks: `(await import("...")).default`
❌ **DON'T:** Mix import patterns inconsistently

### 6.3 Data Transformation
✅ **DO:** Transform raw JSON data to application types
✅ **DO:** Resolve cross-references (IDs → objects)
✅ **DO:** Filter out invalid/null data
❌ **DON'T:** Use raw JSON data directly in components

### 6.4 Mock Function Implementation
✅ **DO:** Simulate realistic latency (200-800ms)
✅ **DO:** Use TypeScript types for request/response
✅ **DO:** Handle edge cases (missing data, errors)
✅ **DO:** Use in-memory state for stateful endpoints (e.g., `setUser`)
❌ **DON'T:** Mutate original mock data files

### 6.5 Search Implementation
✅ **DO:** Use only canonical mock files (`mock-users.json`, `mock-fitpics.json`, `mock-products.json`)
✅ **DO:** Implement enhanced word-based matching
✅ **DO:** Apply relevance scoring
✅ **DO:** Transform results using mappers
❌ **DON'T:** Use non-canonical mock files for search

---

## 7. Files Requiring Fixes

### 7.1 Critical Fixes (Broken Code)

1. **`src/services/productFitPicService.ts`**
   - Line 6: Change `fitpics.json` → `mock-fitpics.json`
   - Verify file structure access (should be `fitpicsData.fitpics`)

2. **`src/hooks/useMixedFeed.ts`**
   - Line 10: Change `fitpics.json` → `mock-fitpics.json`
   - Line 11: Change `products.json` → `mock-products.json`
   - Verify file structure access (should be `fitpicsData.fitpics` and `productsData.products`)

### 7.2 Recommended Improvements

1. **Add Type Definitions**: Create TypeScript interfaces for all mock JSON structures
2. **Centralize Mock Loading**: Consider a mock data loader utility
3. **Documentation**: Add JSDoc comments explaining mock data relationships
4. **Validation**: Add runtime validation for mock data structure

---

## 8. Summary of ksaiyed's Mock Implementation Standard

### Core Principles:
1. ✅ **Consistent Naming**: All mock files use `mock-*.json` prefix
2. ✅ **Canonical Data**: Primary data in `mock-users.json`, `mock-fitpics.json`, `mock-products.json`
3. ✅ **Data Transformation**: Raw JSON → Application Types
4. ✅ **Cross-Reference Resolution**: IDs resolved to full objects
5. ✅ **Non-Mutating**: Mock data is read-only
6. ✅ **Simulated Latency**: Realistic API delays
7. ✅ **Type Safety**: Full TypeScript support
8. ✅ **Enhanced Search**: Word-based matching with relevance scoring

### Files Following Standard:
- ✅ `src/services/fitpicApi.ts`
- ✅ `src/services/search/mockSearch.ts`
- ✅ `src/services/search/userSearch.ts`
- ✅ `src/services/search/productSearch.ts`
- ✅ `src/services/search/fitpicSearch.ts`
- ✅ `src/services/search/hashtagSearch.ts`
- ✅ `src/services/search/mappers.ts`
- ✅ `src/services/endpoints/profile/getCounts.ts`
- ✅ `src/hooks/useAccountData.ts`
- ✅ `src/hooks/useProductData.ts`
- ✅ `src/utils/normalizeFeed.ts`

### Files NOT Following Standard:
- ❌ `src/services/productFitPicService.ts` (broken - wrong file name)
- ❌ `src/hooks/useMixedFeed.ts` (broken - wrong file names)

---

## 9. Recommendations

1. **Immediate Action**: Fix the two broken files (`productFitPicService.ts` and `useMixedFeed.ts`)
2. **Code Review**: Audit all mock imports to ensure consistency
3. **Documentation**: Create a mock data schema document
4. **Testing**: Add tests to verify mock data structure and relationships
5. **Linting**: Add ESLint rules to enforce `mock-*.json` naming convention

---

## 10. Conclusion

ksaiyed has established a robust and consistent mock implementation pattern throughout the codebase. The standard uses:
- Clear naming conventions (`mock-*.json`)
- Proper data transformation
- Enhanced search capabilities
- Type-safe implementations
- Realistic API simulation

The only issues are two broken file references that need immediate attention. Once fixed, the entire mock system will be consistent and functional.

