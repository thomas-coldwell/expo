# expo-gl module

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)
LOCAL_MODULE := expo-gl

LOCAL_C_INCLUDES += ../../../../cpp/
LOCAL_SRC_FILES := \
  ../../../../cpp/UEXGL.cpp \
  ../../../../cpp/EXJSUtils.cpp \
  ../../../../cpp/EXGLContext.cpp \
  ../../../../cpp/EXGLInstallMethods.cpp \
  ../../../../cpp/EXGLInstallConstants.cpp \
  ../../../../cpp/EXGLNativeMethods.cpp \
  EXGL.cpp

LOCAL_CFLAGS := -fexceptions -frtti -O3
LOCAL_STATIC_LIBRARIES := libjsi
LOCAL_SHARED_LIBRARIES := libfolly_json glog

ifeq ($(VM), HERMES)
  LOCAL_SRC_FILE += ../../../../cpp/TypedArrayHermes.cpp
  LOCAL_SHARED_LIBRARIES += libhermes
endif

ifeq ($(VM), JSC)
  LOCAL_SRC_FILE += ../../../../cpp/TypedArrayJSC.cpp
  LOCAL_SHARED_LIBRARIES += libjsc
endif

include $(BUILD_SHARED_LIBRARY)

$(call import-module,jsc)
$(call import-module,hermes)
$(call import-module,jsi)
$(call import-module,glog)
$(call import-module,folly)
