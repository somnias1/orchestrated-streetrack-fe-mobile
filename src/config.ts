import Constants from 'expo-constants';
import { z } from 'zod';

const schema = z.object({
  auth0Domain: z.string().min(1),
  auth0ClientId: z.string().min(1),
  auth0Audience: z.string().url(),
  apiBaseUrl: z.string().url(),
});

const result = schema.safeParse(Constants.expoConfig?.extra);

if (!result.success) {
  throw new Error(
    `[config] Invalid runtime configuration — check your .env:\n${result.error.toString()}`
  );
}

export const config = Object.freeze(result.data);
export type Config = typeof config;
