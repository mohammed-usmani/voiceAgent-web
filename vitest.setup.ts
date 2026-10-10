import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { afterEach } from "vitest";

// Animations finish instantly in tests: an exit animation running longer than a query's
// timeout made AnimatePresence swaps flaky.
MotionGlobalConfig.skipAnimations = true;

afterEach(() => cleanup());
