import { NotificationPermissionsRequest } from './NotificationPermissionsModule';
export { AndroidImportance, AndroidInterruptionFilter, IosAlertStyle, IosAllowsPreviews, IosAuthorizationStatus, } from './NotificationPermissionsModule';
export declare function getPermissionsAsync(): Promise<import("./NotificationPermissionsModule").NotificationPermissionsStatus>;
export declare function requestPermissionsAsync(permissions?: NotificationPermissionsRequest): Promise<import("./NotificationPermissionsModule").NotificationPermissionsStatus>;
