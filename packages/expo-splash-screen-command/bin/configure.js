#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("@expo/commander"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const configureAndroidSplashScreen_1 = __importDefault(require("./configureAndroidSplashScreen"));
const configureIosSplashScreen_1 = __importDefault(require("./configureIosSplashScreen"));
async function action(imagePath, command) {
    switch (command.platform) {
        case constants_1.Platform.ANDROID:
            await configureAndroidSplashScreen_1.default(imagePath, command.mode);
            break;
        case constants_1.Platform.IOS:
            await configureIosSplashScreen_1.default(imagePath, command.mode);
            break;
        case constants_1.Platform.ALL:
        default:
            await configureAndroidSplashScreen_1.default(imagePath, command.mode);
            await configureIosSplashScreen_1.default(imagePath, command.mode);
            break;
    }
}
function getAvailableOptions(o) {
    return Object.values(o)
        .map(v => chalk_1.default.dim.cyan(v))
        .join(' | ');
}
/**
 * Ensures following requirements are met:
 * - imagePath points to a valid .png file
 * - Mode.NATIVE is selected only with Platform.ANDROID
 */
async function ensureValidConfiguration(imagePathString, command) {
    // check for `native` mode being selected only for `android` platform
    if (command.mode === constants_1.Mode.NATIVE && command.platform !== constants_1.Platform.ANDROID) {
        console.log(chalk_1.default.red(`\nInvalid ${chalk_1.default.magenta('platform')} ${chalk_1.default.yellow(command.platform)} selected for ${chalk_1.default.magenta('mode')} ${chalk_1.default.yellow(command.mode)}. See below for the valid options configuration.\n`));
        commander_1.default.help();
    }
    const imagePath = path_1.default.resolve(imagePathString);
    // check if `imagePath` exists
    if (!(await fs_extra_1.default.pathExists(imagePath))) {
        chalk_1.default.red(`\nNo such file ${chalk_1.default.yellow(imagePathString)}. Provide path to a valid .png file.\n`);
        commander_1.default.help();
    }
    // check if `imagePath` is a readable .png file
    if (path_1.default.extname(imagePath) !== '.png') {
        console.log(chalk_1.default.red(`\nProvided ${chalk_1.default.yellow(imagePathString)} file is not a .png file. Provide path to a valid .png file.\n`));
        commander_1.default.help();
    }
}
async function runAsync() {
    commander_1.default
        .arguments('<imagePath>')
        .option('-m, --mode [mode]', `Mode to be used for native splash screen image. Available values: ${getAvailableOptions(constants_1.Mode)} (${chalk_1.default.yellow.dim(`only available for ${chalk_1.default.cyan.dim('android')} platform)`)}).`, userInput => {
        if (!Object.values(constants_1.Mode).includes(userInput)) {
            console.log(chalk_1.default.red(`\nUnknown value ${chalk_1.default.yellow(userInput)} for option ${chalk_1.default.magenta('mode')}. See below for the available values for this option.\n`));
            commander_1.default.help();
        }
        return userInput;
    }, constants_1.Mode.CONTAIN)
        .option('-p, --platform [platform]', `Selected platform to configure. Available values: ${getAvailableOptions(constants_1.Platform)}.`, userInput => {
        if (!Object.values(constants_1.Platform).includes(userInput)) {
            console.log(chalk_1.default.red(`\nUnknown value ${chalk_1.default.yellow(userInput)} for option ${chalk_1.default.magenta('platform')}. See below for the available values for this option.\n`));
            commander_1.default.help();
        }
        return userInput;
    }, constants_1.Platform.ALL)
        .allowUnknownOption(false)
        .description('Idempotent operation that configures native splash screens using passed .png file that would be used in native splash screen.', { imagePath: `(${chalk_1.default.dim.yellow('required')}) Path to a valid .png image.` })
        .asyncAction(async (imagePath, command) => {
        await ensureValidConfiguration(imagePath, command);
        await action(imagePath, command);
    });
    commander_1.default.parse(process.argv);
    // With no argument passed command should prompt user about wrong usage
    if (commander_1.default.args.length === 0) {
        console.log(chalk_1.default.red(`\nMissing argument ${chalk_1.default.yellow('imagePath')}. See below for the required arguments.\n`));
        commander_1.default.help();
    }
}
async function run() {
    await runAsync().catch(e => {
        console.error(chalk_1.default.red('Uncaught error:'), chalk_1.default.red(e.message));
        process.exit(1);
    });
}
run();
//# sourceMappingURL=configure.js.map