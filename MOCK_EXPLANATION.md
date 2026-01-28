# How Mocks Work in Cloth-In-App - Simple Explanation

## The Big Picture: Why Mocks?

When building a mobile app, you often need to:
1. **Develop features** before the backend API is ready
2. **Test your app** without needing a running server
3. **Work offline** or with unreliable network
4. **Switch easily** between fake data (mocks) and real API calls

**Mocks = Fake data that acts like real API responses**

---

## The Three-Layer Architecture

Think of it like ordering food:

```
┌─────────────────────────────────────────┐
│  Component/Screen (The Customer)        │
│  "I want to sign up a user"            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  API Client (The Waiter)                │
│  authClient.signup()                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  HTTP Service (The Kitchen Manager)     │
│  callApiEndpoint()                      │
│  Decides: Mock or Real API?              │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
┌──────────────┐  ┌──────────────┐
│ Mock Function│  │ Real Backend │
│ (Fake data)  │  │ (Real server) │
└──────────────┘  └──────────────┘
```

---

## How It Works: Step-by-Step Example

Let's trace through a **signup** request to see how mocks work:

### Step 1: Component Calls the API Client

**File**: `app/auth/signup.tsx` (or wherever signup happens)
```typescript
import { authApiClient } from '@/src/services/apiClients/authClient';

// User fills out form and clicks "Sign Up"
const handleSignup = async () => {
  const result = await authApiClient.signup({
    email: "user@example.com",
    password: "password123",
    confirmPassword: "password123"
  });
  // Use the result...
};
```

### Step 2: API Client Calls the HTTP Service

**File**: `src/services/apiClients/authClient.ts`
```typescript
import { signupEndpoint } from "../endpoints/auth/signup";
import { callApiEndpoint } from "../http";

export async function signup(body: any) {
  // This calls the HTTP service with the endpoint definition
  return callApiEndpoint<any, any>(signupEndpoint, { 
    requestBody: body 
  });
}
```

**What's happening:**
- The client imports the `signupEndpoint` (which defines the API route and mock)
- It calls `callApiEndpoint()` which is the "smart router" that decides mock vs real

### Step 3: HTTP Service Checks Mode and Routes

**File**: `src/services/http.ts` (lines 188-237)

```typescript
export async function callApiEndpoint(...) {
  // Check environment variable to see if we're in mock mode
  const currentApiMode: ApiMode = apiModeFromEnvironment;
  // Could be: "mock", "real", or "hybrid"
  
  // Build the URL (even if we won't use it for mocks)
  const url = `${BASE_API_URL}${resolvedPath}${queryString}`;
  // Example: "http://127.0.0.1:8080/v1/auth/signup"
  
  // DECISION POINT: Should we use mock or real API?
  if (shouldUseMockForEndpoint(endpointDefinition.key, currentApiMode)) {
    // ✅ USE MOCK
    // Call the mock function defined in the endpoint
    const mockData = await endpointDefinition.mock({
      body: options.requestBody,
      pathParameters: finalPathParameters,
      queryParameters: finalQueryParameters,
      headers: mergedHeaders,
    });
    return mockData; // Return fake data
  }
  
  // ❌ USE REAL API
  // Make actual HTTP request to backend
  const response = await fetch(url, init);
  return await response.json();
}
```

**Key Point**: The HTTP service is like a smart switch. It looks at:
- `EXPO_PUBLIC_API_MODE` environment variable
- Whether the endpoint has a mock function
- Then routes to either mock or real API

### Step 4: Mock Function Returns Fake Data

**File**: `src/services/endpoints/auth/signup.ts`

```typescript
export const signupEndpoint: EndpointDefinition<SignupPayload, SignupResponse> = {
  key: "auth.signup",                    // Unique identifier
  method: "POST",                        // HTTP method
  auth: "none",                          // No auth needed for signup
  pathTemplate: "/v1/auth/signup",       // Backend route (when real)
  
  // THIS IS THE MOCK FUNCTION
  mock: async ({ body }) => {
    // Simulate network delay (real APIs take time)
    await new Promise((resolve) => setTimeout(resolve, 250));
    
    // Get the email from the request
    const email = (body as SignupPayload).email.toLowerCase();
    
    // Return fake data that looks like a real API response
    return {
      idToken: "mock-id-token",
      refreshToken: "mock-refresh",
      user: { 
        uid: "mock-uid-123", 
        email 
      },
    };
  },
};
```

