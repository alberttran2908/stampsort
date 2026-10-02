// Toàn bộ chữ người chơi thấy. Quy tắc (docs/design/ftue-copy.md):
//  - mỗi câu <= ~8 từ, một ý, bắt đầu bằng động từ; từ khoá trong <em>
//  - từ vựng cố định: "crown stamp" (lá mở ô, có vương miện) ≠ "Golden Stamp" (Joker); "slot" = ô trống, "pile" = ô đã mở
// Chọn ngôn ngữ: ?lang=vi | ?lang=en, hoặc theo máy (vi* -> vi), hoặc nút trong Pause.

const STR = {
  en: {
    // HUD / banner
    moves: 'MOVES', piles: 'Piles {done}/{total}', combo: 'Combo x{n}',
    goal: 'Fill <b>{n} piles</b> · {moves}', goalMoves: '{n} moves', goalInf: 'unlimited moves',
    hard: 'HARD LEVEL', superhard: 'SUPER HARD LEVEL', level: 'Level {n}',
    // kịch bản level 1 (8 bước, theo video)
    script_1_0: 'Drag the <em>crown stamp</em> to an empty slot.',
    script_1_1: 'Add a <em>matching</em> stamp to its pile.',
    script_1_2: 'No match? Tap the <em>deck</em>.',
    script_1_3: 'New crown stamp! Start another pile.',
    script_1_4: '<em>Stack</em> stamps of the same kind.',
    script_1_5: 'A whole <em>stack</em> moves together.',
    script_1_6: 'Send the stack in <em>1 move</em>!',
    script_1_7: 'Fill every pile to <em>win</em>!',
    script_pack: 'Tap <em>Pack</em>: 2 hidden stamps jump in.',
    script_stamper: 'Tap <em>Stamper</em>, then tap the pile.',
    script_joker: 'Tap <em>Joker</em>, then tap a column.',
    // gợi ý lần đầu (just-in-time)
    tip_moves: 'Each drag or deck tap = <em>1 move</em>.',
    tip_draw: 'No match? Tap the <em>deck</em>.',
    tip_crown: '<em>Crown stamp</em>: starts a new pile.',
    tip_stack: 'Stack <em>same-kind</em> stamps on the table.',
    tip_empty: '<em>Empty column</em>: any stack fits.',
    tip_full: 'All slots busy. <em>Finish a pile</em> first.',
    tip_complete: 'Pile full! Its slot is <em>free</em> again.',
    tip_recycle: 'Deck refilled. <em>No move</em> used.',
    tip_low: 'Only <em>{n} moves</em> left. Plan ahead!',
    tip_combo: '<em>Combo!</em> Fill piles in a row for coins.',
    tip_peek: 'Tap a pile to <em>see</em> its stamps.',
    tip_useBooster: 'Tap <em>{name}</em> any time.',
    // lỗi: dạy khi sai (ngắn, nói cách làm đúng)
    err_need_crown: 'Empty slots need a <em>crown stamp</em>.',
    err_wrong_pile: 'This pile takes <em>{topic}</em> only.',
    err_wrong_stack: 'Only <em>same-kind</em> stamps stack.',
    err_crown_on_stamp: 'Crown stamps go to <em>empty slots</em>.',
    err_no_pile: 'Find its <em>crown stamp</em> first.',
    err_slots_busy: 'All slots busy. <em>Finish a pile</em>.',
    err_facedown: 'Hidden stamp. Clear the ones <em>on top</em>.',
    err_no_place: 'No spot for it <em>yet</em>.',
    follow: 'Follow the <em>hand</em>.',
    peek: '{topic}: <em>{n} more</em> to go',
    // trạng thái / booster
    overtime_big: 'OVERTIME!', overtime: 'Out of moves… <em>keep going, free!</em>',
    rescue: 'Stuck? Here’s a <em>free Golden Stamp</em>!',
    autofinish: 'Auto finish!', coins_short: 'Not enough coins', unlocks: 'Unlocks at level {n}',
    nothing_undo: 'Nothing to undo', no_hint: 'No good move. Try a booster.', try_deck: 'Try the deck',
    joker_place: 'Tap a column for the <em>Golden Stamp</em>.',
    pick_pack: 'Tap a pile: <em>+2 hidden stamps</em>.', pick_stamper: 'Tap a pile: <em>+1 stamp</em>.',
    open_pile_first: 'Open a pile first', none_left: 'No stamps of that kind left',
    tap_pile: 'Tap the <em>glowing</em> pile.', tap_column: 'Tap the <em>glowing</em> column.',
    // booster
    b_hint: 'Hint', b_pack: 'Pack', b_stamper: 'Stamper', b_joker: 'Joker', b_undo: 'Undo',
    bi_hint: 'Shows a good next move.', bi_pack: 'Pulls <b>2 hidden stamps</b> into a pile.',
    bi_stamper: 'Adds <b>1 stamp</b> to the pile you pick.', bi_joker: 'Any stamp can stack on the <b>Golden Stamp</b>.',
    booster: 'New: {name}', free_n: '+{n} free', claim: 'Claim',
    // panel
    howto: 'How to Play', got_it: 'Got it',
    r1: 'A <b>crown stamp</b> starts a pile.', r2: 'Add <b>matching</b> stamps to it.',
    r3: 'A full pile is <b>sent</b>. Slot frees.', r4: 'Fill all piles before <b>moves</b> run out.',
    r5: 'On the table, stack <b>same-kind</b> stamps.', r6: 'Wrong moves are free. Take your time!',
    win_title: 'Perfect!', win_last: 'All Delivered!', win_sub: 'All piles filled!', moves_left: '{n} moves left',
    win_end: 'That was the last level. Thanks for playing!',
    claim2: 'Claim x2 <small>(ad)</small>', cont: 'Continue', home: 'Home',
    oom_title: 'Out of Moves', oom_body: '<b>{n} piles</b> still to fill.', oom_body2: 'Get more moves, or retry.',
    more_ad: '+5 moves <small>(free ad)</small>', more_coins: '+5 moves <small>{n} coins</small>', retry: 'Retry',
    soclose: 'So Close!', soclose_body: 'Hard level: try again <b>for free</b>.', try_again: 'Try again',
    stuck_title: 'No Moves Left', stuck_body: 'No stamp can go anywhere.',
    use_joker: 'Use a Joker', use_pack: 'Use a Pack', extra_slot: 'Extra slot', undo: 'Undo',
    paused: 'Paused', resume: 'Resume', restart: 'Restart', sound_on: 'Sound: On', sound_off: 'Sound: Off', lang: 'Language: English',
    extra_title: 'Extra Slot', extra_body: 'One more slot for this level.', free_ad: 'Free <small>(ad)</small>', coins: '{n} coins', close: 'Close',
    play: 'Play  Level {n}', ad_break: 'Ad Break',
  },
  vi: {
    moves: 'NƯỚC', piles: 'Chồng {done}/{total}', combo: 'Combo x{n}',
    goal: 'Lấp đầy <b>{n} chồng</b> · {moves}', goalMoves: '{n} nước', goalInf: 'không giới hạn nước',
    hard: 'LEVEL KHÓ', superhard: 'LEVEL SIÊU KHÓ', level: 'Level {n}',
    script_1_0: 'Kéo <em>tem vương miện</em> vào ô trống.',
    script_1_1: 'Thêm tem <em>cùng loại</em> vào chồng.',
    script_1_2: 'Hết tem hợp? Chạm <em>bộ bài</em>.',
    script_1_3: 'Tem vương miện mới! Mở thêm chồng.',
    script_1_4: '<em>Xếp chồng</em> các tem cùng loại.',
    script_1_5: 'Cả <em>chồng</em> đi cùng nhau.',
    script_1_6: 'Đưa cả chồng vào ô: <em>1 nước</em>!',
    script_1_7: 'Lấp đầy mọi chồng để <em>thắng</em>!',
    script_pack: 'Chạm <em>Nam châm</em>: hút 2 tem ẩn vào.',
    script_stamper: 'Chạm <em>Con dấu</em>, rồi chạm chồng.',
    script_joker: 'Chạm <em>Tem Vàng</em>, rồi chạm một cột.',
    tip_moves: 'Mỗi lần kéo hoặc rút = <em>1 nước</em>.',
    tip_draw: 'Hết tem hợp? Chạm <em>bộ bài</em>.',
    tip_crown: '<em>Tem vương miện</em>: mở chồng mới.',
    tip_stack: 'Xếp tem <em>cùng loại</em> lên nhau.',
    tip_empty: '<em>Cột trống</em>: chồng nào cũng vào.',
    tip_full: 'Hết ô trống. <em>Lấp đầy một chồng</em> trước.',
    tip_complete: 'Chồng đã đầy! Ô <em>trống lại</em>.',
    tip_recycle: 'Nạp lại bộ bài. <em>Không tốn nước</em>.',
    tip_low: 'Còn <em>{n} nước</em>. Tính kỹ nhé!',
    tip_combo: '<em>Combo!</em> Giao liên tiếp được xu.',
    tip_peek: 'Chạm chồng để <em>xem</em> tem của nó.',
    tip_useBooster: 'Chạm <em>{name}</em> khi cần.',
    err_need_crown: 'Ô trống cần <em>tem vương miện</em>.',
    err_wrong_pile: 'Chồng này chỉ nhận <em>{topic}</em>.',
    err_wrong_stack: 'Chỉ xếp tem <em>cùng loại</em>.',
    err_crown_on_stamp: 'Tem vương miện vào <em>ô trống</em>.',
    err_no_pile: 'Tìm <em>tem vương miện</em> của nó trước.',
    err_slots_busy: 'Hết ô trống. <em>Lấp đầy một chồng</em>.',
    err_facedown: 'Tem úp. Dọn tem <em>phía trên</em> trước.',
    err_no_place: 'Tem này <em>chưa có chỗ</em>.',
    follow: 'Làm theo <em>bàn tay</em>.',
    peek: '{topic}: còn <em>{n} tem</em>',
    overtime_big: 'GIỜ BÙ!', overtime: 'Hết nước… <em>chơi tiếp miễn phí!</em>',
    rescue: 'Bí rồi? Tặng bạn <em>Tem Vàng</em>!',
    autofinish: 'Tự hoàn thành!', coins_short: 'Không đủ xu', unlocks: 'Mở ở level {n}',
    nothing_undo: 'Chưa có gì để hoàn tác', no_hint: 'Không có nước hay. Thử booster.', try_deck: 'Thử rút bài',
    joker_place: 'Chạm một cột để đặt <em>Tem Vàng</em>.',
    pick_pack: 'Chạm một chồng: <em>+2 tem ẩn</em>.', pick_stamper: 'Chạm một chồng: <em>+1 tem</em>.',
    open_pile_first: 'Mở một chồng trước đã', none_left: 'Không còn tem loại này',
    tap_pile: 'Chạm chồng đang <em>sáng</em>.', tap_column: 'Chạm cột đang <em>sáng</em>.',
    b_hint: 'Gợi ý', b_pack: 'Nam châm', b_stamper: 'Con dấu', b_joker: 'Tem Vàng', b_undo: 'Hoàn tác',
    bi_hint: 'Chỉ nước đi tốt tiếp theo.', bi_pack: 'Hút <b>2 tem ẩn</b> vào một chồng.',
    bi_stamper: 'Thêm <b>1 tem</b> vào chồng bạn chọn.', bi_joker: 'Tem nào cũng xếp được lên <b>Tem Vàng</b>.',
    booster: 'Mới: {name}', free_n: '+{n} miễn phí', claim: 'Nhận',
    howto: 'Cách chơi', got_it: 'Hiểu rồi',
    r1: '<b>Tem vương miện</b> mở một chồng.', r2: 'Thêm tem <b>cùng loại</b> vào chồng.',
    r3: 'Chồng đầy thì <b>gửi đi</b>, ô trống lại.', r4: 'Lấp đầy mọi chồng trước khi <b>hết nước</b>.',
    r5: 'Trên bàn, xếp tem <b>cùng loại</b> lên nhau.', r6: 'Đi sai không mất gì. Cứ thong thả!',
    win_title: 'Tuyệt vời!', win_last: 'Giao xong hết!', win_sub: 'Đã lấp đầy mọi chồng!', moves_left: 'còn {n} nước',
    win_end: 'Đây là level cuối. Cảm ơn bạn đã chơi!',
    claim2: 'Nhận x2 <small>(quảng cáo)</small>', cont: 'Tiếp tục', home: 'Trang chủ',
    oom_title: 'Hết nước', oom_body: 'Còn <b>{n} chồng</b> chưa đầy.', oom_body2: 'Thêm nước để chơi tiếp, hoặc chơi lại.',
    more_ad: '+5 nước <small>(quảng cáo)</small>', more_coins: '+5 nước <small>{n} xu</small>', retry: 'Chơi lại',
    soclose: 'Suýt nữa!', soclose_body: 'Level khó: chơi lại <b>miễn phí</b>.', try_again: 'Chơi lại',
    stuck_title: 'Hết đường đi', stuck_body: 'Không tem nào đi được nữa.',
    use_joker: 'Dùng Tem Vàng', use_pack: 'Dùng Nam châm', extra_slot: 'Ô phụ', undo: 'Hoàn tác',
    paused: 'Tạm dừng', resume: 'Chơi tiếp', restart: 'Chơi lại', sound_on: 'Âm thanh: Bật', sound_off: 'Âm thanh: Tắt', lang: 'Ngôn ngữ: Tiếng Việt',
    extra_title: 'Ô phụ', extra_body: 'Thêm một ô cho level này.', free_ad: 'Miễn phí <small>(quảng cáo)</small>', coins: '{n} xu', close: 'Đóng',
    play: 'Chơi  Level {n}', ad_break: 'Quảng cáo',
  },
};

function detect() {
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
