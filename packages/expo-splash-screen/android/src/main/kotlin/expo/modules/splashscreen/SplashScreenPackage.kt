package main.kotlin.expo.modules.splashscreen

import android.content.Context

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule

class SplashScreenPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(SplashScreenModule(context) as ExportedModule)
  }
}
