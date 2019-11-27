package org.unimodules.interfaces.imageloader;

import android.graphics.Bitmap;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public interface ImageLoader {
  interface ResultListener {
    void onSuccess(@NonNull Bitmap bitmap);

    void onFailure(@Nullable Throwable cause);
  }

  /**
   * Loads full-sized image with no caching.
   */
  void loadImageForManipulationFromURL(@NonNull String url, ResultListener resultListener);
}
