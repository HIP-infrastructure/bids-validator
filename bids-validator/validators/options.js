// ESM import for yargs does not work for mysterious reasons
const yargs = require('yargs')

export function parseOptions(argumentOverride) {
  return yargs(argumentOverride)
    .usage('Usage: $0 <dataset_directory> [options]')
    .help('help')
    .alias('help', 'h')
    .version(require('../package.json').version)
    .alias('version', 'v')
    .demand(1, 1)
    .boolean('ignoreWarnings')
    .describe('ignoreWarnings', 'Disregard non-critical issues')
    .boolean('ignoreNiftiHeaders')
    .describe(
      'ignoreNiftiHeaders',
      'Disregard NIfTI header content during validation',
    )
    .boolean('ignoreSubjectConsistency')
    .describe(
      'ignoreSubjectConsistency',
      'Skip checking that any given file for one subject is present for all other subjects.',
    )
    .option('blacklistModalities', {
      default: [],
      describe: 'Array of modalities to error on if detected.',
      array: true,
      choices: ['MRI', 'PET', 'MEG', 'EEG', 'iEEG', 'Microscopy', 'NIRS'],
    })
    .boolean('verbose')
    .describe('verbose', 'Log more extensive information about issues')
    .boolean('json')
    .describe('json', 'Output results as JSON')
    .boolean('no-color')
    .describe('no-color', 'Disable colors in output text.')
    .default('no-color', false)
    .boolean('ignoreSymlinks')
    .describe(
      'ignoreSymlinks',
      'Skip any symlinked directories when validating a dataset',
    )
    .boolean('remoteFiles')
    .describe('remoteFiles', 'Validate remote files.')
    .default('remoteFiles', false)
    .boolean('gitTreeMode')
    .describe(
      'gitTreeMode',
      'Improve performance using git metadata. Does not capture changes not known to git.',
    )
    .option('gitRef', {
      describe:
        'Targets files at a given branch, tag, or commit hash. Use with --gitTreeMode.  [default: "HEAD"]',
      type: 'string',
    })
    .implies('gitRef', 'gitTreeMode')
    .option('config', {
      alias: 'c',
      describe:
        'Optional configuration file. See https://github.com/bids-standard/bids-validator for more info',
      default: '.bids-validator-config.json',
    })
    .boolean('filenames')
    .default('filenames', false)
    .describe(
      'filenames',
      'A less accurate check that reads filenames one per line from stdin.',
    )
    .hide('filenames')
    .option('schema', {
      alias: 's',
      describe:
        'BIDS specification schema version to use for validation, e.g. "v1.6.0" (beta)',
      default: 'disable',
      choices: ['disable', 'v1.6.0', 'master'],
    })
    .epilogue(
      'This tool checks if a dataset in a given directory is \
compatible with the Brain Imaging Data Structure specification. To learn \
more about Brain Imaging Data Structure visit http://bids.neuroimaging.io',
    ).argv
}
