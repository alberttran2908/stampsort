// Toàn bộ chữ người chơi thấy. Quy tắc (docs/design/ftue-copy.md):
//  - mỗi câu <= ~8 từ, một ý, bắt đầu bằng động từ; từ khoá trong <em>
//  - từ vựng cố định: "crown stamp" (lá mở ô, có vương miện) ≠ "Golden Stamp" (Joker); "slot" = ô trống, "pile" = ô đã mở
// Chọn ngôn ngữ: ?lang=vi | ?lang=en, hoặc theo máy (vi* -> vi), hoặc nút trong Pause.

const STR = {
  en: {
    // HUD / banner
    moves: 'MOVES', piles: '{done}/{total}', combo: 'Combo x{n}',
    goal: 'Send <b>{n} letters</b> · {moves}', goalMoves: '{n} moves', goalInf: 'unlimited moves',
    hard: 'BUSY DAY', superhard: 'HOLIDAY RUSH', level: 'Level {n}', to_resident: 'to {name}',
    // kịch bản level 1 (8 bước, theo video)
    script_1_0: 'Drag the <em>crown stamp</em> to an empty slot.',
    script_1_1: 'Add a <em>matching</em> stamp to its slot.',
    script_1_2: 'Tap the <em>deck</em> for new stamps.',
    script_1_3: 'New crown stamp! Open another slot.',
    script_1_4: '<em>Stack</em> same-kind stamps on a column.',
    script_1_5: 'Grab the stack: <em>it all moves</em>.',
    script_1_6: 'Send the stack in <em>1 move</em>!',
    script_1_7: 'Send every letter to <em>win</em>!',
    script_pack: 'Tap <em>Magnet</em>: 2 hidden stamps jump in.',
    script_stamper: 'Tap <em>Stamper</em>, then tap a column.',
    script_joker: 'Tap <em>Joker</em>, then tap a column.',
    // gợi ý lần đầu (just-in-time)
    tip_moves: 'Each drag or deck tap = <em>1 move</em>.',
    tip_draw: 'No match? Tap the <em>deck</em>.',
    tip_crown: '<em>Crown stamp</em>: opens a new slot.',
    tip_stack: 'Stack <em>same-kind</em> stamps on columns.',
    tip_empty: '<em>Empty column</em>: park any stack there.',
    tip_full: 'No empty slot. <em>Fill a slot</em> first.',
    tip_complete: 'Slot full! Sent. It’s <em>free</em> again.',
    tip_recycle: 'Deck refilled. <em>No move</em> used.',
    tip_low: 'Only <em>{n} moves</em> left. Plan ahead!',
    tip_combo: '<em>Combo!</em> Fill slots in a row for coins.',
    tip_peek: 'Tap a slot to <em>see</em> its stamps.',
    tip_useBooster: 'Tap <em>{name}</em> any time.',
    // lỗi: dạy khi sai (ngắn, nói cách làm đúng)
    err_need_crown: 'Empty slots need a <em>crown stamp</em>.',
    err_wrong_pile: 'This slot takes <em>{topic}</em> only.',
    err_wrong_stack: 'Only <em>same-kind</em> stamps stack.',
    err_crown_on_stamp: 'Crown stamps go to <em>empty slots</em>.',
    err_no_pile: 'Find its <em>crown stamp</em> first.',
    err_slots_busy: 'No empty slot. <em>Fill a slot</em> first.',
    err_mixed: 'Only <em>same-kind</em> stacks move together.',
    err_last_slot: 'Last free slot! <em>Drag</em> it there if you are sure.',
    col_free: 'Column free!',
    album: 'Album', album_title: 'Stamp Album', album_count: '{n}/{total} stamps collected', close: 'Close',
    chapter_title: 'Chapter {n} complete!', chapter_body_1: 'Main Street is all caught up. Everyone got their letters.',
    chapter_body_2: 'The Harbor is all caught up. Next stop: Tea Hill, coming soon!', more_soon: 'More levels soon', open_album: 'Open album',
    err_facedown: 'Hidden stamp. Clear the ones <em>on top</em>.',
    err_no_place: 'No spot for it <em>yet</em>.',
    follow: 'Not yet! Follow the <em>hand</em>.',
    peek: '{topic}: <em>{n} more</em> to go',
    // trạng thái / booster
    overtime_big: 'Evening shift', overtime: 'The post office stays open. <em>Finish at your pace.</em>',
    rescue: 'Stuck? Here’s a <em>free Golden Stamp</em>!', rescue_magnet: 'Stuck? Here’s a <em>free Magnet</em>. Tap it!',
    autofinish: 'Auto finish!', coins_short: 'Not enough coins', unlocks: 'Unlocks at level {n}',
    nothing_undo: 'Nothing to undo', no_hint: 'No good move. Try a booster.', try_deck: 'Try the deck',
    joker_place: 'Tap a column for the <em>Golden Stamp</em>.',
    pick_pack: 'Tap a slot: <em>+2 hidden stamps</em>.', pick_stamper: 'Tap a column: <em>flip its hidden stamps</em>.', no_hidden: 'No hidden stamps left on the columns.',
    open_pile_first: 'Open a slot first', none_left: 'No stamps of that kind left',
    tap_pile: 'Tap the <em>glowing</em> slot.', tap_column: 'Tap the <em>glowing</em> column.',
    // booster
    b_hint: 'Hint', b_pack: 'Magnet', b_stamper: 'Stamper', b_joker: 'Joker', b_undo: 'Undo',
    bi_hint: 'Shows a good next move.', bi_pack: 'Pulls <b>2 hidden stamps</b> into a slot.',
    bi_stamper: 'Flips <b>every hidden stamp</b> in one column.', bi_joker: 'Any stamp can stack on the <b>Golden Stamp</b>.',
    booster: 'New: {name}', free_n: '+{n} free', claim: 'Claim',
    // panel
    howto: 'How to Play', got_it: 'Got it',
    r1: 'A <b>crown stamp</b> opens a slot.', r2: 'Add <b>matching</b> stamps to it.',
    r3: 'A full slot is <b>sent</b> as a letter.', r4: 'Send all letters before <b>moves</b> run out.',
    r5: 'On columns, stack <b>same-kind</b> stamps.', r6: 'Wrong moves are <b>free</b>. Undo anytime.',
    win_title: 'Perfect!', win_last: 'All Delivered!', win_sub: 'All slots filled!', moves_left: '{n} moves left',
    win_end: 'That was the last level. Thanks for playing!',
    claim2: 'Claim x2 <small>(ad)</small>', cont: 'Continue', home: 'Home',
    oom_title: 'Out of Moves', oom_body: '<b>{n}</b> letters left to send.', coins_need: 'Need {n} more coins', oom_body2: 'Get more moves, or retry.',
    more_ad: '+5 moves <small>▶ ad</small>', more_coins: '+5 moves <small>{n} coins</small>', retry: 'Retry',
    soclose: 'So Close!', soclose_body: 'Hard level: try again <b>for free</b>.', try_again: 'Try again',
    stuck_title: 'No Moves Left', stuck_body: 'No stamp can go anywhere.',
    use_joker: 'Use a Joker', use_pack: 'Use a Magnet', extra_slot: 'Extra slot', undo: 'Undo',
    paused: 'Paused', resume: 'Resume', restart: 'Restart', sound_on: 'Sound: On', sound_off: 'Sound: Off', lang: 'Language: English',
    extra_title: 'Extra Slot', extra_body: 'One more slot for this level.', free_ad: 'Free <small>(ad)</small>', coins: '{n} coins', close: 'Close',
    play: 'Play  Level {n}', ad_break: 'Ad Break',
    win_great: 'Great!', win_ok: 'Well done!', stars_hint: 'More moves left = more Stamp Points',
    pts_name: 'Stamp Points', pts_gain: '+{n} <i></i> Stamp Points', pts_best: 'Best: {n} <i></i>', pts_have: 'You have {n} <i></i>',
    pts_need: 'Need {n} more. Replay a level with more moves left.', decorate: 'Decorate', decor_place: 'Place · {n} <i></i>',
    decor_done: 'All decor for this chapter is in place. Lovely!',
    ch2_title: 'Chapter 2', ch2_sub: 'The Harbor · coming soon', ch2_soon: 'SOON', ch2_stamps: 'New stamps', ch2_decor: 'New decor for your post office',
    ch2_npc: '<b>Captain Bo</b> keeps the lighthouse. He draws the weather on his letters instead of writing.',
    ch2_tip: 'Meanwhile: replay levels for more Stamp Points.', ch2_notify: 'Notify me', ch2_notified: 'We\'ll let you know!',
    ch_name_1: 'Chapter 1 · Main Street', ch_name_2: 'Chapter 2 · The Harbor', next_ch: 'Chapter {n} →',
    ch2_sub_open: 'The Harbor · now open', ch2_open: 'OPEN',
    decor_fan: 'Ceiling fan', decor_porthole: 'Porthole', decor_buoy: 'Life ring', decor_lantern: 'Ship lantern', decor_chart: 'Sea chart', decor_boatbed: 'Pip\'s boat bed',
    decor_bunting: 'Bunting', decor_frame: 'Stamp frame', decor_clock: 'Wall clock', decor_postbox: 'Post box', decor_board: 'Notice board', decor_cat: 'Cat basket', extra_label: '+1 slot', b_undo_icon: '↶',
  },
  vi: {
    moves: 'NƯỚC', piles: '{done}/{total}', combo: 'Combo x{n}',
    goal: 'Gửi <b>{n} lá thư</b> · {moves}', goalMoves: '{n} nước', goalInf: 'không giới hạn nước',
    hard: 'NGÀY BẬN RỘN', superhard: 'CAO ĐIỂM LỄ', level: 'Level {n}', to_resident: 'gửi {name}',
    script_1_0: 'Kéo <em>tem vương miện</em> vào ô trống.',
    script_1_1: 'Thêm tem <em>cùng loại</em> vào ô đó.',
    script_1_2: 'Chạm <em>bộ bài</em> để lấy tem mới.',
    script_1_3: 'Tem vương miện mới! Mở thêm ô.',
    script_1_4: '<em>Xếp</em> tem cùng loại lên nhau.',
    script_1_5: 'Cầm xấp tem: <em>cả xấp đi theo</em>.',
    script_1_6: 'Đưa cả xấp vào ô: <em>1 nước</em>!',
    script_1_7: 'Gửi hết thư để <em>thắng</em>!',
    script_pack: 'Chạm <em>Nam châm</em>: hút 2 tem ẩn vào.',
    script_stamper: 'Chạm <em>Con dấu</em>, rồi chạm một cột.',
    script_joker: 'Chạm <em>Tem Vàng</em>, rồi chạm một cột.',
    tip_moves: 'Mỗi lần kéo hoặc rút = <em>1 nước</em>.',
    tip_draw: 'Hết tem hợp? Chạm <em>bộ bài</em>.',
    tip_crown: '<em>Tem vương miện</em>: mở ô mới.',
    tip_stack: 'Xếp tem <em>cùng loại</em> lên nhau trên cột.',
    tip_empty: '<em>Cột trống</em>: gửi tạm xấp nào cũng được.',
    tip_full: 'Hết ô trống. <em>Lấp đầy một ô</em> trước.',
    tip_complete: 'Ô đầy, đã gửi! Ô <em>trống lại</em>.',
    tip_recycle: 'Nạp lại bộ bài. <em>Không tốn nước</em>.',
    tip_low: 'Còn <em>{n} nước</em>. Tính kỹ nhé!',
    tip_combo: '<em>Combo!</em> Giao liên tiếp được xu.',
    tip_peek: 'Chạm một ô để <em>xem</em> tem của nó.',
    tip_useBooster: 'Chạm <em>{name}</em> khi cần.',
    err_need_crown: 'Ô trống cần <em>tem vương miện</em>.',
    err_wrong_pile: 'Ô này chỉ nhận <em>{topic}</em>.',
    err_wrong_stack: 'Chỉ xếp tem <em>cùng loại</em>.',
    err_crown_on_stamp: 'Tem vương miện vào <em>ô trống</em>.',
    err_no_pile: 'Tìm <em>tem vương miện</em> của nó trước.',
    err_slots_busy: 'Hết ô trống. <em>Lấp đầy một ô</em>.',
    err_mixed: 'Chỉ xấp tem <em>cùng loại</em> mới nhấc cùng nhau.',
    err_last_slot: 'Ô trống cuối cùng! Chắc thì <em>kéo</em> vào nhé.',
    col_free: 'Trống một cột!',
    album: 'Album', album_title: 'Album tem', album_count: 'Đã sưu tầm {n}/{total} tem', close: 'Đóng',
    chapter_title: 'Xong chương {n}!', chapter_body_1: 'Phố Chính đã nhận đủ thư. Ai cũng vui.',
    chapter_body_2: 'Bến Cảng đã nhận đủ thư. Điểm đến tiếp theo: Đồi Trà, sắp mở!', more_soon: 'Sắp có level mới', open_album: 'Mở album',
    err_facedown: 'Tem úp. Dọn tem <em>phía trên</em> trước.',
    err_no_place: 'Tem này <em>chưa có chỗ</em>.',
    follow: 'Chưa được! Làm theo <em>bàn tay</em>.',
    peek: '{topic}: còn <em>{n} tem</em>',
    overtime_big: 'Ca tối', overtime: 'Bưu điện vẫn mở. <em>Cứ thong thả gửi nốt.</em>',
    rescue: 'Bí rồi? Tặng bạn <em>Tem Vàng</em>!', rescue_magnet: 'Bí rồi? Tặng bạn <em>Nam châm</em>. Chạm vào nhé!',
    autofinish: 'Tự hoàn thành!', coins_short: 'Không đủ xu', unlocks: 'Mở ở level {n}',
    nothing_undo: 'Chưa có gì để hoàn tác', no_hint: 'Không có nước hay. Thử booster.', try_deck: 'Thử rút bài',
    joker_place: 'Chạm một cột để đặt <em>Tem Vàng</em>.',
    pick_pack: 'Chạm một ô: <em>+2 tem ẩn</em>.', pick_stamper: 'Chạm một cột: <em>lật hết tem úp</em>.', no_hidden: 'Trên cột không còn tem úp nào.',
    open_pile_first: 'Mở một ô trước đã', none_left: 'Không còn tem loại này',
    tap_pile: 'Chạm ô đang <em>sáng</em>.', tap_column: 'Chạm cột đang <em>sáng</em>.',
    b_hint: 'Gợi ý', b_pack: 'Nam châm', b_stamper: 'Con dấu', b_joker: 'Tem Vàng', b_undo: 'Hoàn tác',
    bi_hint: 'Chỉ nước đi tốt tiếp theo.', bi_pack: 'Hút <b>2 tem ẩn</b> vào một ô.',
    bi_stamper: 'Lật ngửa <b>mọi tem úp</b> trong một cột.', bi_joker: 'Tem nào cũng xếp được lên <b>Tem Vàng</b>.',
    booster: 'Mới: {name}', free_n: '+{n} miễn phí', claim: 'Nhận',
    howto: 'Cách chơi', got_it: 'Hiểu rồi',
    r1: '<b>Tem vương miện</b> mở một ô.', r2: 'Thêm tem <b>cùng loại</b> vào ô.',
    r3: 'Ô đầy thành một <b>lá thư</b> và được gửi đi.', r4: 'Gửi hết thư trước khi <b>hết nước</b>.',
    r5: 'Trên cột, xếp tem <b>cùng loại</b> lên nhau.', r6: 'Đi sai <b>không mất nước</b>. Hoàn tác lúc nào cũng được.',
    win_title: 'Tuyệt vời!', win_last: 'Giao xong hết!', win_sub: 'Đã lấp đầy mọi ô!', moves_left: 'còn {n} nước',
    win_end: 'Đây là level cuối. Cảm ơn bạn đã chơi!',
    claim2: 'Nhận x2 <small>(quảng cáo)</small>', cont: 'Tiếp tục', home: 'Trang chủ',
    oom_title: 'Hết nước', oom_body: 'Còn <b>{n}</b> lá thư chưa gửi.', coins_need: 'Thiếu {n} xu', oom_body2: 'Thêm nước để chơi tiếp, hoặc chơi lại.',
    more_ad: '+5 nước <small>▶ quảng cáo</small>', more_coins: '+5 nước <small>{n} xu</small>', retry: 'Chơi lại',
    soclose: 'Suýt nữa!', soclose_body: 'Level khó: chơi lại <b>miễn phí</b>.', try_again: 'Chơi lại',
    stuck_title: 'Hết đường đi', stuck_body: 'Không tem nào đi được nữa.',
    use_joker: 'Dùng Tem Vàng', use_pack: 'Dùng Nam châm', extra_slot: 'Ô phụ', undo: 'Hoàn tác',
    paused: 'Tạm dừng', resume: 'Chơi tiếp', restart: 'Chơi lại', sound_on: 'Âm thanh: Bật', sound_off: 'Âm thanh: Tắt', lang: 'Ngôn ngữ: Tiếng Việt',
    extra_title: 'Ô phụ', extra_body: 'Thêm một ô cho level này.', free_ad: 'Miễn phí <small>(quảng cáo)</small>', coins: '{n} xu', close: 'Đóng',
    play: 'Chơi  Level {n}', ad_break: 'Quảng cáo',
    win_great: 'Rất tốt!', win_ok: 'Hoàn thành!', stars_hint: 'Còn nhiều nước = nhiều Tem Điểm',
    pts_name: 'Tem Điểm', pts_gain: '+{n} <i></i> Tem Điểm', pts_best: 'Cao nhất: {n} <i></i>', pts_have: 'Bạn có {n} <i></i>',
    pts_need: 'Cần thêm {n}. Chơi lại một level, còn nhiều nước hơn.', decorate: 'Trang trí', decor_place: 'Đặt · {n} <i></i>',
    decor_done: 'Decor của chương này đã đủ cả. Xinh quá!',
    ch2_title: 'Chương 2', ch2_sub: 'Bến Cảng · sắp mở', ch2_soon: 'SẮP MỞ', ch2_stamps: 'Tem mới', ch2_decor: 'Decor mới cho bưu điện',
    ch2_npc: '<b>Thuyền trưởng Bo</b> giữ hải đăng. Ông vẽ thời tiết lên thư thay vì viết chữ.',
    ch2_tip: 'Trong lúc chờ: chơi lại level để có thêm Tem Điểm.', ch2_notify: 'Báo tôi khi mở', ch2_notified: 'Sẽ báo bạn!',
    ch_name_1: 'Chương 1 · Phố Chính', ch_name_2: 'Chương 2 · Bến Cảng', next_ch: 'Chương {n} →',
    ch2_sub_open: 'Bến Cảng · đã mở', ch2_open: 'ĐÃ MỞ',
    decor_fan: 'Quạt trần', decor_porthole: 'Cửa sổ tròn', decor_buoy: 'Phao cứu sinh', decor_lantern: 'Đèn bão', decor_chart: 'Hải đồ', decor_boatbed: 'Thuyền ngủ của Pip',
    decor_bunting: 'Cờ dây', decor_frame: 'Khung tem', decor_clock: 'Đồng hồ treo', decor_postbox: 'Hòm thư', decor_board: 'Bảng ghim', decor_cat: 'Giỏ mèo ngủ', extra_label: '+1 ô', b_undo_icon: '↶',
  },
};

