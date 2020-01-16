import { Platform } from 'react-native';
import * as FirebaseApp from 'expo-firebase-app';

export const name = 'FirebaseApp';

const DEFAULT_APP_NAME = Platform.select({
  ios: '__FIRAPP_DEFAULT',
  android: '[DEFAULT]',
});

export async function test({ describe, beforeEach, beforeAll, afterAll, it, expect }) {
  describe(name, () => {
    beforeAll(async () => {
      await FirebaseApp.initializeAppAsync();
    });

    /*afterAll(async () => {
      await FirebaseApp.initializeAppAsync();
    });*/

    describe('getAppAsync()', async () => {
      it(`returns default Firebase app`, async () => {
        let error = null;
        try {
          const app = await FirebaseApp.getAppAsync();
          expect(app.name).toBe(DEFAULT_APP_NAME);
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });

    describe('getAppsAsync()', async () => {
      it(`returns all Firebase apps`, async () => {
        let error = null;
        try {
          const apps = await FirebaseApp.getAppsAsync();
          expect(apps.length).toBe(1);
          expect(apps[0].name).toBe(DEFAULT_APP_NAME);
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });

    describe('getAppOptions()', async () => {
      it(`returns the firebase options`, async () => {
        let error = null;
        try {
          const app = await FirebaseApp.getAppAsync();
          const options = await app.getOptionsAsync();
          expect(options.appId).not.toBeNull();
          expect(options.messagingSenderId).not.toBeNull();
          expect(options.apiKey).not.toBeNull();
          expect(options.projectId).not.toBeNull();
          expect(options.clientId).not.toBeNull();
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });

    describe('deleteAsync()', async () => {
      it(`succeeds when app exists`, async () => {
        let error = null;
        try {
          const app = await FirebaseApp.getAppAsync();
          await app.deleteAsync();
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
      it(`is not returned by getAppAsync`, async () => {
        let error = null;
        try {
          const app = await FirebaseApp.getAppAsync();
          expect(app).toBeNull();
        } catch (e) {
          error = e;
        }
        expect(error).not.toBeNull();
      });
      it(`is not returned by getAppsAsync`, async () => {
        let error = null;
        try {
          const apps = await FirebaseApp.getAppsAsync();
          expect(apps.length).toBe(0);
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
      it(`fails when app has been deleted`, async () => {
        let error = null;
        await FirebaseApp.initializeAppAsync();
        const app = await FirebaseApp.getAppAsync();
        try {
          await app.deleteAsync();
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });
  });
}
