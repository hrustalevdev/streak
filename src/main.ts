import "dotenv/config";
import { HumanMessage } from "@langchain/core/messages";
import { graph } from "./agent/graph.js";

const query = process.argv[2];

if (!query) {
  console.error('Использование: npx tsx src/main.ts "ваш запрос"');
  process.exit(1);
}

const result = await graph.invoke({
  messages: [new HumanMessage(query)],
});

const last = result.messages[result.messages.length - 1];
console.log("\n" + last.content);