**What the mock does:**
1. **Waits 250ms** - Simulates network delay (real APIs don't respond instantly)
2. **Reads the request** - Gets `email` from `body`
3. **Returns fake data** - Creates a response that matches what the real API would return

---

## Complete Working Example: Signup Flow

Here's the **entire flow** from button click to response:

```
1. User clicks "Sign Up" button
   ↓
2. Component calls: authApiClient.signup({ email, password })
   ↓
3. authClient.ts calls: callApiEndpoint(signupEndpoint, { requestBody })
   ↓
4. http.ts checks: "Are we in mock mode?" → YES
   ↓
5. http.ts calls: signupEndpoint.mock({ body: { email, password } })
   ↓
6. signup.ts mock function:
   - Waits 250ms (simulate delay)
   - Creates fake response: { idToken: "mock-id-token", ... }
   - Returns it
   ↓
7. http.ts returns the mock data
   ↓
8. authClient.ts returns the mock data
   ↓
9. Component receives: { idToken: "mock-id-token", user: {...} }
   ↓
10. Component shows success message! ✅
```

**If we switched to "real" mode**, step 4 would be:
```
4. http.ts checks: "Are we in mock mode?" → NO
   ↓
5. http.ts makes real HTTP request: POST http://127.0.0.1:8080/v1/auth/signup
   ↓
6. Backend server processes request and returns real data
   ↓
7. http.ts returns the real data
   ↓
8. (same as before...)
```

---

## Real Example from the Repo: `getUser`

Let's look at a **working example** that's already in the codebase:

### The Endpoint Definition

**File**: `src/services/endpoints/users/getUser.ts`

```typescript
export const getUserEndpoint: EndpointDefinition<undefined, GetUserResponse> = {
  key: "users.get",                           // Unique key
  method: "GET",                              // HTTP method
  pathTemplate: "/v1/users/get/:userId",      // Route with parameter
  
  // MOCK FUNCTION
  mock: async ({ pathParameters, headers }) => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 200));
    
    // Get userId from the URL path
    const userId = pathParameters.userId;
    // Example: if URL is "/v1/users/get/u_123", userId = "u_123"
    
    // Return fake user data
    return {
      user: {
        uid: userId,
        email: `user+${userId}@example.com`.toLowerCase(),
        displayName: "Jane Doe",
        username: "janedoe",
        avatarUrl: "https://example.com/avatars/jane.png",
        bio: "Clothes & coffee.",
        accountType: "personal",
        counts: {
          posts: 12,
          following: 87,
          followers: 143,
        },
      },
    };
  },
};
```

### The API Client

**File**: `src/services/apiClients/userClient.ts`

```typescript
import { getUserEndpoint, GetUserResponse } from '../endpoints'
import { callApiEndpoint } from "../http";

export async function getUser(userId: string) {
  return callApiEndpoint<undefined, GetUserResponse>(getUserEndpoint, {
    pathParameters: { userId },  // Pass userId to fill in :userId in path
  });
}

export const userApiClient = { getUser };
```

### How It's Used

**In a component or hook:**
```typescript
import { userApiClient } from '@/src/services/apiClients/userClient';

const user = await userApiClient.getUser("u_123");
// Returns: { user: { uid: "u_123", email: "user+u_123@example.com", ... } }
```

### What Happens Behind the Scenes

1. **Component calls**: `userApiClient.getUser("u_123")`
2. **Client calls**: `callApiEndpoint(getUserEndpoint, { pathParameters: { userId: "u_123" } })`
3. **HTTP service**:
   - Checks mode → "mock" (if `EXPO_PUBLIC_API_MODE=mock`)
   - Builds path: `/v1/users/get/u_123`
   - Calls `getUserEndpoint.mock({ pathParameters: { userId: "u_123" } })`
4. **Mock function**:
   - Waits 200ms
   - Uses `pathParameters.userId` = "u_123"
   - Returns fake user data
5. **Response flows back** through the layers

---

## Environment Variables: Controlling Mock vs Real

The magic happens with environment variables:

**File**: `.env` or `app.json`
```bash
# Use mocks for everything
EXPO_PUBLIC_API_MODE=mock

# Use real API for everything
EXPO_PUBLIC_API_MODE=real

# Use mocks for specific endpoints only
EXPO_PUBLIC_API_MODE=hybrid
EXPO_PUBLIC_MOCK_ROUTES=auth.signup,users.get
```

**How it works in `http.ts`:**
```typescript
const apiModeFromEnvironment: ApiMode =
  (process.env.EXPO_PUBLIC_API_MODE as ApiMode | undefined) ??
  (process.env.EXPO_PUBLIC_USE_MOCKS === "true" ? "mock" : "real");
```

---

## The Problem: Direct Mock Imports

**❌ BAD WAY (What we're trying to fix):**

```typescript
// src/services/fitpicApi.ts
import rawFitpicsData from '../mocks/mock-fitpics.json';  // Direct import!

export const getFitPicById = async (id: string) => {
  // This ALWAYS uses mock data, can't switch to real API
  const fitpic = rawFitpicsData.fitpics.find(fp => fp.id === id);
  return fitpic;
};
```

**Problems:**
- Can't switch to real API (always uses mock)
- No centralized control
- No logging or error handling
- Can't test with real backend

**✅ GOOD WAY (What we want):**

```typescript
// src/services/endpoints/fitpics/getFitPic.ts
export const getFitPicEndpoint: EndpointDefinition<undefined, GetFitPicResponse> = {
  key: "fitpics.get",
  method: "GET",
  pathTemplate: "/v1/fitpics/:fitpic_id",
  mock: async ({ pathParameters }) => {
    await new Promise(r => setTimeout(r, 400));
    const data = (await import("../../../mocks/mock-fitpics.json")).default;
    const fitpic = data.fitpics.find(fp => fp.id === pathParameters.fitpic_id);
    return { success: true, fitpic };
  },
};

// src/services/apiClients/fitpicClient.ts
export async function getFitPic(fitpicId: string) {
  return callApiEndpoint(getFitPicEndpoint, {
    pathParameters: { fitpic_id: fitpicId }
  });
}
```

**Benefits:**
- ✅ Can switch between mock and real API
- ✅ Centralized control via `http.ts`
- ✅ Automatic logging
- ✅ Type-safe
- ✅ Easy to test

---

## Key Concepts Summary

1. **EndpointDefinition**: A blueprint that describes:
   - The API route (`/v1/auth/signup`)
   - HTTP method (`POST`, `GET`, etc.)
   - Mock function (returns fake data)
   - Auth requirements

2. **API Client**: A wrapper that makes it easy to call endpoints
   - Example: `authClient.signup()` instead of calling `callApiEndpoint()` directly

3. **HTTP Service (`http.ts`)**: The smart router
   - Checks environment variables
   - Decides: mock or real?
   - Handles auth, logging, errors

4. **Mock Function**: Returns fake data
   - Simulates network delay
   - Transforms mock JSON to match API response format
   - Handles edge cases

5. **Environment Variables**: Control behavior
   - `EXPO_PUBLIC_API_MODE=mock` → Use mocks
   - `EXPO_PUBLIC_API_MODE=real` → Use real API
   - `EXPO_PUBLIC_API_MODE=hybrid` → Mix of both

---

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT/HOOK                           │
│  const result = await authClient.signup({ email, pass })    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API CLIENT                                │
│  authClient.ts                                               │
│  - Imports endpoint definition                              │
│  - Calls callApiEndpoint()                                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    HTTP SERVICE (http.ts)                    │
│  callApiEndpoint()                                           │
│                                                              │
│  1. Check EXPO_PUBLIC_API_MODE                              │
│  2. Build URL from pathTemplate                            │
│  3. Handle auth headers                                     │
│  4. DECISION: Mock or Real?                                 │
└───────────────┬───────────────────────┬─────────────────────┘
                │                       │
                ▼                       ▼
    ┌───────────────────┐    ┌───────────────────┐
    │   MOCK PATH       │    │   REAL API PATH   │
    │                   │    │                   │
    │ endpoint.mock()   │    │ fetch(url, init)  │
    │                   │    │                   │
    │ - Load JSON       │    │ - HTTP request    │
    │ - Transform data  │    │ - Backend server  │
    │ - Simulate delay  │    │ - Real database   │
    │ - Return fake     │    │ - Return real     │
    └───────────────────┘    └───────────────────┘
                │                       │
                └───────────┬───────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   RESPONSE    │
                    │  (Same shape) │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   COMPONENT    │
                    │  (Uses data)   │
                    └───────────────┘
```

---

## Next Steps

Now that you understand how mocks work:

1. **Look at working examples**:
   - `src/services/endpoints/auth/signup.ts` ✅
   - `src/services/endpoints/users/getUser.ts` ✅
   - `src/services/apiClients/authClient.ts` ✅

2. **Compare with broken examples**:
   - `src/services/fitpicApi.ts` ❌ (direct imports)
   - `src/services/search/mockSearch.ts` ❌ (direct imports)

3. **The goal**: Convert all the ❌ examples to follow the ✅ pattern

This way, you can easily switch between mock and real API, test everything, and have a clean, maintainable codebase!

