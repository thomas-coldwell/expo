import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { projectConfig } from '@react-native-community/cli-platform-android';

import { Mode } from './constants';

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
async function replaceOrInsertInFile(
  filePath: string,
  {
    replaceContent,
    replacePattern,
    insertContent,
    insertPattern,
  }: {
    replaceContent: string;
    replacePattern: RegExp | string;
    insertContent: string;
    insertPattern: RegExp | string;
  }
): Promise<boolean> {
  return (
    replaceInFile(filePath, { replaceContent, replacePattern }) ||
    insertToFile(filePath, { insertContent, insertPattern })
  );
}

/**
 * Tries to do following actions:
 * - when file doesn't exist - create it with given fileContent,
 * - when file does exist and contains provided replacePattern - replace replacePattern with replaceContent,
 * - when file does exist and doesn't contain provided replacePattern - insert given insertContent before first match of insertPattern,
 * - when insertPattern does not occur in the file - append insertContent to the end of the file.
 */
async function writeOrReplaceOrInsertInFile(
  filePath: string,
  {
    fileContent,
    replaceContent,
    replacePattern,
    insertContent,
    insertPattern,
  }: {
    fileContent: string;
    replaceContent: string;
    replacePattern: RegExp | string;
    insertContent: string;
    insertPattern: RegExp | string;
  }
) {
  if (!(await fs.pathExists(filePath))) {
    return await writeToFile(filePath, fileContent);
  }

  if (
    await replaceOrInsertInFile(filePath, {
      replaceContent,
      replacePattern,
      insertContent,
      insertPattern,
    })
  ) {
    return;
  }

  const originalFileContent = await fs.readFile(filePath, 'utf8');
  return await fs.writeFile(filePath, `${originalFileContent}${insertPattern}`);
}

/**
 * Overrides or creates file (with possibly missing directories) with given content.
 */
async function writeToFile(filePath: string, fileContent: string) {
  const fileDirnamePath = path.dirname(filePath);
  if (!(await fs.pathExists(fileDirnamePath))) {
    await fs.mkdirp(fileDirnamePath);
  }
  return await fs.writeFile(filePath, fileContent);
}

/**
 * @returns `true` if replacement is successful, `false` otherwise.
 */
async function replaceInFile(
  filePath: string,
  { replaceContent, replacePattern }: { replaceContent: string; replacePattern: string | RegExp }
) {
  const originalFileContent = await fs.readFile(filePath, 'utf8');

  const replacePatternOccurrence = originalFileContent.search(replacePattern);
  if (replacePatternOccurrence !== -1) {
    await fs.writeFile(filePath, originalFileContent.replace(replacePattern, replaceContent));
    return true;
  }
  return false;
}

/**
 * @returns `true` if insertion is successful, `false` otherwise.
 */
async function insertToFile(
  filePath: string,
  { insertContent, insertPattern }: { insertContent: string; insertPattern: RegExp | string }
) {
  const originalFileContent = await fs.readFile(filePath, 'utf8');
  const insertPatternOccurrence = originalFileContent.search(insertPattern);
  if (insertPatternOccurrence !== -1) {
    await fs.writeFile(
      filePath,
      `${originalFileContent.slice(
        0,
        insertPatternOccurrence
      )}${insertContent}${originalFileContent.slice(insertPatternOccurrence)}`
    );
    return true;
  }
  return false;
}

/**
 * Deletes all previous splash_screen_images and copies new one to desired drawable directory.
 * @see https://developer.android.com/training/multiscreen/screendensities
 */
async function configureSplashScreenDrawables(
  androidMainResPath: string,
  splashScreenImagePath: string
) {
  Promise.all(
    Object.keys(DRAWABLES_CONFIGS)
      .map(drawableDirectoryName =>
        path.resolve(androidMainResPath, drawableDirectoryName, SPLASH_SCREEN_DRAWABLE_FILENAME)
      )
      .map(async drawablePath => {
        if (await fs.pathExists(drawablePath)) {
          await fs.remove(drawablePath);
        }
      })
  );

  await fs.mkdir(path.resolve(androidMainResPath, 'drawable'));
  await fs.copyFile(
    splashScreenImagePath,
    path.resolve(androidMainResPath, 'drawable', SPLASH_SCREEN_DRAWABLE_FILENAME)
  );
}

