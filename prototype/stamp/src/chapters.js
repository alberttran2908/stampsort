// Chương của chiến dịch (R5, docs/design/30-day-plan.md mục 2 và liveops-30-days.md mục 7.1).
// Ch1–2: 10 level (FTUE thưởng nhanh). Từ ch3: 20 level mỗi chương. 13 chương phủ L1–L240 (sàn 200 = 11 chương);
// chương sau 13 vẫn sinh theo công thức (tên chung) để game không gãy nếu Level Dev sinh thêm.
// Tên khu ch3–11 theo bảng 2.2 của plan (người dùng duyệt 2026-10-15). Ch12–13 chưa có trong tài liệu: tên đề xuất
// (mùa nối tiếp vòng Thu → Đông → Xuân), chờ GD/người dùng duyệt. Decor theo art-batch-1.md mục 3–5 (thứ tự 6 chỗ đặt:
// TRÊN, TƯỜNG-TRÁI, TƯỜNG-PHẢI, KỆ-TRÁI, TƯỜNG-GIỮA, KỆ-PHẢI). Giá ch3+: 4/5/6/7/8/10 = 40 (plan mục 5 câu 3).
// File chưa có art thì main.js hiện "sắp có" (kiểm tra bằng cách tải thử ảnh, xem decorReady()).

export const FIRST_GEN = 21;
export const CH_LEN = 20;
const COST_CH3 = [4, 5, 6, 7, 8, 10];

// id chương -> [mùa, cư dân nhận chủ đề mới, 6 decor]
const META = {
  1: { season: 'spring', resident: 'Otto', decor: [['bunting', 2], ['frame', 3], ['clock', 4], ['postbox', 4], ['board', 5], ['cat', 6]] },
  2: { season: 'summer', resident: 'Bo', decor: [['fan', 2], ['porthole', 3], ['buoy', 4], ['lantern', 4], ['chart', 5], ['boatbed', 6]] },
  3: { season: 'autumn', resident: 'Ines', decor: ['knit_bunting', 'tea_shelf', 'daisy_pot', 'copper_kettle', 'tea_painting', 'yarn_basket'] },
  4: { season: 'winter', resident: 'Otto', decor: ['string_lights', 'wreath', 'scarf_hook', 'apple_basket', 'stockings', 'gift_bed'] },
  5: { season: 'spring', resident: 'Finch', decor: ['station_clock', 'signal_lamp', 'travel_poster', 'old_suitcases', 'departure_board', 'suitcase_bed'] },
  6: { season: 'summer', resident: 'Bo', decor: ['hammock', 'globe', 'cactus_pot', 'lighthouse_model', 'sea_chest', 'shell_bed'] },
  7: { season: 'autumn', resident: 'Marigold', decor: ['awning', 'wicker_basket', 'brass_scale', 'bread_basket', 'chalk_board', 'flour_bed'] },
  8: { season: 'winter', resident: 'Lina', decor: ['fishing_rods', 'ice_skates', 'picnic_shelf', 'easel', 'lake_painting', 'gingham_bed'] },
  9: { season: 'spring', resident: 'Otto', decor: ['flower_garland', 'pencil_cup', 'rocking_horse', 'windmill_model', 'bookshelf', 'book_bed'] },
  10: { season: 'summer', resident: 'Marigold', decor: ['festival_lights', 'masks', 'door_bell', 'flag_stand', 'music_box', 'party_bed'] },
  11: { season: 'autumn', resident: 'Bo', decor: ['crane_string', 'key_hooks', 'thermometer', 'pinwheel_pot', 'raincoat_peg', 'cloud_bed'] },
  12: { season: 'winter', resident: 'Lina', decor: [] },
  13: { season: 'spring', resident: 'Finch', decor: [] },
};
export const NAMED_CHAPTERS = 13;
// Decor kỷ niệm khi Sổ dấu ngày đầy trang (art-batch-1.md D6: ô dư "rare_postbox", thưởng 20 dấu ngày)
export const KEEPSAKE_DECOR = 'rare_postbox';

export const chapterIdOf = lv => (lv <= 10 ? 1 : lv <= 20 ? 2 : 3 + Math.floor((lv - FIRST_GEN) / CH_LEN));
const rangeOf = id => (id === 1 ? [1, 10] : id === 2 ? [11, 20] : [FIRST_GEN + (id - 3) * CH_LEN, FIRST_GEN + (id - 2) * CH_LEN - 1]);

/** Danh sách chương đủ phủ maxLevel (tối thiểu 13 chương). Chương 1–2 giữ khoá save cũ: decor, decor2. */
export function buildChapters(maxLevel = 240) {
  const n = Math.max(NAMED_CHAPTERS, chapterIdOf(Math.max(1, maxLevel)));
  const out = [];
  for (let id = 1; id <= n; id++) {
    const [from, to] = rangeOf(id);
    const m = META[id] || { season: ['autumn', 'winter', 'spring', 'summer'][(id - 3) % 4], resident: 'Otto', decor: [] };
    const decor = m.decor.map((d, i) => (Array.isArray(d) ? { id: d[0], cost: d[1] } : { id: d, cost: COST_CH3[i] }));
    out.push({ id, from, to, key: id === 1 ? 'decor' : 'decor' + id, decor, season: m.season, resident: m.resident,
      named: id <= NAMED_CHAPTERS, postcard: id === 2 ? 'assets/ch2/postcard.jpg' : `assets/ch${id}/postcard.jpg` });
  }
  return out;
}
