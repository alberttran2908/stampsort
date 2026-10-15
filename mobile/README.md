# Vỏ iOS cho prototype Stamp Sort (Capacitor 8)

App iOS bọc bản web `prototype/stamp` (WKWebView, chạy offline, không cần server).

## Build và cài lên iPhone

```bash
cd mobile
npm install            # lần đầu
npm run sync           # build web (tools/deploy_web.sh --build-only) -> www/ -> ios/App/App/public
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -destination 'generic/platform=iOS' -derivedDataPath build \
  -allowProvisioningUpdates -allowProvisioningDeviceRegistration \
  DEVELOPMENT_TEAM=<TEAM_ID> CODE_SIGN_STYLE=Automatic build
xcrun devicectl device install app --device <device id> build/Build/Products/Debug-iphoneos/App.app
xcrun devicectl device process launch --device <device id> games.notbad.stampsort
```

- Team ID không ghi vào project (repo public), truyền bằng `DEVELOPMENT_TEAM=` khi build.
- Bundle id: `games.notbad.stampsort`. Chỉ màn dọc. Icon: `ios/App/App/Assets.xcassets/AppIcon.appiconset`.
- Danh sách máy: `xcrun devicectl list devices`.
- Plugin native: `@capacitor/haptics` 8.0.2 (rung 4 bậc, gọi từ `prototype/stamp/src/haptics.js` qua `window.Capacitor.Plugins.Haptics`). Thêm plugin mới thì chạy lại `npm run sync`.
- `@capacitor/local-notifications` 8.3.1 (L11, thông báo nhẹ mặc định tắt, chỉ hỏi quyền sau lần giao Thư hôm nay thứ 3; gọi từ `prototype/stamp/src/notify.js`). Thông báo cục bộ trên iOS không cần khai báo thêm trong Info.plist.
