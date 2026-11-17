# Notification popup uploads

Upload GIF, PNG, JPG, JPEG, WEBP or BMP images directly into **this folder**. Pictures dropped on the repository's main page are ignored. The workflow maintains `latest.json`; Liquid Dark checks it every second while the app is open and shows a new picture in its in-app popup, once per phone.

## Send the same picture again

GitHub makes **no commit** when you upload a file that is identical to the one already there (same name, same picture), so nothing can start the workflow. Two ways to send it again anyway. Each one counts as a brand-new send:

1. **Drop a resend file (easiest).** In this folder choose **Add file > Create new file**, name it `resend.txt`, type any character in it and commit. The workflow sends the newest picture again and deletes `resend.txt` by itself, so you can create it again next time.
2. **Upload the picture under a different name**, for example `character-2.png`.

Keep ONE picture in this folder. If older pictures are still there and you delete the newest, the next-newest one becomes the popup picture and is shown again as new (it gets a new stamp). Delete every picture to remove the popup picture.

## Allow notifications card

This same picture is shown on the **Allow notifications** card (separate from the background-activity picture in `background-allow-gif-pic/`). **While notifications are OFF for the app, the card shows every time the app is opened** (cold start, or coming back after 10 s or more away) until the person allows them. **Later** only hides it until the next open. If no picture is here, the card shows plain text. When notifications are already on, the picture shows once per upload, as before.

When background activity is off too, the notification card comes first and the background-activity card follows **10 seconds after this card is gone** (Allow, Later or Back), never at the same time.
