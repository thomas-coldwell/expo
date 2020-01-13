package versioned.host.exp.exponent.modules.universal;

import android.content.Context;

import org.unimodules.core.Promise;

import javax.inject.Inject;

import expo.modules.application.ApplicationModule;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class ScopedApplicationModule extends ApplicationModule {
  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  public ScopedApplicationModule(Context context) {
    super(context);
    NativeModuleDepsProvider.getInstance().inject(ScopedApplicationModule.class, this);
  }

  @Override
  public void getInstallationIdAsync(Promise promise) {
    promise.resolve(mExponentSharedPreferences.getOrCreateUUID());
  }
}
