import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

type FieldTripPayload = {
  title: string;
  grade: string;
  class_name: string;
  event_name: string;
  purpose: string;
  date: string;
  meet_time: string;
  meet_place: string;
  dismiss_time: string;
  dismiss_place: string;
  destination: string;
  clothes: string;
  items: string;
  notes: string;
  issued_at: string;
  teacher_name: string;
};

function normalizeNewlines(s: string) {
  return (s || "").replace(/\r\n/g, "\n");
}

function extractMultiErrors(err: any) {
  const errors = err?.properties?.errors;
  if (!Array.isArray(errors)) return null;

  return errors.map((e: any) => ({
    message: e?.message,
    name: e?.name,
    explanation: e?.properties?.explanation,
    tag: e?.properties?.tag,
    context: e?.properties?.context,
    file: e?.properties?.file,
    part: e?.properties?.part,
    offset: e?.properties?.offset,
    id: e?.properties?.id,
    xtag: e?.properties?.xtag,
  }));
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as Partial<FieldTripPayload>;

    const payload: FieldTripPayload = {
      title: data.title ?? "校外学習のお知らせ",
      grade: data.grade ?? "",
      class_name: data.class_name ?? "",
      event_name: data.event_name ?? "",
      purpose: data.purpose ?? "",
      date: data.date ?? "",
      meet_time: data.meet_time ?? "",
      meet_place: data.meet_place ?? "",
      dismiss_time: data.dismiss_time ?? "",
      dismiss_place: data.dismiss_place ?? "",
      destination: data.destination ?? "",
      clothes: data.clothes ?? "",
      items: normalizeNewlines(data.items ?? ""),
      notes: normalizeNewlines(data.notes ?? ""),
      issued_at: data.issued_at ?? "",
      teacher_name: data.teacher_name ?? "",
    };

    // ✅ テンプレはプロジェクト直下 templates/fieldtrip.docx
    const templatePath = path.join(process.cwd(), "templates", "fieldtrip.docx");
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: "templates/fieldtrip.docx が見つかりません", templatePath },
        { status: 500 }
      );
    }

    // ✅ どのテンプレを読んでいるか確認（任意だけど便利）
    const st = fs.statSync(templatePath);
    console.log("[TEMPLATE]", templatePath);
    console.log("[TEMPLATE] size =", st.size, "mtime =", st.mtime.toISOString());

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    // ★ ここが重要：{{ }} をタグとして扱う
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });

    doc.render(payload);

    const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    const filename = `校外学習お便り_${payload.date || "日付未設定"}.docx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          filename
        )}`,
      },
    });
  } catch (err: any) {
    const multi = extractMultiErrors(err);

    console.error("DOCX ERROR message:", err?.message);
    console.error("DOCX ERROR name:", err?.name);
    console.error("DOCX ERROR properties:", err?.properties);
    if (multi) console.error("DOCX MULTI (expanded):", JSON.stringify(multi, null, 2));

    return NextResponse.json(
      {
        error: "docx生成でエラーが発生しました",
        detail: err?.message ?? String(err),
        multi,
      },
      { status: 500 }
    );
  }
}
