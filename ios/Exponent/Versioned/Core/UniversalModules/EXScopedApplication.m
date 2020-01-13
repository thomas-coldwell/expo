// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXApplication/EXApplication.h>)

#import "EXScopedApplication.h"

@interface EXScopedApplication ()

@property (nonatomic, strong) NSDictionary *unversionedConstants;

@end

@implementation EXScopedApplication

- (instancetype)initWithParams:(NSDictionary *)params
{
  if (self = [super init]) {
    _unversionedConstants = params[@"constants"];
  }
  return self;
}

- (NSString *)getInstallationId
{
  return _unversionedConstants[@"installationId"] ?: [super getInstallationId];
}

@end

#endif
