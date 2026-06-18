import { tool } from "@langchain/core/tools";
import { z } from "zod";

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

export const createHabit = tool(
  async ({ name }) => {
    const res = await fetch(`${BASE_URL}/habits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    console.log("[tool] create_habit →", data);
    return JSON.stringify(data);
  },
  {
    name: "create_habit",
    description: "Создаёт новую привычку с указанным названием. Возвращает id и name.",
    schema: z.object({
      name: z.string().describe("Название привычки"),
    }),
  }
);

export const markCompletion = tool(
  async ({ habitId }) => {
    const res = await fetch(`${BASE_URL}/habits/${habitId}/completions`, {
      method: "POST",
    });
    const data = await res.json();
    console.log("[tool] mark_completion →", data);
    return JSON.stringify(data);
  },
  {
    name: "mark_completion",
    description: "Отмечает выполнение привычки на сегодня. Требует habitId.",
    schema: z.object({
      habitId: z.string().describe("ID привычки"),
    }),
  }
);

export const getStreak = tool(
  async ({ habitId }) => {
    const res = await fetch(`${BASE_URL}/habits/${habitId}/streak`);
    const data = await res.json();
    console.log("[tool] get_streak →", data);
    return JSON.stringify(data);
  },
  {
    name: "get_streak",
    description: "Возвращает текущий streak (количество дней подряд) для привычки.",
    schema: z.object({
      habitId: z.string().describe("ID привычки"),
    }),
  }
);

export const listHabits = tool(
  async () => {
    const res = await fetch(`${BASE_URL}/habits`);
    const data = await res.json();
    console.log("[tool] list_habits →", data);
    return JSON.stringify(data);
  },
  {
    name: "list_habits",
    description: "Возвращает список всех привычек с их текущими streak'ами.",
    schema: z.object({}),
  }
);

export const tools = [createHabit, markCompletion, getStreak, listHabits];
