"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const constants_1 = require("./constants");
const DRAWABLES_CONFIGS = {
    drawable: {
        multiplier: 1,
    },
    'drawable-mdpi': {
        multiplier: 1,
    },
    'drawable-hdpi': {
        multiplier: 1.5,
    },
    'drawable-xhdpi': {
        multiplier: 2,
    },
    'drawable-xxhdpi': {
        multiplier: 3,
    },
    'drawable-xxxhdpi': {
        multiplier: 4,
    },
};
const SPLASH_SCREEN_DRAWABLE_FILENAME = 'splash_screen_image.png';
const SPLASH_SCREEN_XML_FILENAME = 'splash_screen.xml';
/**
 * Modifies file's content if either `replacePattern` or `insertPattern` matches.
 * If `replacePatten` matches `replaceContent` is used, otherwise if `insertPattern` matches `insertContent` is used.
 * @returns `true` if the file's content is changes, `false` otherwise.
 */
async function replaceOrInsertInFile(filePath, { replaceContent, replacePattern, insertContent, insertPattern, }) {
    return (replaceInFile(filePath, { replaceContent, replacePattern }) ||
        insertToFile(filePath, { insertContent, insertPattern }));
}
/**
 * Tries to do following actions:
 * - when file doesn't exist - create it with given fileContent,
 * - when file does exist and contains provided replacePattern - replace replacePattern with replaceContent,
 * - when file does exist and doesn't contain provided replacePattern - insert given insertContent before first match of insertPattern,
 * - when insertPattern does not occur in the file - append insertContent to the end of the file.
 */
async function writeOrReplaceOrInsertInFile(filePath, { fileContent, replaceContent, replacePattern, insertContent, insertPattern, }) {
    if (!(await fs_extra_1.default.pathExists(filePath))) {
        return await writeToFile(filePath, fileContent);
    }
    if (await replaceOrInsertInFile(filePath, {
        replaceContent,
        replacePattern,
        insertContent,
        insertPattern,
    })) {
        return;
    }
    const originalFileContent = await fs_extra_1.default.readFile(filePath, 'utf8');
    return await fs_extra_1.default.writeFile(filePath, `${originalFileContent}${insertPattern}`);
}
/**
 * Overrides or creates file (with possibly missing directories) with given content.
 */
async function writeToFile(filePath, fileContent) {
    const fileDirnamePath = path_1.default.dirname(filePath);
    if (!(await fs_extra_1.default.pathExists(fileDirnamePath))) {
        await fs_extra_1.default.mkdirp(fileDirnamePath);
    }
    return await fs_extra_1.default.writeFile(filePath, fileContent);
}
/**
 * @returns `true` if replacement is successful, `false` otherwise.
 */
async function replaceInFile(filePath, { replaceContent, replacePattern }) {
    const originalFileContent = await fs_extra_1.default.readFile(filePath, 'utf8');
    const replacePatternOccurrence = originalFileContent.search(replacePattern);
    if (replacePatternOccurrence !== -1) {
        await fs_extra_1.default.writeFile(filePath, originalFileContent.replace(replacePattern, replaceContent));
        return true;
    }
    return false;
}
/**
 * @returns `true` if insertion is successful, `false` otherwise.
 */
async function insertToFile(filePath, { insertContent, insertPattern }) {
    const originalFileContent = await fs_extra_1.default.readFile(filePath, 'utf8');
    const insertPatternOccurrence = originalFileContent.search(insertPattern);
    if (insertPatternOccurrence !== -1) {
        await fs_extra_1.default.writeFile(filePath, `${originalFileContent.slice(0, insertPatternOccurrence)}${insertContent}${originalFileContent.slice(insertPatternOccurrence)}`);
        return true;
    }
    return false;
}
/**
 * Deletes all previous splash_screen_images and copies new one to desired drawable directory.
 * @see https://developer.android.com/training/multiscreen/screendensities
 */
async function configureSplashScreenDrawables(androidMainResPath, splashScreenImagePath) {
    Promise.all(Object.keys(DRAWABLES_CONFIGS)
        .map(drawableDirectoryName => path_1.default.resolve(androidMainResPath, drawableDirectoryName, SPLASH_SCREEN_DRAWABLE_FILENAME))
        .map(async (drawablePath) => {
        if (await fs_extra_1.default.pathExists(drawablePath)) {
            await fs_extra_1.default.remove(drawablePath);
        }
    }));
    await fs_extra_1.default.mkdir(path_1.default.resolve(androidMainResPath, 'drawable'));
    await fs_extra_1.default.copyFile(splashScreenImagePath, path_1.default.resolve(androidMainResPath, 'drawable', SPLASH_SCREEN_DRAWABLE_FILENAME));
}
/**
 * Configures or creates splash screen's:
 * - background color in colors.xml
 * - xml drawable file
 * - style with theme including 'android:windowBackground' in styles.xml
 * - theme for activity in AndroidManifest.xml
 */
