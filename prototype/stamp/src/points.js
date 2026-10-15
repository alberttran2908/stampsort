// R11 (30-day-plan.md mục 4 câu 3 và vòng R11): luật Tem Điểm. Module thuần, test trong Node (tests/points.test.mjs).
//   - Thắng trong số nước: 3 điểm nếu còn >= 50% phần nước dư so với lời giải tối ưu, không thì 2 điểm.
//   - Ca tối ở level khó (hết nước vẫn chơi tiếp tới khi gửi hết): 2 điểm. Level khó được thiết kế để vào Ca tối, không bị phạt.
//   - Level không giới hạn nước: 3 điểm.
// Level thường không có Ca tối: hết nước thì thua như ABI (panel hết nước), không có điểm.
export const POINTS = { full: 3, base: 2, overtime: 2, slackFull: 0.5 };
/** movesLeft: số nước còn lại lúc thắng; levelMoves: số nước của level (null = không giới hạn); solverMoves: lời giải tối ưu. */
export function stampPoints({ levelMoves = null, solverMoves = 0, movesLeft = 0, overtime = false } = {}) {
  if (overtime) return POINTS.overtime;
  if (levelMoves == null) return POINTS.full;
  const slack = Math.max(1, levelMoves - (solverMoves || Math.round(levelMoves * 0.8)));
  return movesLeft >= POINTS.slackFull * slack ? POINTS.full : POINTS.base;
}
