"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "./api";

export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await api<T>(path);
      return { data: result, error: null };
    } catch (err) {
      return { data: null, error: errorMessage(err) };
    }
  }, [path]);

  const reload = useCallback(async () => {
    const result = await load();
    setData(result.data);
    setError(result.error);
  }, [load]);

  useEffect(() => {
    let active = true;
    load().then((result) => {
      if (!active) return;
      setData(result.data);
      setError(result.error);
    });
    return () => {
      active = false;
    };
  }, [load]);

  return { data, error, reload };
}
