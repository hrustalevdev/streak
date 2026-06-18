import "dotenv/config";
import { HumanMessage } from "@langchain/core/messages";
import { graph } from "./agent/graph.js";

const query = process.argv[2] ?? process.env.QUERY;

if (!query) {
  console.error('Использование: npx tsx src/main.ts "ваш запрос"');
  console.error('Или через Docker: QUERY="ваш запрос" docker compose run --rm agent');
  process.exit(1);
}

const result = await graph.invoke({
  messages: [new HumanMessage(query)],
});

const last = result.messages[result.messages.length - 1];
console.log("\n" + last.content);
