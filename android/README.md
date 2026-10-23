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

## The 3D polo on the welcome screen

The spinning shirt is a turntable rendered in Blender, not a live 3D engine. It's 120 frames, one every 3°, at 720px, stored in `app/src/main/assets/polo/`. `PoloTurntable` plays the frames, blends neighbouring ones for smooth motion, and lets you drag to spin it.

Because it's plain images, the frosted-glass sheet can blur it like anything else.

**Source model and licence:** the model is "Polo Shirt" by Giovani França from BlenderKit (asset `712334fb-5efe-41e6-bd62-94266e9ec445`). It's free, under BlenderKit's royalty-free licence. That licence covers using renders of it in the app but not redistributing the model file. So only the rendered frames are committed, and the `.blend` is downloaded into `art/.cache/`, which is gitignored.

**What `art/render_polo.py` does:**
- recolours the fabric to MASCOM gold, keeping the model's knit texture
- makes the buttons pearl white
- stitches a small "M" on the chest
- prints **IIM** over **AMRITSAR** across the upper back
- renders the turntable with soft studio lighting

To change any of that, edit the script and re-render with Blender 4.2 or later:

```sh
python art/fetch_polo.py art/.cache                                                         # once, ~100 MB
blender -b art/.cache/polo_src.blend -P art/render_polo.py -- app/src/main/assets/polo full  # all 120 frames
blender -b art/.cache/polo_src.blend -P art/render_polo.py -- /tmp/polo preview             # 4 test frames
```

It uses the GPU (OptiX or CUDA) when one is available.

## Release signing

`assembleRelease` signs with the key named in `keystore.properties`: `storeFile`, `storePassword`, `keyAlias` and `keyPassword`. Both that file and the `*.jks` it points to are gitignored.

**Back up both.** Android only installs an update if it is signed with the same key, and a lost key can't be recovered. Without `keystore.properties`, release builds fall back to the debug key.

## Not in the app yet

- The staff-only console sections: drops, collections, runs & coupons, people. Use the website for those.
- Opening a product that isn't live. The server has no single-product route, so the app can only show products in the `/api/products` list.
