#!/usr/bin/env tsx
import { Command } from 'commander';
import { runQuantumPipeline } from './pipeline';

const program = new Command();
program.name('quantum-zkp').description('Run quantum ZKP pipeline');

program
  .command('run')
  .argument('<input>', 'String input')
  .action(async (input: string) => {
    const result = await runQuantumPipeline(new TextEncoder().encode(input));
    console.log(JSON.stringify(result, null, 2));
  });

program.parse();