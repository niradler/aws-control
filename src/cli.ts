#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

yargs(hideBin(process.argv))
    .options({
        region: { type: "string", default: "us-east-1" },
        profile: { type: "string", default: "default" },
        output: { type: "string", default: "log" },
    })
    .commandDir('commands')
    .strict()
    .alias({ h: 'help' })
    .argv;