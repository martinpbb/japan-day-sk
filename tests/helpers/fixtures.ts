import { test as base } from "@playwright/test";
import { collectRuntime, type RuntimeReport } from "./network";

export const test = base.extend<{ runtime: RuntimeReport }>({
  runtime: async ({ page }, use) => { const report = collectRuntime(page); await use(report); },
});
export { expect } from "@playwright/test";
