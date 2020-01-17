import { FirebaseOptions } from './FirebaseApp.types';
export declare const DEFAULT_OPTIONS: any;
declare class FirebaseApp {
    /**
     * The (read-only) name for this app.
     */
    readonly name: string;
    constructor(name: string);
    /**
     * Delete the Firebase app instance.
     */
    deleteAsync(): Promise<void>;
    /**
     * Returns the (read-only) configuration options for this app. These are the original parameters
     * the app was initialized with.
     */
    getOptionsAsync(): Promise<FirebaseOptions>;
}
/**
 * Initializes a Firebase app.
 *
 * On iOS and Android this method is optional, as the default Firebase app instance
 * is automatically initialized when the `GoogleService-Info.plist` or `google-services.json`
 * file is configured.
 *
 * You can use this method to initialize additional Firebase app instances. You should typically not
 * initialize the default Firebase with custom options, as the default app is tightly coupled
 * with the google-services config that is shipped with the app.
 */
export declare function initializeAppAsync(options?: FirebaseOptions, name?: string): Promise<FirebaseApp>;
/**
 * Retrieves a Firebase app instance.
 * When called with no arguments, the default app is returned. When an app name is provided, the app corresponding to that name is returned.
 * An exception is thrown if the app being retrieved has not yet been initialized.
 *
 * @param name Optional name of the app to return
 */
export declare function getAppAsync(name?: string): Promise<FirebaseApp>;
/**
 * Retrieves all initialized Firebase app instances.
 */
export declare function getAppsAsync(): Promise<FirebaseApp[]>;
export {};
