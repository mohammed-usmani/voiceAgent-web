"use client";

import { createContext, useContext } from "react";

/** Set on Today when the activity feed is a drawer (below xl): opens it. Null otherwise. */
export const ActivityToggle = createContext<(() => void) | null>(null);

export const useActivityToggle = () => useContext(ActivityToggle);