// Tên chủ đề tiếng Việt (tên gốc tiếng Anh theo dữ liệu level)
const TOPIC_VI = {
  Cat: 'Mèo', Fruit: 'Trái cây', Pizza: 'Pizza', Ball: 'Bóng', Dog: 'Chó', Noodle: 'Mì', Phone: 'Điện thoại', Bird: 'Chim',
  Car: 'Ô tô', Hoofed: 'Thú trang trại', Ship: 'Tàu thủy', Candy: 'Kẹo', Balloon: 'Bóng bay', Time: 'Đồng hồ', Hat: 'Mũ',
  Glasses: 'Kính', Pets: 'Thú cưng', Dinosaur: 'Khủng long', 'Fast food': 'Đồ ăn nhanh', Chess: 'Cờ vua', Flower: 'Hoa',
  Leaf: 'Lá cây', Train: 'Tàu hỏa', Tree: 'Cây', Soda: 'Nước ngọt', 'Ice cream': 'Kem', Truck: 'Xe tải', Kite: 'Diều',
  'Soft drink': 'Đồ uống', Planet: 'Hành tinh', Beast: 'Thú hoang', Notes: 'Âm nhạc', Sailboats: 'Thuyền buồm', Seafood: 'Hải sản', Shells: 'Vỏ ốc', Nautical: 'Hàng hải', Sauce: 'Nước sốt', Vegetable: 'Rau củ',
  Insect: 'Côn trùng', 'Sea life': 'Sinh vật biển', Float: 'Đồ đi biển', Tea: 'Trà', Zoo: 'Sở thú', Footwear: 'Giày dép',
  'Raw meat': 'Thịt sống', Outerwear: 'Áo khoác', Cocktail: 'Cocktail', Desserts: 'Tráng miệng', Grilled: 'Đồ nướng',
  Bouquet: 'Bó hoa', Sculpture: 'Tượng', Sashimi: 'Sashimi', 'Pet Care': 'Đồ thú cưng', 'Water Plants': 'Cây thủy sinh',
  Gardening: 'Làm vườn', Coffee: 'Cà phê', 'Music Inst': 'Nhạc cụ', Cake: 'Bánh ngọt', Aircraft: 'Máy bay', Mushroom: 'Nấm',
  Gems: 'Đá quý', Sushi: 'Sushi', Tool: 'Dụng cụ',
};
/** Tên chủ đề theo ngôn ngữ đang chọn. */
const TOPIC_EN = {
  Hoofed: 'Farm animals', Time: 'Clocks', Notes: 'Music', Float: 'Beach floats', Beast: 'Wild animals',
  'Pet Care': 'Pet supplies', Grilled: 'BBQ', 'Soft drink': 'Drinks', 'Music Inst': 'Instruments', 'Water Plants': 'Water plants',
  Pets: 'Small pets', Tool: 'Tools', Gems: 'Gems', Leaf: 'Leaves', Glasses: 'Glasses',
};
export function topicName(tp) { return lang === 'vi' ? (TOPIC_VI[tp] || tp) : (TOPIC_EN[tp] || tp); }

