"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { readHashState, writeHashState } from "@/lib/hash";

export function HashSync() {
  const loaded = useRef(false);
  const prompt = useApp((s) => s.prompt);
  const pastedCode = useApp((s) => s.pastedCode);
  const projectContext = useApp((s) => s.projectContext);
  const taskType = useApp((s) => s.taskType);
  const loadFromHash = useApp((s) => s.loadFromHash);

  // On mount: read hash and populate store
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const state = readHashState();
    if (state && (state.p || state.c || state.x || state.t)) {
      loadFromHash(state.p, state.c, state.x, state.t);
    }
  }, [loadFromHash]);

  // On form state change: write hash
  useEffect(() => {
    if (!loaded.current) return;
    writeHashState({ p: prompt, c: pastedCode, x: projectContext, t: taskType });
  }, [prompt, pastedCode, projectContext, taskType]);

  return null;
}
