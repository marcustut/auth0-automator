import parse from 'minimist';
import { z } from 'zod';

const ArgsSchema = z.object({
  _: z.array(z.string()),
  help: z.literal(true).optional(),
});

export const parseArgs = () => ArgsSchema.parse(parse(process.argv.slice(2)));
