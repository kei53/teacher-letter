"use client";

import { useMemo, useState } from "react";

type FieldTripForm = {
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

const initial: FieldTripForm = {
  title: "校外学習のお知らせ",
  grade: "3年",
  class_name: "1組",
  event_name: "姫路城・歴史学習",
  purpose:
    "社会科の学習の一環として、地域の歴史や文化に触れ、学びを深めることを目的とします。",
  date: "2026年2月3日（火）",
  meet_time: "8:30",
  meet_place: "学校運動場",
  dismiss_time: "15:10",
  dismiss_place: "学校",
  destination: "姫路城（兵庫県姫路市本町68）",
  clothes: "体操服、歩きやすい靴",
  items: "筆記用具\nしおり\n水筒\nハンカチ・ティッシュ\nお弁当\n雨具",
  notes:
    "雨天の場合も原則実施します。\n欠席される場合は当日朝までに連絡帳でご連絡ください。\n貴重品の持参はご遠慮ください。",
  issued_at: "2026年1月10日",
  teacher_name: "〇〇 〇〇",
};

export default function FieldTripPage() {
  const [form, setForm] = useState<FieldTripForm>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewText = useMemo(() => {
    const gradeClass = [form.grade, form.class_name].filter(Boolean).join(" ");
    return `【${form.title}】

保護者の皆様

このたび、${gradeClass}では下記のとおり校外学習を実施いたします。

■ 行事名
${form.event_name}

■ 目的
${form.purpose}

■ 日時
${form.date}

■ 集合
${form.meet_time}　${form.meet_place}

■ 解散
${form.dismiss_time}　${form.dismiss_place}

■ 行き先
${form.destination}

■ 服装
${form.clothes}

■ 持ち物
${form.items}

■ 注意事項
${form.notes}

${form.issued_at}
担任　${form.teacher_name}
`;
  }, [form]);

  const update = (key: keyof FieldTripForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function downloadDocx() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/letters/fieldtrip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.detail || j?.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `校外学習お便り_${form.date || "日付未設定"}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-bold">校外学習お便り自動作成（Word出力）</h1>
        <p className="mt-2 text-sm text-gray-600">
          入力フォーム → プレビュー確認 → Word（.docx）を出力します。
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow">
            <div className="grid gap-4">
              <Input label="タイトル" value={form.title} onChange={(v) => update("title", v)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="学年" value={form.grade} onChange={(v) => update("grade", v)} />
                <Input label="学級" value={form.class_name} onChange={(v) => update("class_name", v)} />
              </div>

              <Input label="行事名" value={form.event_name} onChange={(v) => update("event_name", v)} />
              <Textarea label="目的" value={form.purpose} onChange={(v) => update("purpose", v)} />

              <Input label="日付" value={form.date} onChange={(v) => update("date", v)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="集合時間" value={form.meet_time} onChange={(v) => update("meet_time", v)} />
                <Input label="集合場所" value={form.meet_place} onChange={(v) => update("meet_place", v)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="解散時間" value={form.dismiss_time} onChange={(v) => update("dismiss_time", v)} />
                <Input label="解散場所" value={form.dismiss_place} onChange={(v) => update("dismiss_place", v)} />
              </div>

              <Input label="行き先" value={form.destination} onChange={(v) => update("destination", v)} />
              <Input label="服装" value={form.clothes} onChange={(v) => update("clothes", v)} />

              <Textarea
                label="持ち物（改行で区切る）"
                value={form.items}
                onChange={(v) => update("items", v)}
              />
              <Textarea
                label="注意事項（改行で区切る）"
                value={form.notes}
                onChange={(v) => update("notes", v)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input label="発行日" value={form.issued_at} onChange={(v) => update("issued_at", v)} />
                <Input label="担任名" value={form.teacher_name} onChange={(v) => update("teacher_name", v)} />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={downloadDocx}
                disabled={loading}
                className="rounded-2xl bg-black px-4 py-3 text-white shadow disabled:opacity-60"
              >
                {loading ? "生成中…" : "Word（.docx）を出力"}
              </button>

              <div className="text-xs text-gray-500">
                ※ templates/fieldtrip.docx の {"{{...}}"} タグ名と一致しないと生成でエラーになります。

              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-semibold">プレビュー</h2>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-6">
              {previewText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
      />
    </label>
  );
}