async function configureSplashScreenXML(androidMainPath, mode, splashScreenBackgroundColor) {
    const androidMainResPath = path_1.default.resolve(androidMainPath, 'res');
    // colors.xml
    // TODO: maybe it's possible to move it to separate fully-controlled-by-this-script file?
    await writeOrReplaceOrInsertInFile(path_1.default.resolve(androidMainResPath, 'values', 'colors.xml'), {
        fileContent: `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="splashScreenBackgroundColor">${splashScreenBackgroundColor}</color> <!-- HANDLED BY \'expo-splash-screen\' COMMAND -->'
</resources>
`,
        replaceContent: `  <color name="splashScreenBackgroundColor">${splashScreenBackgroundColor}</color> <!-- HANDLED BY 'expo-splash-screen' COMMAND -->
`,
        replacePattern: /^(.*?)<color name="splashScreenBackgroundColor">(.+?)<\/color>(.*?)$/m,
        insertContent: `  <color name="splashScreenBackgroundColor">${splashScreenBackgroundColor}</color> <!-- HANDLED BY 'expo-splash-screen' COMMAND -->
`,
        insertPattern: /^(.*?)<\/resources>(.*?)$/m,
    });
    // xml drawable file
    const nativeSplashScreen = mode !== constants_1.Mode.NATIVE
        ? ''
        : `
  <item>
    <bitmap
      android:gravity="center"
      android:src="@drawable/splash_screen_image"
    />
  </item>
`;
    await writeToFile(path_1.default.resolve(androidMainResPath, 'drawable', SPLASH_SCREEN_XML_FILENAME), `<?xml version="1.0" encoding="utf-8"?>
<!--

    THIS FILE IS CREATED BY 'expo-splash-screen' COMMAND

-->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashScreenBackgroundColor"/>${nativeSplashScreen}
</layer-list>
`);
    // styles.xml
    // TODO: separate file
    await writeOrReplaceOrInsertInFile(path_1.default.resolve(androidMainResPath, 'values', 'styles.xml'), {
        fileContent: `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <style name="Theme.App.SplashScreen" parent="Theme.AppCompat.Light.NoActionBar>
    <item name="android:windowBackground">@drawable/splash_screen</item>
  </style>
</resources>
`,
        replaceContent: `    <item name="android:windowBackground">@drawable/splash_screen</item> <!-- HANDLED BY 'expo-splash-screen' COMMAND -->`,
        replacePattern: /(?<=(?<styleNameLine>^.*?(?<styleName><style name="Theme\.App\.SplashScreen" parent=".*?">).*?$\n)(?<linesBeforeWindowBackgroundLine>(?<singleBeforeLine>^.*$\n)*?))(?<windowBackgroundLine>^.*?(?<windowBackground><item name="android:windowBackground">.*<\/item>).*$\n)(?=(?<linesAfterWindowBackgroundLine>(?<singleAfterLine>^.*$\n)*?)(?<closingTagLine>^.*?<\/style>.*?$\n))/m,
        insertContent: `  <style name="Theme.App.SplashScreen" parent="Theme.AppCompat.Light.NoActionBar">
    <item name="android:windowBackground">@drawable/splash_screen</item>
  </style>
`,
        insertPattern: /^(.*?)<\/resources>(.*?)$/m,
    });
    // AndroidManifest.xml
    // TODO: assumption that MainActivity is entry point
    if (!(await replaceOrInsertInFile(path_1.default.resolve(androidMainPath, 'AndroidManifest.xml'), {
        replaceContent: `\n    android:theme="@style/Theme.App.Splash" <!-- HANDLED BY 'expo-splash-screen' COMMAND -->\n`,
        replacePattern: /(?<=(?<applicationPart>^.*?<application(.*|\n)*?)(?<activity>^.*?<activity(.|\n)*?android:name="\.MainActivity"(.|\n)*?))(?<androidTheme>\s*?android:theme=".*?"\s*)/m,
        insertContent: `\n    android:theme="@style/Theme.App.Splash" <!-- HANDLED BY 'expo-splash-screen' COMMAND -->\n`,
        insertPattern: /(?<=(?<applicationPart>^.*?<application(.*|\n)*?)(?<activity>^.*?<activity(.|\n)*?android:name="\.MainActivity"(.|\n)*?))(?<insertMatch>>)/m,
    }))) {
        console.log(chalk_1.default.yellow(`${chalk_1.default.magenta('AndroidManifest.xml')} does not contain <activity /> entry for ${chalk_1.default.magenta('MainActivity')}. SplashScreen style will not be applied.`));
    }
}
/**
 * Injects specific code to MainApplication that would trigger SplashScreen.
 * TODO: make it work
 */
async function configureShowingSplashScreen(projectRootPath) {
    // const mainAndroidFilePath = projectConfig(projectRootPath)?.mainFilePath;
}
async function configureAndroidSplashScreen(imagePath, mode) {
    const splashScreenBackgroundColor = `#FFFFFF`;
    const projectRootPath = path_1.default.resolve();
    const androidMainPath = path_1.default.resolve(projectRootPath, 'android/app/src/main');
    return Promise.all([
        await configureSplashScreenDrawables(path_1.default.resolve(androidMainPath, 'res'), imagePath),
        await configureSplashScreenXML(androidMainPath, mode, splashScreenBackgroundColor),
        await configureShowingSplashScreen(projectRootPath),
    ]).then(() => { });
}
exports.default = configureAndroidSplashScreen;
//# sourceMappingURL=configureAndroidSplashScreen.js.map