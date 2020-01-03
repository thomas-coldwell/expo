export { default as AppLoading } from './AppLoading';
export * from './AppLoading';
/**
 * Makes the native splash screen stay visible until `SplashScreen.hideAsync()` is called.
 *
 * @example
 * ```typescript
 * class App extends React.Component {
 *   async componentDidMount() {
 *     await SplashScreen.preventAutoHideAsync();
 *   }
 *   ...
 * }
 * ```
 */
export declare function preventAutoHideAsync(): Promise<void>;
export declare function hideAsync(): Promise<any>;
