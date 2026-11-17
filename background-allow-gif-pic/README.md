# background-allow-gif-pic/

Put ONE picture or GIF here (gif, png, jpg, jpeg, webp or bmp, any file name). It opens a full-screen popup in the app that takes the person straight to Android's **Battery usage > Allow background activity** page for Liquid Dark (so music and listening stats keep working in the background).

- **While Android's background activity is OFF for the app, the popup shows every time the app is opened** (cold start, or coming back after 10 s or more away) until the person allows it. **Later** only hides it until the next open. If no picture is here, the same card shows with plain text.
- It also shows **every time you upload a new picture**, even for people who already allowed background activity before.
- Each upload shows once per phone. Uploading the same picture again does nothing, unless you add a file named `resend.txt` here (the workflow deletes it again) or use Run workflow with "Send the background-allow picture again" ticked.
- The newest picture in this folder wins. No picture here = plain text card (only while background activity is off).
- Live: no new APK is needed. The app looks at this folder **every second (1000 ms)** while it is open.
- Keep the file small. The repository is public, so do not upload anything private.

- **Order:** if notifications are off too, the notification card (picture from `notification-popup-gif-pic/`) comes first; this card follows **10 seconds after the notification card is gone**, never at the same time.
