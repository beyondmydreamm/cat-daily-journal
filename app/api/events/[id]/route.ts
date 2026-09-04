import { getD1 } from "@/db/raw";

const allowedTypes = new Set(["litter", "nails", "vomit", "deworm"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

type Payload = { type?: string; occurredAt?: string; note?: string; nextDueAt?: string | null };

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await context.params).id);
    if (!id) return Response.json({ error: "无效记录" }, { status: 400 });
    const payload = (await request.json()) as Payload;
    if (!payload.type || !allowedTypes.has(payload.type)) return Response.json({ error: "请选择记录类型" }, { status: 400 });
    if (!payload.occurredAt || !datePattern.test(payload.occurredAt)) return Response.json({ error: "请选择有效日期" }, { status: 400 });
    if (payload.nextDueAt && !datePattern.test(payload.nextDueAt)) return Response.json({ error: "下次提醒日期无效" }, { status: 400 });
    if ((payload.note ?? "").length > 300) return Response.json({ error: "备注不能超过 300 字" }, { status: 400 });
    await getD1().prepare(`
      UPDATE cat_events SET type = ?, occurred_at = ?, note = ?, next_due_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(payload.type, payload.occurredAt, (payload.note ?? "").trim(), payload.nextDueAt || null, id).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "更新失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await context.params).id);
    if (!id) return Response.json({ error: "无效记录" }, { status: 400 });
    await getD1().prepare("DELETE FROM cat_events WHERE id = ?").bind(id).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "删除失败" }, { status: 500 });
  }
}
