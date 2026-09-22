# MASCOM for Android

A native Android client for the MASCOM store. It talks to the same `/api/**` routes as the web app, so the server has to be running somewhere the phone can reach.

**Stack:** Kotlin, Jetpack Compose, Material 3 with frosted-glass surfaces (Haze), MVVM over a clean-architecture split (`domain` / `data` / `ui`), Coroutines + Flow, Hilt, Retrofit + OkHttp, kotlinx.serialization, Room (bag + product cache), DataStore (session, theme, server), Coil 3, and Firebase Cloud Messaging.

## Build

Requires JDK 17+ (Android Studio's bundled JBR is fine) and the Android SDK with platform 37.

```sh
./gradlew assembleDebug      # app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease    # app/build/outputs/apk/release/app-release.apk
```

Or open this `android/` folder in Android Studio.

## Which server it uses

The default server is baked in at build time and can be changed inside the app (the sign-in screen and **You → Server**).

```sh
./gradlew assembleRelease -Pmascom.baseUrl=https://your-domain/
```

With no flag, the default is `http://10.0.2.2:3000/`, which is `npm run dev` on the machine running the emulator.

- **Release builds:** HTTPS only. The one exception is plain HTTP to `10.0.2.2` or `localhost`.
- **Debug builds:** any plain-HTTP server, so a real phone can use your PC's LAN address, e.g. `http://192.168.1.20:3000`.

## Auth

The site signs people in with an httpOnly `mascom_session` cookie. The app keeps that cookie in DataStore and sends it back only to the configured server. Changing the server signs you out.

## Push notifications (optional)

1. Create a Firebase project.
2. Add an Android app with package `com.mascom.app`.
3. Download `google-services.json` into `app/`, then rebuild.

The app then subscribes to the `drops` topic, so you can announce a drop from the Firebase console. A message whose data includes `orderId` opens that order when tapped.

Without the file, push is switched off and everything else works.

## Release signing

`assembleRelease` signs with the key named in `keystore.properties`: `storeFile`, `storePassword`, `keyAlias` and `keyPassword`. Both that file and the `*.jks` it points to are gitignored.

**Back up both.** Android only installs an update if it is signed with the same key, and a lost key can't be recovered. Without `keystore.properties`, release builds fall back to the debug key.

## Not in the app yet

- The staff-only console sections: drops, collections, runs & coupons, people. Use the website for those.
- Opening a product that isn't live. The server has no single-product route, so the app can only show products in the `/api/products` list.
