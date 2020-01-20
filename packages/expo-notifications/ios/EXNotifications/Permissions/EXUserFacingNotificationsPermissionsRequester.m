// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXUserFacingNotificationsPermissionsRequester.h>
#import <UMCore/UMDefines.h>
#import <UserNotifications/UserNotifications.h>

@interface EXUserFacingNotificationsPermissionsRequester ()

@property (nonatomic, assign) dispatch_queue_t methodQueue;

@end

@implementation EXUserFacingNotificationsPermissionsRequester

+ (NSString *)permissionType
{
  return @"userFacingNotifications";
}

- (instancetype)initWithMethodQueue:(dispatch_queue_t)methodQueue
{
  if (self = [super init]) {
    _methodQueue = methodQueue;
  }
  return self;
}

- (NSDictionary *)getPermissions
{
  dispatch_assert_queue_not(dispatch_get_main_queue());
  dispatch_semaphore_t sem = dispatch_semaphore_create(0);

  __block UMPermissionStatus generalStatus = UMPermissionStatusUndetermined;

  __block NSNumber *status;
  __block NSNumber *allowsDisplayInNotificationCenter;
  __block NSNumber *allowsDisplayOnLockScreen;
  __block NSNumber *allowsDisplayInCarPlay;
  __block NSNumber *allowsAlert;
  __block NSNumber *allowsBadge;
  __block NSNumber *allowsSound;
  __block NSNumber *allowsCriticalAlerts;

  __block NSNumber *alertStyle;
  __block NSNumber *allowsPreviews;
  __block NSNumber *providesAppNotificationSettings;

  __block NSNumber *allowsAnnouncements;

  [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
    if (settings.authorizationStatus == UNAuthorizationStatusAuthorized) {
      generalStatus = UMPermissionStatusGranted;
    } else if (settings.authorizationStatus == UNAuthorizationStatusDenied) {
      generalStatus = UMPermissionStatusDenied;
    }

    status = [self authorizationStatusToEnum:settings.authorizationStatus];

    allowsDisplayInNotificationCenter = [self notificationSettingToNumber:settings.notificationCenterSetting];
    allowsDisplayOnLockScreen = [self notificationSettingToNumber:settings.lockScreenSetting];
    allowsDisplayInCarPlay = [self notificationSettingToNumber:settings.carPlaySetting];
    allowsAlert = [self notificationSettingToNumber:settings.alertSetting];
    allowsBadge = [self notificationSettingToNumber:settings.badgeSetting];
    allowsSound = [self notificationSettingToNumber:settings.soundSetting];
    if (@available(iOS 12.0, *)) {
      allowsCriticalAlerts = [self notificationSettingToNumber:settings.criticalAlertSetting];
    }

    alertStyle = [self alertStyleToEnum:settings.alertStyle];
    if (@available(iOS 11.0, *)) {
      allowsPreviews = [self showPreviewsSettingToEnum:settings.showPreviewsSetting];
    }
    if (@available(iOS 12.0, *)) {
      providesAppNotificationSettings = @(settings.providesAppNotificationSettings);
    }

    if (@available(iOS 13.0, *)) {
      allowsAnnouncements = [self notificationSettingToNumber:settings.announcementSetting];
    }

    dispatch_semaphore_signal(sem);
  }];

  dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);

  return @{
           @"status": @(generalStatus),
           @"ios": @{
                     @"status": status,
                     @"allowsDisplayInNotificationCenter": allowsDisplayInNotificationCenter ?: [NSNull null],
                     @"allowsDisplayOnLockScreen": allowsDisplayOnLockScreen ?: [NSNull null],
                     @"allowsDisplayInCarPlay": allowsDisplayInCarPlay ?: [NSNull null],
                     @"allowsAlert": allowsAlert ?: [NSNull null],
                     @"allowsBadge": allowsBadge ?: [NSNull null],
                     @"allowsSound": allowsSound ?: [NSNull null],
                     @"allowsCriticalAlerts": allowsCriticalAlerts ?: [NSNull null],

                     @"alertStyle": alertStyle,
                     @"allowsPreviews": allowsPreviews,
                     @"providesAppNotificationSettings": providesAppNotificationSettings ?: [NSNull null],

                     @"allowsAnnouncements": allowsAnnouncements ?: [NSNull null]
                     }
           };
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  static NSDictionary *defaultPermissions;
  if (!defaultPermissions) {
    defaultPermissions = @{
                           @"allowsAlert": @(YES),
                           @"allowsBadge": @(YES),
                           @"allowsSound": @(YES)
                           };
  }
  [self requestPermissions:defaultPermissions withResolver:resolve rejecter:reject];
}

