// BEHAVIOR: centralizes state management, caching, and background data fetching, similar to React Query / TanStack Query.
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// BEHAVIOR: Initializes React Context for managing application-wide server-side cached state
const ServerStateContext = createContext();

/**
 * ServerStateProvider - Provides a centralized server-state caching and synchronization engine.
 * Emulates key features of TanStack Query (React Query) using the React Context API.
 */
export const ServerStateProvider = ({ children }) => {
  // BEHAVIOR: cache stores responses keyed by query unique key
  const [cache, setCache] = useState({});
  // BEHAVIOR: loading tracks ongoing API queries keyed by query unique key
  const [loading, setLoading] = useState({});
  // BEHAVIOR: errors tracks query errors keyed by query unique key
  const [errors, setErrors] = useState({});
  
  // BEHAVIOR: Tracks active asynchronous server-fetch functions for query keys
  const [fetchers, setFetchers] = useState({});

  /**
   * registerQuery - Registers or updates the fetching function associated with a query key.
   */
  const registerQuery = useCallback((key, fetchFn) => {
    // BEHAVIOR: Adds fetch function to registry if it is new, preventing unnecessary renders
    setFetchers(prev => {
      if (prev[key] === fetchFn) return prev;
      return { ...prev, [key]: fetchFn };
    });
  }, []);

  /**
   * fetchQuery - Executes the registered fetching function for a key and caches the result.
   */
  const fetchQuery = useCallback(async (key, fetchFn) => {
    // BEHAVIOR: Resolves the fetch function associated with the query key
    const activeFetchFn = fetchFn || fetchers[key];
    if (!activeFetchFn) return;

    // BEHAVIOR: Set state to loading for query key
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      // BACKEND_CONNECTION: Executes asynchronous fetch request (e.g. database/API calls)
      const data = await activeFetchFn();
      // BEHAVIOR: Stores backend response data in global cache
      setCache(prev => ({ ...prev, [key]: data }));
      // BEHAVIOR: Resets errors for the query key on success
      setErrors(prev => ({ ...prev, [key]: null }));
      return data;
    } catch (err) {
      console.error(`[ServerState] Error fetching query "${key}":`, err);
      // BEHAVIOR: Caches error instance to propagate it to subscribing hooks
      setErrors(prev => ({ ...prev, [key]: err }));
      throw err;
    } finally {
      // BEHAVIOR: Clears loading indicator state
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, [fetchers]);

  /**
   * invalidateQuery - Marks a query as stale and immediately triggers a background re-fetch.
   */
  const invalidateQuery = useCallback((key) => {
    const fetchFn = fetchers[key];
    if (fetchFn) {
      // BACKEND_CONNECTION: Refetches data to synchronize local state with the backend
      fetchQuery(key, fetchFn);
    }
  }, [fetchers, fetchQuery]);

  /**
   * setQueryData - Manually updates the cached value for a query key.
   */
  const setQueryData = useCallback((key, newData) => {
    // BEHAVIOR: Overwrites cache with data directly or applies a mutation callback on previous state
    setCache(prev => {
      const updatedValue = typeof newData === 'function' ? newData(prev[key]) : newData;
      return { ...prev, [key]: updatedValue };
    });
  }, []);

  /**
   * optimisticUpdate - Updates cached state instantly and triggers server mutation.
   * Rollback is executed automatically if the mutation throws an error.
   */
  const optimisticUpdate = useCallback(async (key, optimisticValue, mutationFn) => {
    // BEHAVIOR: Remembers previous cached state for error rollback
    const previousValue = cache[key];
    
    // 1. Instantly write optimistic values to cache
    setQueryData(key, optimisticValue);
    
    try {
      // 2. Execute the asynchronous server mutation
      // BACKEND_CONNECTION: Dispatches state mutation to the server backend API
      const result = await mutationFn();
      
      // 3. Trigger a background re-fetch to ensure the UI is fully synchronized with the database
      // BACKEND_CONNECTION: Performs cache invalidation, invoking latest server sync
      invalidateQuery(key);
      return result;
    } catch (err) {
      // 4. Rollback cache to previous state on error
      console.warn(`[ServerState] Mutation failed for query "${key}". Rolling back optimistic update:`, err.message);
      // BEHAVIOR: Restores prior cached state due to mutation failure
      setCache(prev => ({ ...prev, [key]: previousValue }));
      throw err;
    }
  }, [cache, setQueryData, invalidateQuery]);

  // BEHAVIOR: Clears all cached server data, queries, and loader indicators (e.g. on logout)
  const clearCache = useCallback(() => {
    setCache({});
    setErrors({});
    setLoading({});
  }, []);

  return (
    // BEHAVIOR: Exposes server-state sync mechanisms and caches to the application tree
    <ServerStateContext.Provider value={{
      cache,
      loading,
      errors,
      registerQuery,
      fetchQuery,
      invalidateQuery,
      setQueryData,
      optimisticUpdate,
      clearCache
    }}>
      {children}
    </ServerStateContext.Provider>
  );
};

// BEHAVIOR: Custom hook to use ServerStateContext actions and states
export const useServerState = () => {
  const context = useContext(ServerStateContext);
  if (!context) {
    throw new Error("useServerState must be used within a ServerStateProvider");
  }
  return context;
};

/**
 * useServerQuery - Custom query hook resembling TanStack Query's useQuery.
 * Subscribes a component to a centralized state key and manages initial load,
 * background fetches, refetching, and invalidations.
 * 
 * @param {string} key - Unique query key identifying the cached data slice.
 * @param {Function} fetchFn - Async function returning the fetched server data.
 */
export const useServerQuery = (key, fetchFn) => {
  // BEHAVIOR: Subscribes hook instance to ServerState Context Provider
  const {
    cache,
    loading,
    errors,
    registerQuery,
    fetchQuery,
    invalidateQuery,
    setQueryData,
    optimisticUpdate
  } = useServerState();

  // Stabilize fetchFn reference with useRef to avoid infinite loops from
  // inline arrow functions re-created on every parent render.
  const fetchFnRef = React.useRef(fetchFn);
  React.useEffect(() => {
    fetchFnRef.current = fetchFn;
  });

  // Stable fetch wrapper that always uses the latest fetchFn from the ref
  const stableFetch = React.useCallback(async () => {
    // BACKEND_CONNECTION: Calls backend query through the stable reference
    return fetchFnRef.current();
  }, []); // empty deps — this function never changes reference

  // Register the stable fetch function once only
  React.useEffect(() => {
    registerQuery(key, stableFetch);
  }, [key, stableFetch, registerQuery]);

  // Fetch on component mount to keep cache fresh (stale-while-revalidate)
  React.useEffect(() => {
    // BACKEND_CONNECTION: Executes call on mount
    fetchQuery(key, stableFetch).catch(() => {});
  }, [key, stableFetch, fetchQuery]);

  return {
    // BEHAVIOR: The cached data segment
    data: cache[key],
    // BEHAVIOR: True if cache is empty and query is loading data initially
    isLoading: loading[key] || (cache[key] === undefined && !errors[key]),
    // BEHAVIOR: True if query is fetching in the background
    isFetching: loading[key],
    // BEHAVIOR: Error object if query failed
    error: errors[key],
    // BACKEND_CONNECTION: Manual trigger to invoke query re-fetch from the backend
    refetch: () => fetchQuery(key, stableFetch),
    // BEHAVIOR: Manual cache state mutator
    setData: (newData) => setQueryData(key, newData),
    // BACKEND_CONNECTION: Manual trigger to execute an optimistic mutation
    optimisticMutate: (optimisticData, mutationFn) => optimisticUpdate(key, optimisticData, mutationFn),
    // BACKEND_CONNECTION: Manual trigger to mark query as dirty and force backend reload
    invalidate: () => invalidateQuery(key)
  };
};
