# Báo cáo bóc tách: com.stamp.solit

## Manifest

- **package**: com.stamp.solit
- **app_name**: 
- **version_code**: 14

## Engine

- Unity (assets/bin/Data)
- Unity IL2CPP metadata

## Native libs


## SDK nhận diện từ DEX (số class)

- Mintegral: 8407
- ironSource / LevelPlay: 6832
- Unity Ads: 5765
- Moloco: 5627
- InMobi: 5026
- Pangle: 4935
- AppLovin MAX: 3833
- Vungle / Liftoff: 2127
- AdMob / Google Ads: 1975
- AppsFlyer: 1771
- Facebook Audience Network: 470
- Google Play Billing: 438
- Unity Engine (Java): 306
- Firebase Remote Config: 219
- Firebase Messaging: 183
- Fyber / DT Exchange: 58
- Firebase Analytics: 40
- Chartboost: 23
- Yandex Ads: 19

## Kích thước (143.3MB tổng, 1645 file)

| Thư mục | Kích thước |
|---|---|
| assets | 65.8MB |
| classes8.dex | 8.4MB |
| classes6.dex | 8.4MB |
| classes5.dex | 8.4MB |
| classes9.dex | 8.2MB |
| classes11.dex | 8.1MB |
| classes7.dex | 8.1MB |
| classes10.dex | 8.0MB |
| classes4.dex | 7.5MB |
| classes.dex | 7.2MB |
| res | 2.1MB |
| classes2.dex | 1.6MB |
| resources.arsc | 1.3MB |
| classes3.dex | 96.8KB |
| explorestack | 96.4KB |

### 25 file lớn nhất

- assets/bin/Data/datapack.unity3d (34.6MB)
- assets/bin/Data/Managed/Metadata/global-metadata.dat (14.5MB)
- classes8.dex (8.4MB)
- classes6.dex (8.4MB)
- classes5.dex (8.4MB)
- classes9.dex (8.2MB)
- classes11.dex (8.1MB)
- classes7.dex (8.1MB)
- assets/bin/Data/data.unity3d (8.1MB)
- classes10.dex (8.0MB)
- classes4.dex (7.5MB)
- classes.dex (7.2MB)
- assets/audience_network.dex (4.8MB)
- classes2.dex (1.6MB)
- resources.arsc (1.3MB)
- assets/bin/Data/unity default resources (1.1MB)
- assets/iads/index.js (840.9KB)
- assets/bin/Data/sharedassets1.resource (563.1KB)
- assets/iads/sdk_controller.min.gz.js (552.9KB)
- assets/bin/Data/Managed/Resources/mscorlib.dll-resources.dat (329.7KB)
- classes3.dex (96.8KB)
- assets/bin/Data/Managed/Resources/System.Data.dll-resources.dat (91.5KB)
- res/raw/omid_session_client_v1_6_2.js (69.2KB)
- assets/ad-viewer/omid-session-client-v1.js (66.5KB)
- assets/bin/Data/sharedassets0.resource (62.3KB)

## File text đã trích xuất (26) → `extracted/`

### Có từ khoá game design

- assets/UnityServicesProjectConfiguration.json
- assets/iads/index.js
- assets/iads/sdk_controller.min.gz.js

### Còn lại

- assets/ad-viewer/omid-session-client-v1.js
- assets/ad-viewer/omsdk-v1.js
- assets/com.moloco.sdk.xenoss.sdkdevkit.mraid.js
- assets/google-services-desktop.json
- assets/mbridge_download_dialog_view.xml
- assets/mobilefuse/mraid.js
- assets/mobilefuse/mraid.src.js
- assets/mobilefuse/mraid_close_controls.js
- assets/mobilefuse/mraid_close_controls.src.js
- assets/mobilefuse/vast.js
- assets/mobilefuse/vast.src.js
- assets/mraid-bridge.js
- assets/mraid.js
- assets/rv_binddatas.xml
- res/raw/applovin_consent_flow_unified_cmp.json
- res/raw/applovin_settings.json
- res/raw/firebase_common_keep.xml
- res/raw/inmobi_omid_js.js
- res/raw/keep_cronet_api.xml
- res/raw/mobilefuse_omsdk_v1.js
- res/raw/omid_session_client_v1_6_2.js
- res/raw/omsdk_v1_5_3.js
- res/raw/omsdk_v1_6_2.js

## Unity → `unity/`

### TextAsset

- TextAsset/nv-constant-template.txt (819B)
- TextAsset/BillingMode.txt (29B)
- TextAsset/nv-emphasis-template.txt (995B)
- TextAsset/IAPProductCatalog.txt (3.4KB)
- TextAsset/LineBreaking Leading Characters.txt (95B)
- TextAsset/nv-pattern-template.txt (251B)
- TextAsset/LineBreaking Following Characters.txt (269B)

### MonoBehaviour / ScriptableObject (tên: số lượng)

- <unreadable typetree>: 4666
- <noname:963>: 1
- <noname:1013>: 1
- <noname:1014>: 1
- <noname:1046>: 1

### Lỗi khi đọc Unity

- Dừng sau 20000 object; tăng --unity-limit nếu cần.

## Gợi ý bước tiếp theo

- Grep `extracted/` và `unity/` theo: level, difficulty, booster, coin, reward, interstitial, cooldown, price.
- Nếu là Unity IL2CPP: `global-metadata.dat` + `libil2cpp.so` cho phép dump tên class/method (Il2CppDumper) để hiểu hệ thống.
- Nếu có Firebase Remote Config: tìm file `remote_config_defaults` / `*.xml` trong res/xml.
- Đối chiếu string resources (`strings.json`) để xác định tên tính năng, event, booster hiển thị cho người chơi.