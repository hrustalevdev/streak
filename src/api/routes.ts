import { Hono } from "hono";
import { randomUUID } from "crypto";

type Habit = { id: string; name: string };

const habits = new Map<string, Habit>();
const completions = new Map<string, Date[]>(); // habitId → sorted dates

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const normalized = dates.map((d) => {
    const n = new Date(d);
    n.setHours(0, 0, 0, 0);
    return n.getTime();
  });
  const dateSet = new Set(normalized);

  let anchor: number;
  if (dateSet.has(today.getTime())) {
    anchor = today.getTime();
  } else if (dateSet.has(yesterday.getTime())) {
    anchor = yesterday.getTime();
  } else {
    return 0;
  }

  let streak = 0;
  let current = anchor;
  while (dateSet.has(current)) {
    streak++;
    current -= 86_400_000; // -1 day in ms
  }

  return streak;
}

export const app = new Hono();

app.post("/habits", async (c) => {
  const { name } = await c.req.json<{ name: string }>();
  if (!name?.trim()) {
    return c.json({ error: "name is required" }, 400);
  }
  const id = randomUUID();
  const habit: Habit = { id, name: name.trim() };
  habits.set(id, habit);
  completions.set(id, []);
  return c.json(habit, 201);
});

app.post("/habits/:id/completions", (c) => {
  const id = c.req.param("id");
  if (!habits.has(id)) {
    return c.json({ error: "habit not found" }, 404);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const list = completions.get(id)!;
  const alreadyDone = list.some((d) => d.getTime() === today.getTime());
  if (!alreadyDone) {
    list.push(today);
  }

  return c.json({ habitId: id, date: today.toISOString().slice(0, 10) });
});

app.get("/habits/:id/streak", (c) => {
  const id = c.req.param("id");
  if (!habits.has(id)) {
    return c.json({ error: "habit not found" }, 404);
  }
  const streak = calculateStreak(completions.get(id)!);
  return c.json({ habitId: id, streak });
});

app.get("/habits", (c) => {
  const result = [...habits.values()].map((h) => ({
    id: h.id,
    name: h.name,
    streak: calculateStreak(completions.get(h.id)!),
  }));
  return c.json(result);
});
