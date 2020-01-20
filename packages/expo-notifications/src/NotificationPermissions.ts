import NotificationPermissionsModule, {
  NotificationPermissionsRequest,
} from './NotificationPermissionsModule';

export {
  AndroidImportance,
  AndroidInterruptionFilter,
  IosAlertStyle,
  IosAllowsPreviews,
  IosAuthorizationStatus,
} from './NotificationPermissionsModule';

export async function getPermissionsAsync() {
  return await NotificationPermissionsModule.getPermissionsAsync();
}

export async function requestPermissionsAsync(permissions?: NotificationPermissionsRequest) {
  return await NotificationPermissionsModule.requestPermissionsAsync(
    permissions ?? {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    }
  );
}
