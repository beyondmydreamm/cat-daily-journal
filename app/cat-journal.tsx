"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CalendarDays, ChevronRight, PawPrint, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "sonner";

type EventType = "litter" | "nails" | "vomit" | "deworm";
type CatEvent = { id: number; type: EventType; occurredAt: string; note: string; nextDueAt: string | null; createdAt: string; updatedAt: string };

const eventMeta: Record<EventType, { label: string; icon: string; tone: string }> = {
  litter: { label: "猫砂换新", icon: "🧺", tone: "tone-sage" },
  nails: { label: "剪指甲", icon: "✂️", tone: "tone-peach" },
  vomit: { label: "呕吐", icon: "💧", tone: "tone-rose" },
  deworm: { label: "驱虫", icon: "💊", tone: "tone-gold" },
};

const initialForm = () => ({ type: "litter" as EventType, occurredAt: new Date().toISOString().slice(0, 10), note: "", nextDueAt: "" });

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function dayDistance(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(`${value.slice(0, 10)}T00:00:00`).getTime() - today.getTime()) / 86400000);
}

export function CatJournal() {
  const [events, setEvents] = useState<CatEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatEvent | null>(null);
  const [deleting, setDeleting] = useState<CatEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/events", { cache: "no-store" });
      const data = (await response.json()) as { events?: CatEvent[]; error?: string };
      if (!response.ok) throw new Error(data.error || "读取失败");
      setEvents(data.events ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "暂时无法读取记录");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadEvents(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  const nextReminder = useMemo(() => events
    .filter((event) => event.nextDueAt && dayDistance(event.nextDueAt) >= 0)
    .sort((a, b) => (a.nextDueAt ?? "").localeCompare(b.nextDueAt ?? ""))[0] ?? null, [events]);

  function openNew(type?: EventType) {
    setEditing(null);
    setForm({ ...initialForm(), type: type ?? "litter" });
    setDialogOpen(true);
  }

  function openEdit(event: CatEvent) {
    setEditing(event);
    setForm({ type: event.type, occurredAt: event.occurredAt.slice(0, 10), note: event.note, nextDueAt: event.nextDueAt?.slice(0, 10) ?? "" });
    setDialogOpen(true);
  }

  async function saveEvent() {
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/events/${editing.id}` : "/api/events", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, nextDueAt: form.nextDueAt || null }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "保存失败");
      toast.success(editing ? "记录已更新" : "今天的小事，记下啦");
      setDialogOpen(false);
      await loadEvents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent() {
    if (!deleting) return;
    try {
      const response = await fetch(`/api/events/${deleting.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("删除失败");
      toast.success("记录已删除");
      setDeleting(null);
      await loadEvents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    }
  }

  return (
    <main className="journal-shell">
      <Toaster position="top-center" richColors />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="回到顶部"><span className="brand-mark"><PawPrint size={18} /></span><span>猫咪日常手账</span></a>
        <Button onClick={() => openNew()} className="rounded-full bg-[#29241f] px-5 text-white hover:bg-[#463c34]"><Plus size={17} /> 记一笔</Button>
      </header>

      <div id="top" className="page-grid">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={14} /> 毛茸茸的生活备忘</span>
            <h1>把关于它的<br />每一件小事记下来</h1>
            <p>换猫砂、剪指甲、驱虫，还有偶尔需要留意的呕吐情况。简单记一笔，照顾起来更安心。</p>
            <div className="hero-actions">
              <Button onClick={() => openNew()} className="rounded-full bg-[#e76f51] px-6 text-white hover:bg-[#d75c40]"><Plus size={17} /> 记录今天</Button>
              <span>{events.length > 0 ? `已经留下 ${events.length} 条记录` : "从第一条记录开始"}</span>
            </div>
          </div>
          <div className="hero-art"><Image src="/cat-journal-hero.png" alt="猫咪依偎在手账旁的温暖插画" fill sizes="(max-width: 760px) 100vw, 38vw" priority /></div>
        </section>

        <aside className="reminder-card">
          <div className="reminder-heading"><span><CalendarDays size={18} /></span><p>下一件要记得的事</p></div>
          {nextReminder ? (
            <div className="reminder-body"><strong>{eventMeta[nextReminder.type].label}</strong><p>{formatDate(nextReminder.nextDueAt!)}</p><span>{dayDistance(nextReminder.nextDueAt!) === 0 ? "就是今天" : `还有 ${dayDistance(nextReminder.nextDueAt!)} 天`}</span></div>
          ) : (
            <div className="reminder-empty"><PawPrint size={30} /><strong>暂时没有待办</strong><p>记录事件时可以顺手填写下次日期。</p></div>
          )}
        </aside>

        <section className="quick-section">
          <div className="section-title"><div><span>快速记录</span><h2>今天发生了什么？</h2></div></div>
          <div className="quick-grid">
            {(Object.keys(eventMeta) as EventType[]).map((type) => (
              <button key={type} className={`quick-card ${eventMeta[type].tone}`} onClick={() => openNew(type)}>
                <span className="quick-icon">{eventMeta[type].icon}</span><span><strong>{eventMeta[type].label}</strong><small>添加一条记录</small></span><ChevronRight size={18} />
              </button>
            ))}
          </div>
        </section>

        <section className="timeline-section">
          <div className="section-title timeline-title"><div><span>生活时间线</span><h2>最近的记录</h2></div>{events.length > 0 && <p>共 {events.length} 条</p>}</div>
          {loading ? (
            <div className="empty-state"><span className="loading-dot" />正在翻开手账…</div>
          ) : events.length === 0 ? (
            <div className="empty-state"><div className="empty-paw"><PawPrint size={28} /></div><h3>手账还是空白的</h3><p>先记下最近一次换猫砂或驱虫的日期吧。</p><Button variant="outline" onClick={() => openNew()} className="mt-2 rounded-full border-[#d8cabb] bg-white">写下第一条</Button></div>
          ) : (
            <div className="timeline-list">
              {events.map((event) => (
                <article key={event.id} className="timeline-item">
                  <div className={`event-icon ${eventMeta[event.type].tone}`}>{eventMeta[event.type].icon}</div>
                  <div className="event-main">
                    <div className="event-heading"><div><h3>{eventMeta[event.type].label}</h3><time>{formatDate(event.occurredAt)}</time></div><div className="event-actions"><button onClick={() => openEdit(event)} aria-label={`编辑${eventMeta[event.type].label}`}><Pencil size={16} /></button><button onClick={() => setDeleting(event)} aria-label={`删除${eventMeta[event.type].label}`}><Trash2 size={16} /></button></div></div>
                    {event.note && <p>{event.note}</p>}
                    {event.nextDueAt && <span className="next-chip"><CalendarDays size={13} /> 下次：{formatDate(event.nextDueAt)}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl border-[#e7d8ca] bg-[#fffdf9] sm:max-w-[480px]">
          <DialogHeader><DialogTitle className="font-serif text-2xl text-[#29241f]">{editing ? "修改这条记录" : "记下今天的小事"}</DialogTitle><DialogDescription>日期和备注之后都可以再次修改。</DialogDescription></DialogHeader>
          <div className="form-grid">
            <div className="field-stack"><Label htmlFor="event-type">发生了什么</Label><Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as EventType })}><SelectTrigger id="event-type" className="h-11 w-full rounded-xl bg-white"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(eventMeta) as EventType[]).map((type) => <SelectItem key={type} value={type}>{eventMeta[type].icon} {eventMeta[type].label}</SelectItem>)}</SelectContent></Select></div>
            <div className="field-stack"><Label htmlFor="occurred-at">日期</Label><Input id="occurred-at" type="date" value={form.occurredAt} onChange={(e) => setForm({ ...form, occurredAt: e.target.value })} className="h-11 rounded-xl bg-white" /></div>
            <div className="field-stack"><Label htmlFor="event-note">备注 <span>选填</span></Label><Textarea id="event-note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={form.type === "vomit" ? "比如：时间、次数、呕吐物状态…" : "补充一点细节…"} className="min-h-24 rounded-xl bg-white" maxLength={300} /></div>
            <div className="field-stack"><Label htmlFor="next-due">下次提醒日期 <span>选填</span></Label><Input id="next-due" type="date" value={form.nextDueAt} onChange={(e) => setForm({ ...form, nextDueAt: e.target.value })} className="h-11 rounded-xl bg-white" /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-full">取消</Button><Button onClick={saveEvent} disabled={saving || !form.occurredAt} className="rounded-full bg-[#e76f51] px-6 text-white hover:bg-[#d75c40]">{saving ? "保存中…" : "保存记录"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl border-[#e7d8ca] bg-[#fffdf9]"><AlertDialogHeader><AlertDialogTitle>要删除这条记录吗？</AlertDialogTitle><AlertDialogDescription>删除后无法恢复。如果只是日期写错了，可以选择编辑。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-full">先不删</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={deleteEvent} className="rounded-full">确认删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
