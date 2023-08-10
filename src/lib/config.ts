import { Effect, pipe } from 'effect';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { z } from 'zod';

const readFileAsString = (filepath: string) =>
  pipe(filepath, readFile).then((buffer) => buffer.toString());

const ConfigSchema = z.object({
  applications: z.object({
    apis: z
      .array(
        z
          .object({
            name: z.string(),
            identifier: z.string(),
            scopes: z.array(z.object({ value: z.string(), description: z.string() })),
          })
          .passthrough(),
      )
      .optional(),
    clients: z
      .array(
        z
          .object({
            name: z.string(),
            description: z.string().optional(),
            app_type: z.enum(['native', 'spa', 'regular_web', 'non_interactive']),
          })
          .passthrough(),
      )
      .optional(),
    roles: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
          permissions: z.array(
            z.object({ resource_server_identifier: z.string(), permission_name: z.string() }),
          ),
        }),
      )
      .optional(),
  }),
});

export const parseConfig = (
  _content: string,
  type: 'json' | 'yaml',
): Effect.Effect<never, z.ZodError<z.infer<typeof ConfigSchema>>, z.infer<typeof ConfigSchema>> => {
  let content;
  switch (type) {
    case 'json':
      content = JSON.parse(_content);
      break;
    case 'yaml':
      content = parse(_content);
      break;
  }
  const result = ConfigSchema.safeParse(content);
  if (!result.success) return Effect.fail(result.error);
  return Effect.succeed(result.data);
};

export const parseConfigFromFile = (filepath: string, type: 'json' | 'yaml') =>
  Effect.logInfo(`Reading configuration from file at ${filepath}`).pipe(
    () =>
      Effect.tryPromise({
        try: () => pipe(filepath, readFileAsString),
        catch: (unknown) => new Error(`Failed to read file at ${filepath}: ${unknown}`),
      }),
    Effect.flatMap((content) =>
      Effect.logInfo(`Parsing ${type} configuration`).pipe(() => parseConfig(content, type)),
    ),
  );
