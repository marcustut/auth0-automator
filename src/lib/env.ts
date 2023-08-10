import { load } from 'ts-dotenv';

export const parseEnv = () =>
  load({
    AUTH0_DOMAIN: String,
    AUTH0_CLIENT_ID: String,
    AUTH0_CLIENT_SECRET: String,
    CONFIG_FILE: { type: String, optional: true },
  });
