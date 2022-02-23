import type { Arguments, CommandBuilder } from 'yargs';

type Options = {
    name: string;
    upper: boolean | undefined;
};

export const command: string = 'quotas <name>';
export const desc: string = 'quotas <name> with Hello';

export const builder: CommandBuilder<Options, Options> = (yargs) =>
    yargs
        .options({
            upper: { type: 'boolean' },
        })
        .positional('name', { type: 'string', demandOption: true });

export const handler = (argv: Arguments<Options>): void => {
    const { name, upper } = argv;
    const quotas = `Hello, ${name}!`;
    process.stdout.write(upper ? quotas.toUpperCase() : quotas);
    process.exit(0);
};