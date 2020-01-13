// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXApplication/EXApplication.h>)

#import <EXApplication/EXApplication.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedApplication : EXApplication

- (instancetype)initWithParams:(NSDictionary *)params;

@end

NS_ASSUME_NONNULL_END

#endif
