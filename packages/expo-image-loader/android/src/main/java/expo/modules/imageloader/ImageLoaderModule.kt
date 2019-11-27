package expo.modules.imageloader

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.target.SimpleTarget
import com.bumptech.glide.request.transition.Transition
import org.unimodules.core.interfaces.InternalModule
import org.unimodules.interfaces.imageloader.ImageLoader

class ImageLoaderModule(val context: Context) : InternalModule, ImageLoader {

  override fun getExportedInterfaces(): List<Class<*>>? {
    return listOf(ImageLoader::class.java)
  }

  override fun loadImageForManipulationFromURL(url: String, resultListener: ImageLoader.ResultListener) {
    Glide.with(context)
        .asBitmap()
        .diskCacheStrategy(DiskCacheStrategy.NONE)
        .skipMemoryCache(true)
        .load(url)
        .into(object : SimpleTarget<Bitmap>() {
          override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
            resultListener.onSuccess(resource)
          }

          override fun onLoadFailed(errorDrawable: Drawable?) {
            resultListener.onFailure(Exception("Loading bitmap failed"))
          }
        })
  }
}
