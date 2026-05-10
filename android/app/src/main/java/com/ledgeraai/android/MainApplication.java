package com.ledgeraai.android;

import android.app.Application;

import com.onesignal.OneSignal;
import com.onesignal.debug.LogLevel;

public class MainApplication extends Application {

    private static final String ONESIGNAL_APP_ID = "f9bccfd2-7da8-475e-8091-d28ed41d7e14";

    @Override
    public void onCreate() {
        super.onCreate();

        if (BuildConfig.DEBUG) {
            OneSignal.getDebug().setLogLevel(LogLevel.VERBOSE);
        }

        OneSignal.initWithContext(this, ONESIGNAL_APP_ID);

        // NOTE: Do NOT call requestPermission() here — call it from the web app
        // via NotifyBridge.requestPermission() instead.
    }
}
