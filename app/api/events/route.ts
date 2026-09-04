import { getD1 } from "@/db/raw";

const allowedTypes = new Set(["litter", "nails", "vomit", "deworm"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

type Payload = { type?: string; occurredAt?: string; note?: string; nextDueAt?: string | null };

function validate(payload: Payload) {
  if (!payload.type || !allowedTypes.has(payload.type)) return "请选择记录类型";
  if (!payload.occurredAt || !datePattern.test(payload.occurredAt)) return "请选择有效日期";
  if (payload.nextDueAt && !datePattern.test(payload.nextDueAt)) return "下次提醒日期无效";
  if ((payload.note ?? "").length > 300) return "备注不能超过 300 字";
  return null;
}

export async function GET() {
  try {
    const result = await getD1().prepare(`
      SELECT id, type, occurred_at AS occurredAt, note,
             next_due_at AS nextDueAt, created_at AS createdAt, updated_at AS updatedAt
      FROM cat_events ORDER BY occurred_at DESC, id DESC LIMIT 200
    `).all();
    return Response.json({ events: result.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Payload;
    const error = validate(payload);
    if (error) return Response.json({ error }, { status: 400 });
    const result = await getD1().prepare(`
      INSERT INTO cat_events (type, occurred_at, note, next_due_at)
      VALUES (?, ?, ?, ?) RETURNING id
    `).bind(payload.type, payload.occurredAt, (payload.note ?? "").trim(), payload.nextDueAt || null).first();
    return Response.json({ id: result?.id }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 500 });
  }
}
