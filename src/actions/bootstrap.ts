import { AuthenticationClient, ManagementClient } from 'auth0';
import { Effect } from 'effect';

import { parseConfigFromFile } from '@/lib/config';
import { parseEnv } from '@/lib/env';

const bootstrap = Effect.gen(function* (_) {
  // Load .env file
  const env = parseEnv();

  // Parse configuration from file
  const config = yield* _(
    parseConfigFromFile(
      env.CONFIG_FILE ?? 'config.yaml',
      env.CONFIG_FILE?.includes('json') ? 'json' : 'yaml',
    ),
  );

  const auth = new AuthenticationClient({
    domain: env.AUTH0_DOMAIN,
    clientId: env.AUTH0_CLIENT_ID,
    clientSecret: env.AUTH0_CLIENT_SECRET,
  });

  // Get the access token for Auth0's Management API
  const audience = `https://${env.AUTH0_DOMAIN}/api/v2/`;
  yield* _(Effect.log(`Getting client_credentials grant token for ${audience}`));
  const { access_token } = yield* _(
    Effect.tryPromise({
      try: () => auth.clientCredentialsGrant({ audience }),
      catch: (unknown) => new Error(`Failed to get client_credentials grant token: ${unknown}`),
    }),
  );
  yield* _(Effect.log(`Got client_credentials grant token`));

  const management = new ManagementClient({ domain: env.AUTH0_DOMAIN, token: access_token });

  // Create resource server
  if (config.applications.apis)
    for (const api of config.applications.apis) {
      const resourceServer = yield* _(
        Effect.logInfo(`Creating resource server ${JSON.stringify(api, null, 2)}...`).pipe(() =>
          Effect.tryPromise({
            try: () => management.createResourceServer(api),
            catch: (unknown) => new Error(`Failed to create resource server: ${unknown}`),
          }),
        ),
      );
      yield* _(
        Effect.logInfo(`Created resource server ${resourceServer.name}(${resourceServer.id})`),
      );
    }

  // Create client
  if (config.applications.clients)
    for (const client of config.applications.clients) {
      const createdClient = yield* _(
        Effect.logInfo(`Creating client ${JSON.stringify(client, null, 2)}...`).pipe(() =>
          Effect.tryPromise({
            try: () => management.createClient(client),
            catch: (unknown) => new Error(`Failed to create client: ${unknown}`),
          }),
        ),
      );
      yield* _(Effect.logInfo(`Created client ${createdClient.name}(${createdClient.client_id})`));
    }

  // Create role
  if (config.applications.roles)
    for (const { name, description, permissions } of config.applications.roles) {
      const createdRole = yield* _(
        Effect.logInfo(`Creating role ${name}...`).pipe(() =>
          Effect.tryPromise({
            try: async () => {
              const role = await management.createRole({ name, description });
              await management.addPermissionsInRole({ id: role.id! }, { permissions });
              return role;
            },
            catch: (unknown) => new Error(`Failed to create role: ${unknown}`),
          }),
        ),
      );
      yield* _(Effect.logInfo(`Created role ${createdRole.name}(${createdRole.id})`));
    }
});

export default bootstrap;
