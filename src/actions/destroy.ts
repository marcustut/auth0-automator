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

  // Delete resource server
  if (config.applications.apis) {
    const resourceServers = yield* _(
      Effect.logInfo(`Fetching resource servers...`).pipe(() =>
        Effect.tryPromise({
          try: () => management.getResourceServers({}),
          catch: (unknown) => new Error(`Failed to fetch resource servers: ${unknown}`),
        }),
      ),
    );
    for (const { id, name } of resourceServers.filter(
      (server) =>
        server.name && config.applications.apis!.map((api) => api.name).includes(server.name),
    )) {
      yield* _(
        Effect.logInfo(`Deleting resource server ${name}(${id})...`).pipe(() =>
          Effect.tryPromise({
            try: () => management.deleteResourceServer({ id: id! }),
            catch: (unknown) => new Error(`Failed to delete resource server: ${unknown}`),
          }),
        ),
      );
      yield* _(Effect.logInfo(`Deleted resource server ${name}(${id})`));
    }
  }

  // Delete client
  if (config.applications.clients) {
    const clients = yield* _(
      Effect.logInfo(`Fetching clients...`).pipe(() =>
        Effect.tryPromise({
          try: () => management.getClients({}),
          catch: (unknown) => new Error(`Failed to fetch clients: ${unknown}`),
        }),
      ),
    );
    for (const { client_id, name } of clients.filter(
      (client) =>
        client.name &&
        config.applications.clients!.map((client) => client.name).includes(client.name),
    )) {
      yield* _(
        Effect.logInfo(`Deleting client ${name}(${client_id})...`).pipe(() =>
          Effect.tryPromise({
            try: () => management.deleteClient({ client_id: client_id! }),
            catch: (unknown) => new Error(`Failed to delete client: ${unknown}`),
          }),
        ),
      );
      yield* _(Effect.logInfo(`Deleted client ${name}(${client_id})`));
    }
  }

  // Delete role
  if (config.applications.roles) {
    const roles = yield* _(
      Effect.logInfo(`Fetching roles...`).pipe(() =>
        Effect.tryPromise({
          try: () => management.getRoles({}),
          catch: (unknown) => new Error(`Failed to fetch roles: ${unknown}`),
        }),
      ),
    );
    for (const { id, name } of roles.filter(
      (role) =>
        role.name && config.applications.roles!.map((role) => role.name).includes(role.name),
    )) {
      yield* _(
        Effect.logInfo(`Deleting role ${name}(${id})...`).pipe(() =>
          Effect.tryPromise({
            try: () => management.deleteRole({ id: id! }),
            catch: (unknown) => new Error(`Failed to delete role: ${unknown}`),
          }),
        ),
      );
      yield* _(Effect.logInfo(`Deleted role ${name}(${id})`));
    }
  }
});

export default bootstrap;
