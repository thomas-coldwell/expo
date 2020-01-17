package expo.modules.firebase.app;

import android.app.Activity;
import android.content.Context;
import android.text.TextUtils;
import android.os.Bundle;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListener;

import com.google.android.gms.common.internal.StringResourceValueReader;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

import androidx.annotation.Nullable;

public class FirebaseAppModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoFirebaseApp";

  private Activity mActivity;
  private Context mContext;
  private Map<String, String> mDefaultOptions;

  public FirebaseAppModule(Context context) {
    super(context);
    mContext = context;
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

    if (mDefaultOptions == null) {
      mDefaultOptions = getFirebaseOptionsJSONFromResources();
    }

    if (mDefaultOptions != null) {
      constants.put("DEFAULT_OPTIONS", mDefaultOptions);
    }

    return constants;
  }

  private Map<String, String> getFirebaseOptionsJSONFromResources() {
    StringResourceValueReader reader = new StringResourceValueReader(mContext);
    String appId = reader.getString("google_app_id");
    if (TextUtils.isEmpty(appId)) return null;
    String apiKey = reader.getString("google_api_key");
    String databaseURL = reader.getString("firebase_database_url");
    String trackingId = reader.getString("ga_trackingId");
    String messagingSenderId = reader.getString("gcm_defaultSenderId");
    String storageBucket = reader.getString("google_storage_bucket");
    String projectId = reader.getString("project_id");

    Map<String, String> result = new HashMap<>();
    result.put("appId", appId);
    if (apiKey != null)
      result.put("apiKey", apiKey);
    if (databaseURL != null)
      result.put("databaseURL", databaseURL);
    if (trackingId != null)
      result.put("trackingId", trackingId);
    if (messagingSenderId != null)
      result.put("messagingSenderId", messagingSenderId);
    if (storageBucket != null)
      result.put("storageBucket", storageBucket);
    if (projectId != null)
      result.put("projectId", projectId);
    return result;
  }

  private FirebaseOptions getFirebaseOptionsFromResources() {
    Map<String, String> json = getFirebaseOptionsJSONFromResources();
    if (json == null) return null;
    return getFirebaseOptionsFromJSON(json);
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

  private static Map<String, String> getFirebaseOptionsJSON(final FirebaseOptions options) {
    final Map<String, String> result = new HashMap<>();
    result.put("apiKey", options.getApiKey());
    result.put("appId", options.getApplicationId());
    result.put("databaseURL", options.getDatabaseUrl());
    result.put("messagingSenderId", options.getGcmSenderId());
    result.put("projectId", options.getProjectId());
    result.put("storageBucket", options.getStorageBucket());
    return result;
  }

  private static boolean isFirebaseOptionsEqual(final FirebaseOptions opts1, final FirebaseOptions opts2) {
    if (opts1 == opts2) return true;
    if ((opts1 == null) || (opts2 == null)) return false;
    return opts1.equals(opts2);
  }

  private final FirebaseApp getFirebaseApp(final String name) {
    return (name == null) ? FirebaseApp.getInstance() : FirebaseApp.getInstance(name);
  }

  private void updateFirebaseApp(final FirebaseOptions options, final String name) {
    FirebaseApp app;
    try {
      app = getFirebaseApp(name);
    } catch (Exception e) {
      app = null;
    }

    if (app != null) {
      if (options == null) {
        app.delete();
      } else {
        if (!isFirebaseOptionsEqual(options, app.getOptions())) {
          app.delete();
          if (name == null) {
            FirebaseApp.initializeApp(mActivity.getApplicationContext(), options);
          } else {
            FirebaseApp.initializeApp(mActivity.getApplicationContext(), options, name);
          }
        }
      }
    } else {
      if (options != null) {
        if (name == null) {
          FirebaseApp.initializeApp(mActivity.getApplicationContext(), options);
        } else {
          FirebaseApp.initializeApp(mActivity.getApplicationContext(), options, name);
        }
      }
    }
  }

  @ExpoMethod
  public void initializeAppAsync(final Map<String, String> options, final String name, Promise promise) {
    try {
      final FirebaseOptions firebaseOptions = (options != null) ? getFirebaseOptionsFromJSON(options)
          : getFirebaseOptionsFromResources();
      this.updateFirebaseApp(firebaseOptions, name);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void deleteAppAsync(final String name, Promise promise) {
    try {
      final FirebaseApp app = getFirebaseApp(name);
      app.delete();
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void getAppAsync(final String name, Promise promise) {
    try {
      final FirebaseApp app = getFirebaseApp(name);
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
      final FirebaseApp app = getFirebaseApp(name);
      Map<String, String> json = getFirebaseOptionsJSON(app.getOptions());
      Bundle response = new Bundle();
      for (Map.Entry<String, String> entry : json.entrySet()) {
        response.putString(entry.getKey(), entry.getValue());
      }
      promise.resolve(response);
    } catch (Exception e) {
      promise.reject(e);
    }
  }
}
