// Rule barrel — re-export all rule functions for use in index.ts.
// Add new rule files here as you implement them.
export { detectInjectionPatterns } from "./injection.js";
export { detectInsecureAPIs } from "./insecure-apis.js";
