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