/**
 * Configures or creates splash screen's:
 * - background color in colors.xml
 * - xml drawable file
 * - style with theme including 'android:windowBackground' in styles.xml
 * - theme for activity in AndroidManifest.xml
 */
async function configureSplashScreenXML(
  androidMainPath: string,
  mode: Mode,
  splashScreenBackgroundColor: string
) {
  const androidMainResPath = path.resolve(androidMainPath, 'res');

  // colors.xml
  // TODO: maybe it's possible to move it to separate fully-controlled-by-this-script file?
  await writeOrReplaceOrInsertInFile(path.resolve(androidMainResPath, 'values', 'colors.xml'), {
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
  const nativeSplashScreen: string =
    mode !== Mode.NATIVE
      ? ''
      : `
  <item>
    <bitmap
      android:gravity="center"
      android:src="@drawable/splash_screen_image"
    />
  </item>
`;

  await writeToFile(
    path.resolve(androidMainResPath, 'drawable', SPLASH_SCREEN_XML_FILENAME),
    `<?xml version="1.0" encoding="utf-8"?>
<!--

    THIS FILE IS CREATED BY 'expo-splash-screen' COMMAND

-->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashScreenBackgroundColor"/>${nativeSplashScreen}
</layer-list>
`
  );

  // styles.xml
  // TODO: separate file
  await writeOrReplaceOrInsertInFile(path.resolve(androidMainResPath, 'values', 'styles.xml'), {
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
  if (
    !(await replaceOrInsertInFile(path.resolve(androidMainPath, 'AndroidManifest.xml'), {
      replaceContent: `\n    android:theme="@style/Theme.App.Splash" <!-- HANDLED BY 'expo-splash-screen' COMMAND -->\n`,
      replacePattern: /(?<=(?<applicationPart>^.*?<application(.*|\n)*?)(?<activity>^.*?<activity(.|\n)*?android:name="\.MainActivity"(.|\n)*?))(?<androidTheme>\s*?android:theme=".*?"\s*)/m,

      insertContent: `\n    android:theme="@style/Theme.App.Splash" <!-- HANDLED BY 'expo-splash-screen' COMMAND -->\n`,
      insertPattern: /(?<=(?<applicationPart>^.*?<application(.*|\n)*?)(?<activity>^.*?<activity(.|\n)*?android:name="\.MainActivity"(.|\n)*?))(?<insertMatch>>)/m,
    }))
  ) {
    console.log(
      chalk.yellow(
        `${chalk.magenta(
          'AndroidManifest.xml'
        )} does not contain <activity /> entry for ${chalk.magenta(
          'MainActivity'
        )}. SplashScreen style will not be applied.`
      )
    );
  }
}

/**
 * Injects specific code to MainApplication that would trigger SplashScreen.
 * TODO: make it work
 */
async function configureShowingSplashScreen(projectRootPath: string) {
  // const mainAndroidFilePath = projectConfig(projectRootPath)?.mainFilePath;
}

export default async function configureAndroidSplashScreen(imagePath: string, mode: Mode) {
  const splashScreenBackgroundColor = `#FFFFFF`;
  const projectRootPath = path.resolve();
  const androidMainPath = path.resolve(projectRootPath, 'android/app/src/main');

  return Promise.all([
    await configureSplashScreenDrawables(path.resolve(androidMainPath, 'res'), imagePath),
    await configureSplashScreenXML(androidMainPath, mode, splashScreenBackgroundColor),
    await configureShowingSplashScreen(projectRootPath),
  ]).then(() => {});
}
