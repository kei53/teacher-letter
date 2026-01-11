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
  items: string; // 改行入りテキスト
  notes: string; // 改行入りテキスト
  issued_at: string;
  teacher_name: string;
};

function normalizeNewlines(s: string) {
  return (s || "").replace(/\r\n/g, "\n");
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

    // ★ ここが「テンプレWord」を読み込む場所
    const templatePath = path.join(process.cwd(), "templates", "fieldtrip.docx");
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: "templates/fieldtrip.docx が見つかりません" },
        { status: 500 }
      );
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    // linebreaks: true で、items/notes の改行がWordに反映される
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // ★ Word内の {{title}} などを payload の値に置換する
    doc.render(payload);

    const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    const filename = `校外学習お便り_${payload.date || "日付未設定"}.docx`;

    // ★ 生成したWordを「ファイルとして」返す
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
    return NextResponse.json(
      {
        error: "docx生成でエラーが発生しました",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
