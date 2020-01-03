#!/usr/bin/env node

import program from '@expo/commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { Mode, Platform } from './constants';
import configureAndroidSplashScreen from './configureAndroidSplashScreen';
import configureIosSplashScreen from './configureIosSplashScreen';

type Command = program.Command & {
  mode: Mode;
  platform: Platform;
};

async function action(imagePath: string, command: Command) {
  switch (command.platform) {
    case Platform.ANDROID:
      await configureAndroidSplashScreen(imagePath, command.mode);
      break;
    case Platform.IOS:
      await configureIosSplashScreen(imagePath, command.mode);
      break;
    case Platform.ALL:
    default:
      await configureAndroidSplashScreen(imagePath, command.mode);
      await configureIosSplashScreen(imagePath, command.mode);
      break;
  }
}

function getAvailableOptions(o: object) {
  return Object.values(o)
    .map(v => chalk.dim.cyan(v))
    .join(' | ');
}

/**
 * Ensures following requirements are met:
 * - imagePath points to a valid .png file
 * - Mode.NATIVE is selected only with Platform.ANDROID
 */
async function ensureValidConfiguration(imagePathString: string, command: Command) {
  // check for `native` mode being selected only for `android` platform
  if (command.mode === Mode.NATIVE && command.platform !== Platform.ANDROID) {
    console.log(
      chalk.red(
        `\nInvalid ${chalk.magenta('platform')} ${chalk.yellow(
          command.platform
        )} selected for ${chalk.magenta('mode')} ${chalk.yellow(
          command.mode
        )}. See below for the valid options configuration.\n`
      )
    );
    program.help();
  }

  const imagePath = path.resolve(imagePathString);

  // check if `imagePath` exists
  if (!(await fs.pathExists(imagePath))) {
    chalk.red(
      `\nNo such file ${chalk.yellow(imagePathString)}. Provide path to a valid .png file.\n`
    );
    program.help();
  }

  // check if `imagePath` is a readable .png file
  if (path.extname(imagePath) !== '.png') {
    console.log(
      chalk.red(
        `\nProvided ${chalk.yellow(
          imagePathString
        )} file is not a .png file. Provide path to a valid .png file.\n`
      )
    );
    program.help();
  }
}

async function runAsync() {
  program
    .arguments('<imagePath>')
    .option(
      '-m, --mode [mode]',
      `Mode to be used for native splash screen image. Available values: ${getAvailableOptions(
        Mode
      )} (${chalk.yellow.dim(`only available for ${chalk.cyan.dim('android')} platform)`)}).`,
      userInput => {
        if (!Object.values(Mode).includes(userInput)) {
          console.log(
            chalk.red(
              `\nUnknown value ${chalk.yellow(userInput)} for option ${chalk.magenta(
                'mode'
              )}. See below for the available values for this option.\n`
            )
          );
          program.help();
        }
        return userInput;
      },
      Mode.CONTAIN
    )
    .option(
      '-p, --platform [platform]',
      `Selected platform to configure. Available values: ${getAvailableOptions(Platform)}.`,
      userInput => {
        if (!Object.values(Platform).includes(userInput)) {
          console.log(
            chalk.red(
              `\nUnknown value ${chalk.yellow(userInput)} for option ${chalk.magenta(
                'platform'
              )}. See below for the available values for this option.\n`
            )
          );
          program.help();
        }
        return userInput;
      },
      Platform.ALL
    )
    .allowUnknownOption(false)
    .description(
      'Idempotent operation that configures native splash screens using passed .png file that would be used in native splash screen.',
      { imagePath: `(${chalk.dim.yellow('required')}) Path to a valid .png image.` }
    )
    .asyncAction(async (imagePath: string, command: Command) => {
      await ensureValidConfiguration(imagePath, command);
      await action(imagePath, command);
    });

  program.parse(process.argv);

  // With no argument passed command should prompt user about wrong usage
  if (program.args.length === 0) {
    console.log(
      chalk.red(
        `\nMissing argument ${chalk.yellow('imagePath')}. See below for the required arguments.\n`
      )
    );
    program.help();
  }
}

async function run() {
  await runAsync().catch(e => {
    console.error(chalk.red('Uncaught error:'), chalk.red(e.message));
    process.exit(1);
  });
}

run();