- (void)requestPermissions:(NSDictionary *)permissions withResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  UNAuthorizationOptions options = UNAuthorizationOptionNone;
  if ([permissions[@"allowAlert"] boolValue]) {
    options |= UNAuthorizationOptionAlert;
  }
  if ([permissions[@"allowBadge"] boolValue]) {
    options |= UNAuthorizationOptionBadge;
  }
  if ([permissions[@"allowSound"] boolValue]) {
    options |= UNAuthorizationOptionSound;
  }
  if ([permissions[@"allowDisplayInCarPlay"] boolValue]) {
    options |= UNAuthorizationOptionCarPlay;
  }
  if (@available(iOS 12.0, *)) {
    if ([permissions[@"allowCriticalAlerts"] boolValue]) {
        options |= UNAuthorizationOptionCriticalAlert;
    }
    if ([permissions[@"provideAppNotificationSettings"] boolValue]) {
        options |= UNAuthorizationOptionProvidesAppNotificationSettings;
    }
    if ([permissions[@"allowProvisional"] boolValue]) {
        options |= UNAuthorizationOptionProvisional;
    }
  }
  if (@available(iOS 13.0, *)) {
    if ([permissions[@"allowAnnouncements"] boolValue]) {
      options |= UNAuthorizationOptionAnnouncement;
    }
  }
  [self requestAuthorizationOptions:options withResolver:resolve rejecter:reject];
}

- (void)requestAuthorizationOptions:(UNAuthorizationOptions)options withResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  UM_WEAKIFY(self);
  [[UNUserNotificationCenter currentNotificationCenter] requestAuthorizationWithOptions:options completionHandler:^(BOOL granted, NSError * _Nullable error) {
    UM_STRONGIFY(self);
    // getPermissions blocks method queue on which this callback is being executed
    // so we have to dispatch to another queue.
    dispatch_async(self.methodQueue, ^{
      if (error) {
        reject(@"E_PERM_REQ", error.description, error);
      } else {
        resolve([self getPermissions]);
      }
    });
  }];
}

# pragma mark - Utilities - notification settings to string

- (NSNumber *)showPreviewsSettingToEnum:(UNShowPreviewsSetting)setting API_AVAILABLE(ios(11.0)) {
  switch (setting) {
    case UNShowPreviewsSettingNever:
      return @(0);
    case UNShowPreviewsSettingAlways:
      return @(1);
    case UNShowPreviewsSettingWhenAuthenticated:
      return @(2);
  }
}

- (NSNumber *)alertStyleToEnum:(UNAlertStyle)style {
  switch (style) {
    case UNAlertStyleNone:
      return @(0);
    case UNAlertStyleBanner:
      return @(1);
    case UNAlertStyleAlert:
      return @(2);
  }
}

- (NSNumber *)authorizationStatusToEnum:(UNAuthorizationStatus)status
{
  switch (status) {
    case UNAuthorizationStatusNotDetermined:
      return @(0);
    case UNAuthorizationStatusDenied:
      return @(1);
    case UNAuthorizationStatusAuthorized:
      return @(2);
    case UNAuthorizationStatusProvisional:
      return @(3);
  }
}

- (nullable NSNumber *)notificationSettingToNumber:(UNNotificationSetting)setting
{
  switch (setting) {
    case UNNotificationSettingEnabled:
      return @(YES);
    case UNNotificationSettingDisabled:
      return @(NO);
    case UNNotificationSettingNotSupported:
      return nil;
  }
}

@end
