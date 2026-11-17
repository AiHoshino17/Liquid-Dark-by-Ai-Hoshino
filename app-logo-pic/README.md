# App logo uploads

The newest picture in this folder is the **app logo**. It does two things:

- **Launcher icon (needs the update):** the GitHub build bakes the picture into the APK as the home-screen / app-drawer icon (square, round and Android 8+ adaptive). Every new upload (or `resend`) changes `latest.json` and the picture's bytes, which changes the app fingerprint, so GitHub builds a new APK and phones are offered the update. After the user installs it, the new icon is on the home screen. The build prints which picture it used in the run summary, and fails the check step if the finished APK has no icon when one was uploaded.
- **Live logo in Settings > About (within seconds):** the app checks `app-logo-pic/latest.json` about once a second while open and shows the newest picture, no update needed.

Upload the picture directly into this folder: PNG, JPG, JPEG, WEBP, BMP or GIF (any file name). Square pictures work best; other shapes are never cropped (on Android 8+ they sit on a dark background, on older Android on a blurred copy of themselves), transparent PNGs get a dark background behind them, and a GIF uses its first frame that has real content. The workflow maintains `latest.json`; do not edit it by hand.

With the folder empty there is no logo: Android shows its own generic icon and nothing appears in About. If a picture is there but cannot be used (corrupt, wrong type), the build still finishes with the generic icon and shows a yellow warning in the Actions run saying why.

To send the same picture again: create `resend.txt` here, upload the picture under a different name, or use **Actions > Liquid Dark build > Run workflow** and tick **Send the app logo again to everybody**.

The opening splash picture is separate (`splash-pic/`).

## Shape of the launcher icon (v208+, owner's order: nothing cut)

Android 8+ shows only the middle two-thirds (72 of 108 dp) of an adaptive icon, then trims it to the phone's shape (circle, squircle, rounded square). The build therefore **fits the whole picture into that visible part**, so nothing of it is cut. The old layout (BUG-162) made the picture fill the full 108 dp, which cut the outer third of any full-bleed picture; it is gone.

- **Android 8+ (adaptive icon):** the picture's longest side is scaled to the visible part of the icon on a plain dark background. A non-square picture is never cropped; the free space is plain dark. A circular mask still trims the four corners of a square picture a little, so keep anything important out of the very corners.
- **Older Android (7 and below):** unchanged: an almost square picture fills the square and round icons. Other shapes sit on a blurred copy of themselves.
- **Quality:** the picture is only resized down (Lanczos), never blurred or recompressed. 1024 x 1024 PNG is plenty (Android shows the icon at 432 px at most). Settings > About shows your original file.