function detect() {
  if (typeof location === 'undefined') return 'en';            // chạy trong Node (test/tool)
  const q = location.search.match(/lang=(vi|en)/);
  if (q) return q[1];
  try { const s = localStorage.getItem('ss_lang'); if (s) return s; } catch (e) { /* ignore */ }
  return (navigator.language || 'en').toLowerCase().startsWith('vi') ? 'vi' : 'en';
}
let lang = detect();
export const getLang = () => lang;
export function setLang(l) {
  lang = l;
  try { localStorage.setItem('ss_lang', l); } catch (e) { /* ignore */ }
}
/** Lấy chuỗi theo khoá, thay {biến}. Thiếu bản dịch thì rơi về tiếng Anh, thiếu nữa thì trả khoá. */
export function t(key, vars = {}) {
  const s = (STR[lang] && STR[lang][key]) ?? STR.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}
export const has = key => !!(STR[lang] && STR[lang][key]) || !!STR.en[key];

// ---- Cư dân Wren Hollow (concept-little-post-office.md mục 3.2): chủ đề -> người nhận thư, và câu nhắn ở màn thắng (mục 3.3).
const RESIDENT_OF = {
  Sailboats: 'Bo', Seafood: 'Bo', Nautical: 'Bo', Shells: 'Lina',   // chương 2 Bến Cảng (concept 3.1: Bo, Lina)
  Cake: 'Marigold', Desserts: 'Marigold', Candy: 'Marigold', 'Fast food': 'Marigold', Pizza: 'Marigold', 'Ice cream': 'Marigold', Fruit: 'Marigold', Noodle: 'Marigold', Grilled: 'Marigold', Vegetable: 'Marigold',
  Time: 'Finch', Tool: 'Finch', Phone: 'Finch', Glasses: 'Finch', Chess: 'Finch', Train: 'Finch', Car: 'Finch', Truck: 'Finch', Aircraft: 'Finch',
  Flower: 'Lina', Bouquet: 'Lina', Gardening: 'Lina', Leaf: 'Lina', Tree: 'Lina', 'Water Plants': 'Lina', Mushroom: 'Lina', Insect: 'Lina',
  Ship: 'Bo', 'Sea life': 'Bo', Float: 'Bo', Sashimi: 'Bo', Sushi: 'Bo', Planet: 'Bo', Kite: 'Bo', Bird: 'Bo',
  Tea: 'Ines', Coffee: 'Ines', Cocktail: 'Ines', Soda: 'Ines', 'Soft drink': 'Ines', Notes: 'Ines', 'Music Inst': 'Ines', Sculpture: 'Ines',
  Cat: 'Pip', Pets: 'Pip', 'Pet Care': 'Pip', Dog: 'Pip',
};
export function residentOf(topic) { return RESIDENT_OF[topic] || 'Otto'; }
const NOTES = {
  en: {
    Marigold: ['The scones are for you. The gossip is free.', 'I baked too many. Again. Take some home.', 'Tell no one about the cake. Everyone knows already.'],
    Finch: ['Your clock is one minute fast. I fixed it. You\'re welcome.', 'Delivered on time. I checked twice.', 'Punctual. I approve, quietly.'],
    Lina: ['I put a petal in. If it fell out, that\'s fine too.', 'Thank you. The tulips say thank you too.', 'I pressed a leaf for you. It is a nice leaf.'],
    Bo: ['Sunny. Then not. Bring a hat.', 'The gulls say hi. I don\'t.', 'Letter arrived dry. Good work.',
      'Fog this morning. Drew it for you: ~~~.', 'Caught a fish. Let it go. It looked busy.', 'The lighthouse is fine. So am I. Thanks.'],
    Ines: ['Tea\'s on. The cat may not come in.', 'I remember every letter. This one was neat.', 'Mint tea today. Pip is sulking.'],
    Pip: ['Pip sat on your mail. Consider it approved.', 'Pip inspected the stamps. Pip is satisfied.', 'Pip would like a fish. Pip always would.'],
    Otto: ['Pip helps when she feels like it. So did I, at your age.', 'Good sorting, new hire. I hardly noticed.', 'Another bag done. The kettle is yours.'],
  },
  vi: {
    Marigold: ['Bánh nướng tặng bạn. Chuyện phiếm miễn phí.', 'Lại nướng dư rồi. Mang về ít nhé.', 'Đừng kể ai chuyện cái bánh. Cả phố biết rồi.'],
    Finch: ['Đồng hồ bạn nhanh một phút. Tôi chỉnh rồi. Không cần cảm ơn.', 'Giao đúng giờ. Tôi kiểm hai lần.', 'Đúng giờ. Tôi hài lòng, trong im lặng.'],
    Lina: ['Tôi kẹp một cánh hoa. Rơi mất cũng không sao.', 'Cảm ơn bạn. Mấy bông tulip cũng cảm ơn.', 'Tôi ép tặng bạn một chiếc lá. Lá đẹp lắm.'],
    Bo: ['Nắng. Rồi hết nắng. Mang mũ.', 'Mòng biển gửi lời chào. Tôi thì không.', 'Thư tới nơi vẫn khô. Làm tốt.',
      'Sáng nay có sương. Vẽ cho bạn rồi: ~~~.', 'Câu được một con cá. Thả rồi. Nó có vẻ bận.', 'Hải đăng ổn. Tôi cũng ổn. Cảm ơn.'],
    Ines: ['Trà pha rồi. Mèo không được vào.', 'Thư nào tôi cũng nhớ. Thư này gọn gàng.', 'Hôm nay trà bạc hà. Pip đang dỗi.'],
    Pip: ['Pip ngồi lên thư của bạn. Coi như đã duyệt.', 'Pip đã kiểm tem. Pip hài lòng.', 'Pip muốn một con cá. Lúc nào Pip cũng muốn.'],
    Otto: ['Pip giúp khi nó thích. Hồi bằng tuổi bạn, tôi cũng vậy.', 'Phân loại khá lắm, bạn mới. Tôi gần như không để ý.', 'Xong thêm một bao. Ấm nước là của bạn.'],
  },
};
let lastNote = '';
export function residentNote(name) {
  const pool = (NOTES[lang] || NOTES.en)[name] || NOTES.en.Otto;
  let n = pool[Math.floor(Math.random() * pool.length)];
  if (n === lastNote && pool.length > 1) n = pool[(pool.indexOf(n) + 1) % pool.length];
  lastNote = n;
  return n;
}
