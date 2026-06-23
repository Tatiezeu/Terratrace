import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ServerStateContext = createContext();

/**
 * ServerStateProvider - Provides a centralized server-state caching and synchronization engine.
 * Emulates key features of TanStack Query (React Query) using the React Context API.
 */
export const ServerStateProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  
  // Keep track of the active fetch functions for each query key
  const [fetchers, setFetchers] = useState({});

  /**
   * registerQuery - Registers or updates the fetching function associated with a query key.
   */
  const registerQuery = useCallback((key, fetchFn) => {
    setFetchers(prev => {
      if (prev[key] === fetchFn) return prev;
      return { ...prev, [key]: fetchFn };
    });
  }, []);

  /**
   * fetchQuery - Executes the registered fetching function for a key and caches the result.
   */
  const fetchQuery = useCallback(async (key, fetchFn) => {
    const activeFetchFn = fetchFn || fetchers[key];
    if (!activeFetchFn) return;

    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const data = await activeFetchFn();
      setCache(prev => ({ ...prev, [key]: data }));
      setErrors(prev => ({ ...prev, [key]: null }));
      return data;
    } catch (err) {
      console.error(`[ServerState] Error fetching query "${key}":`, err);
      setErrors(prev => ({ ...prev, [key]: err }));
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, [fetchers]);

  /**
   * invalidateQuery - Marks a query as stale and immediately triggers a background re-fetch.
   */
  const invalidateQuery = useCallback((key) => {
    const fetchFn = fetchers[key];
    if (fetchFn) {
      fetchQuery(key, fetchFn);
    }
  }, [fetchers, fetchQuery]);

  /**
   * setQueryData - Manually updates the cached value for a query key.
   */
  const setQueryData = useCallback((key, newData) => {
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
    const previousValue = cache[key];
    
    // 1. Instantly write optimistic values to cache
    setQueryData(key, optimisticValue);
    
    try {
      // 2. Execute the asynchronous server mutation
      const result = await mutationFn();
      
      // 3. Trigger a background re-fetch to ensure the UI is fully synchronized with the database
      invalidateQuery(key);
      return result;
    } catch (err) {
      // 4. Rollback cache to previous state on error
      console.warn(`[ServerState] Mutation failed for query "${key}". Rolling back optimistic update:`, err.message);
      setCache(prev => ({ ...prev, [key]: previousValue }));
      throw err;
    }
  }, [cache, setQueryData, invalidateQuery]);

  const clearCache = useCallback(() => {
    setCache({});
    setErrors({});
    setLoading({});
  }, []);

  return (
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
    return fetchFnRef.current();
  }, []); // empty deps — this function never changes reference

  // Register the stable fetch function once only
  React.useEffect(() => {
    registerQuery(key, stableFetch);
  }, [key, stableFetch, registerQuery]);

  // Fetch on component mount to keep cache fresh (stale-while-revalidate)
  React.useEffect(() => {
    fetchQuery(key, stableFetch).catch(() => {});
  }, [key, stableFetch, fetchQuery]);

  return {
    data: cache[key],
    isLoading: loading[key] || (cache[key] === undefined && !errors[key]),
    isFetching: loading[key],
    error: errors[key],
    refetch: () => fetchQuery(key, stableFetch),
    setData: (newData) => setQueryData(key, newData),
    optimisticMutate: (optimisticData, mutationFn) => optimisticUpdate(key, optimisticData, mutationFn),
    invalidate: () => invalidateQuery(key)
  };
};

