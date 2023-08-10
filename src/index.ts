import { Effect } from 'effect';

import { bootstrap, destroy } from '@/actions';
import { parseArgs } from '@/lib/cli';

const main = Effect.gen(function* (_) {
  const args = parseArgs();

  if (args.help || args._.length === 0) {
    console.log("Available commands are 'bootstrap' and 'destroy'");
    return;
  }

  switch (args._[0]) {
    case 'bootstrap':
      yield* _(Effect.logInfo('Start bootstrap'));
      yield* _(bootstrap);
      yield* _(Effect.logInfo('Done bootstrap'));
      break;
    case 'destroy':
      yield* _(Effect.logInfo('Start destroy'));
      yield* _(destroy);
      yield* _(Effect.logInfo('Done destroy'));
      break;
    default:
      console.log(`Command '${args._[0]}' is not supported`);
      console.log("Available commands are 'bootstrap' and 'destroy'");
  }
});

Effect.runPromise(main);
