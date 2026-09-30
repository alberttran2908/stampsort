// OCR hàng loạt frame bằng macOS Vision. In JSON lines: {"f": tên file, "t": [[text, x, y, w, h], ...]}
// Toạ độ chuẩn hoá 0..1, gốc trái-trên. Dùng: swift tools/ocr_frames.swift <thư mục ảnh>
import Foundation
import Vision
import AppKit

let dir = CommandLine.arguments[1]
let files = try FileManager.default.contentsOfDirectory(atPath: dir).filter { $0.hasSuffix(".jpg") || $0.hasSuffix(".png") }.sorted()
for f in files {
    let url = URL(fileURLWithPath: dir).appendingPathComponent(f)
    guard let img = NSImage(contentsOf: url), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.usesLanguageCorrection = false
    let h = VNImageRequestHandler(cgImage: cg, options: [:])
    try? h.perform([req])
    var out: [[Any]] = []
    for o in req.results ?? [] {
        guard let c = o.topCandidates(1).first else { continue }
        let b = o.boundingBox
        out.append([c.string, round(b.minX * 1000) / 1000, round((1 - b.maxY) * 1000) / 1000, round(b.width * 1000) / 1000, round(b.height * 1000) / 1000])
    }
    let data = try JSONSerialization.data(withJSONObject: ["f": f, "t": out])
    print(String(data: data, encoding: .utf8)!)
}
