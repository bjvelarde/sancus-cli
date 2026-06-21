#!/usr/bin/env node
import { runPluginCommand } from './commands/plugin.js';

const [,, command, ...rest] = process.argv;

async function main(): Promise<void> {
  switch (command) {
    case 'plugin':
      await runPluginCommand(rest);
      break;
    default:
      console.log('Sancus CLI — Security Code Scanner');
      console.log('');
      console.log('Usage: sancus <command> [options]');
      console.log('');
      console.log('Commands:');
      console.log('  plugin    Manage installed plugins');
      console.log('');
      console.log('Run `sancus plugin --help` for plugin commands.');
      break;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
