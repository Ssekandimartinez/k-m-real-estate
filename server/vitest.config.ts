import { defineConfig } from 'vitest/config';
export default defineConfig({test:{include:['server/src/**/*.test.ts'],fileParallelism:false,testTimeout:20000,hookTimeout:30000}});
