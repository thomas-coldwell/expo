package expo.modules.firebase.app;

import android.app.Activity;
import android.content.Context;
import android.text.TextUtils;
import android.os.Bundle;

import org.json.JSONObject;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListener;
import org.unimodules.interfaces.constants.ConstantsInterface;

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
  private ModuleRegistry mModuleRegistry;
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
    mModuleRegistry = moduleRegistry;
    ActivityProvider mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);
    mActivity = mActivityProvider.getCurrentActivity();
    updateFirebaseApp(getFirebaseOptionsFromJSON(getDefaultFirebaseOptionsJSON()), null);
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();

    if (mDefaultOptions == null) {
      mDefaultOptions = getDefaultFirebaseOptionsJSON();
    }

    if (mDefaultOptions != null) {
      constants.put("DEFAULT_OPTIONS", mDefaultOptions);
    }

    return constants;
  }

  private Map<String, String> getDefaultFirebaseOptionsJSON() {
    Map<String, String> json = getFirebaseOptionsJSONFromManifest();
    if (json == null) {
      json = getFirebaseOptionsJSONFromResources();
    }
    return json;
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

  private static String getJSONStringByPath(JSONObject json, String path) {
    if (json == null) return null;
    try {
      String[] paths = path.split("\\.");
      for (int i = 0; i < paths.length; i++) {
        String name = paths[i];
        if (!json.has(name)) return null;
        if (i == paths.length - 1) {
          return json.getString(name);
        } else {
          json = json.getJSONObject(name);
        }
      }
      return null;
    } catch (Exception err){
      return null;
    }
  }

  private static void addJSONStringToMap(JSONObject json, Map<String, String> map, String path, String name) {
    String value = getJSONStringByPath(json, path);
    if (value != null) map.put(name, value);
  }

  private Map<String, String> getFirebaseOptionsJSONFromManifest() {
    ConstantsInterface constantsService = mModuleRegistry.getModule(ConstantsInterface.class);
    Map<String, Object> constants = constantsService.getConstants();
    String manifestString = (String) constants.get("manifest");
    if (manifestString == null) return null;
    try {
      JSONObject manifest = new JSONObject(manifestString);
      JSONObject android = manifest.has("android") ? manifest.getJSONObject("android") : null;
      String googleServicesFileString = ((android != null) && android.has("googleServicesFile")) ? android.getString("googleServicesFile") : null;
      JSONObject googleServicesFile = (googleServicesFileString != null) ? new JSONObject(googleServicesFileString) : null;
      // https://developers.google.com/android/guides/google-services-plugin
      Map<String, String> result = new HashMap<>();
      addJSONStringToMap(googleServicesFile, result, "project_info.project_id", "projectId");
      addJSONStringToMap(googleServicesFile, result, "project_info.project_number", "messagingSenderId");
      addJSONStringToMap(googleServicesFile, result, "project_info.firebase_url", "databaseURL");
      addJSONStringToMap(googleServicesFile, result, "project_info.storage_bucket", "storageBucket");
      addJSONStringToMap(googleServicesFile, result, "client_info.<TODO>.mobilesdk_app_id", "appId");
      addJSONStringToMap(googleServicesFile, result, "client_info.<TODO>.services.analytics-service.analytics_property.tracking_id", "trackingId");
      addJSONStringToMap(googleServicesFile, result, "client_info.<TODO>.api_key.current_key", "apiKey");
      return result.containsKey("appId") ? result : null;
    }catch (Exception err){
      return null;
    }
  }

  private static FirebaseOptions getFirebaseOptionsFromJSON(final Map<String, String> json) {
    if (json == null) return null;
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
          : getFirebaseOptionsFromJSON(this.getDefaultFirebaseOptionsJSON());
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
