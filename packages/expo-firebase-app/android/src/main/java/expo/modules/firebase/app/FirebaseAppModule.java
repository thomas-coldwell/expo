package expo.modules.firebase.app;

import android.app.Activity;
import android.content.Context;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.MapArguments;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListener;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

import androidx.annotation.Nullable;

public class FirebaseAppModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoFirebaseApp";

  private Activity mActivity;

  public FirebaseAppModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    ActivityProvider mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);
    mActivity = mActivityProvider.getCurrentActivity();
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();

    /*FirebaseApp firebaseApp = getDefaultApp();
    if (firebaseApp != null) {
      FirebaseOptions appOptions = firebaseApp.getOptions();
      Map<String, Object> options = new HashMap<>();

      options.put("apiKey", appOptions.getApiKey());
      options.put("appId", appOptions.getApplicationId());
      options.put("databaseURL", appOptions.getDatabaseUrl());
      options.put("messagingSenderId", appOptions.getGcmSenderId());
      options.put("name", firebaseApp.getName());
      options.put("projectId", appOptions.getProjectId());
      options.put("storageBucket", appOptions.getStorageBucket());

      constants.put("app", options);
    }*/

    return constants;
  }

  private FirebaseOptions getFirebaseOptionsFromGoogleServicesFile() {
    // TODO
    return null;
  }

  private static FirebaseOptions getFirebaseOptionsFromJSON(final Map<String, String> json) {
    FirebaseOptions.Builder builder = new FirebaseOptions.Builder();

    builder.setApiKey(json.get("apiKey"));
    builder.setApplicationId(json.get("appId"));
    builder.setProjectId(json.get("projectId"));
    builder.setDatabaseUrl(json.get("databaseURL"));
    builder.setStorageBucket(json.get("storageBucket"));
    builder.setGcmSenderId(json.get("messagingSenderId"));
    builder.setGaTrackingId(json.get("trackingId"));

    return builder.build();
  }

  private void updateFirebaseApp(final FirebaseOptions options, final String name) {
    // TODO
    /*FirebaseApp firebaseApp = getDefaultApp();
    if (firebaseApp != null) {
      FirebaseOptions currentOptions = firebaseApp.getOptions();
      if (!currentOptions.getApiKey().equals(options.get("apiKey")) ||
              !currentOptions.getApplicationId().equals(options.get("appId"))) {
        firebaseApp.delete();
      } else {
        promise.resolve(null);
        return;
      }
    }
    FirebaseApp.initializeApp(mActivity.getApplicationContext(), builder.build());*/
  }

  @ExpoMethod
  public void initializeAppAsync(final Map<String, String> options, final String name, Promise promise) {
    try {
      final FirebaseOptions firebaseOptions = (options != null)
        ? getFirebaseOptionsFromJSON(options)
        : getFirebaseOptionsFromGoogleServicesFile();
      this.updateFirebaseApp(firebaseOptions, name);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void deleteAppAsync(final String name, Promise promise) {
    try {
      final FirebaseApp app = (name == null)
        ? FirebaseApp.getInstance()
        : FirebaseApp.getInstance(name);
      app.delete();
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void getAppAsync(final String name, Promise promise) {
    try {
      FirebaseApp app;
      if (name == null) {
        app = FirebaseApp.getInstance();
      } else {
        app = FirebaseApp.getInstance(name);
      }
      promise.resolve(app.getName());
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void getAppsAsync(Promise promise) {
    try {
      List<FirebaseApp> apps = FirebaseApp.getApps(mActivity.getApplicationContext());
      List<String> names = new ArrayList<String>();
      for (FirebaseApp app : apps) {
        names.add(app.getName());
      }
      promise.resolve(names);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void getAppOptionsAsync(final String name, Promise promise) {
    try {
      FirebaseApp app;
      if (name == null) {
        app = FirebaseApp.getInstance();
      } else {
        app = FirebaseApp.getInstance(name);
      }
      FirebaseOptions options = app.getOptions();

      final Map<String, String> result = new HashMap<>();
      result.put("apiKey", options.getApiKey());
      result.put("appId", options.getApplicationId());
      result.put("databaseURL", options.getDatabaseUrl());
      result.put("messagingSenderId", options.getGcmSenderId());
      result.put("projectId", options.getProjectId());
      result.put("storageBucket", options.getStorageBucket());

      promise.resolve(result);
    } catch (Exception e) {
      promise.reject(e);
    }
  }
}
