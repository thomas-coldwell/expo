package expo.modules.constants;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.os.Build;
import androidx.annotation.Nullable;
import android.util.DisplayMetrics;
import android.util.Log;

import com.facebook.device.yearclass.YearClass;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.interfaces.constants.ConstantsInterface;

public class ConstantsService implements InternalModule, ConstantsInterface {
  private static final String TAG = ConstantsService.class.getSimpleName();

  protected Context mContext;
  protected int mStatusBarHeight = 0;
  private String mSessionId = UUID.randomUUID().toString();
  // private Map<String, String> mGoogleServicesFile;

  private static int convertPixelsToDp(float px, Context context) {
    Resources resources = context.getResources();
    DisplayMetrics metrics = resources.getDisplayMetrics();
    float dp = px / (metrics.densityDpi / 160f);
    return (int) dp;
  }

  public ConstantsService(Context context) {
    super();
    mContext = context;

    int resourceId = context.getResources().getIdentifier("status_bar_height", "dimen", "android");

    if (resourceId > 0) {
      int statusBarHeightPixels = context.getResources().getDimensionPixelSize(resourceId);
      // Convert from pixels to dip
      mStatusBarHeight = convertPixelsToDp(statusBarHeightPixels, context);
    }

    // mGoogleServicesFile = getGoogleServicesFile(context);
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) ConstantsInterface.class);
  }

  @Nullable
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();

    constants.put("sessionId", mSessionId);
    constants.put("statusBarHeight", getStatusBarHeight());
    constants.put("deviceYearClass", getDeviceYearClass());
    constants.put("deviceName", getDeviceName());
    constants.put("isDevice", getIsDevice());
    constants.put("systemFonts", getSystemFonts());
    constants.put("systemVersion", getSystemVersion());

    PackageManager packageManager = mContext.getPackageManager();
    try {
      PackageInfo pInfo = packageManager.getPackageInfo(mContext.getPackageName(), 0);
      constants.put("nativeAppVersion", pInfo.versionName);

      int versionCode = (int) getLongVersionCode(pInfo);
      constants.put("nativeBuildVersion", Integer.toString(versionCode));
    } catch (PackageManager.NameNotFoundException e) {
      Log.e(TAG, "Exception: ", e);
    }

    Map<String, Object> platform = new HashMap<>();
    Map<String, Object> androidPlatform = new HashMap<>();

    platform.put("android", androidPlatform);
    constants.put("platform", platform);

    /*
     * if (mGoogleServicesFile != null) { constants.put("googleServicesFile",
     * mGoogleServicesFile); }
     */

    return constants;
  }

  public String getAppId() {
    // Just use package name in vanilla React Native apps.
    return mContext.getPackageName();
  }

  public String getAppOwnership() {
    return "guest";
  }

  public String getDeviceName() {
    return Build.MODEL;
  }

  public int getDeviceYearClass() {
    return YearClass.get(mContext);
  }

  public boolean getIsDevice() {
    return !isRunningOnGenymotion() && !isRunningOnStockEmulator();
  }

  public int getStatusBarHeight() {
    return mStatusBarHeight;
  }

  public String getSystemVersion() {
    return Build.VERSION.RELEASE;
  }

  public List<String> getSystemFonts() {
    // From https://github.com/dabit3/react-native-fonts
    List<String> result = new ArrayList<>();
    result.add("normal");
    result.add("notoserif");
    result.add("sans-serif");
    result.add("sans-serif-light");
    result.add("sans-serif-thin");
    result.add("sans-serif-condensed");
    result.add("sans-serif-medium");
    result.add("serif");
    result.add("Roboto");
    result.add("monospace");
    return result;
  }

  private static boolean isRunningOnGenymotion() {
    return Build.FINGERPRINT.contains("vbox");
  }

  private static boolean isRunningOnStockEmulator() {
    return Build.FINGERPRINT.contains("generic");
  }

  private static long getLongVersionCode(PackageInfo info) {
    if (Build.VERSION.SDK_INT >= 28) {
      return info.getLongVersionCode();
    }
    return info.versionCode;
  }

  /*
   * private static Map<String, String> getGoogleServicesFile(Context context) {
   * StringResourceValueReader reader = new StringResourceValueReader(context);
   * String appId = reader.getString("google_app_id"); if
   * (TextUtils.isEmpty(appId)) return null; String apiKey =
   * reader.getString("google_api_key"); String databaseURL =
   * reader.getString("firebase_database_url"); String trackingId =
   * reader.getString("ga_trackingId"); String messagingSenderId =
   * reader.getString("gcm_defaultSenderId"); String storageBucket =
   * reader.getString("google_storage_bucket"); String projectId =
   * reader.getString("project_id");
   * 
   * Map<String, String> result = new HashMap<>(); result.put("appId", appId); if
   * (apiKey != null) result.put("apiKey", apiKey); if (databaseURL != null)
   * result.put("databaseURL", databaseURL); if (trackingId != null)
   * result.put("trackingId", trackingId); if (messagingSenderId != null)
   * result.put("messagingSenderId", messagingSenderId); if (storageBucket !=
   * null) result.put("storageBucket", storageBucket); if (projectId != null)
   * result.put("projectId", projectId); return result; }
   */
}
