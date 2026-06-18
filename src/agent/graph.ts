import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { END, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { SYSTEM_PROMPT } from "./prompt.js";
import { tools } from "./tools.js";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  apiKey: process.env.ANTHROPIC_API_KEY,
}).bindTools(tools);

async function callModel(state: typeof MessagesAnnotation.State) {
  const messages = [new SystemMessage(SYSTEM_PROMPT), ...state.messages];
  const response = await model.invoke(messages);
  return { messages: [response] };
}

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const last = state.messages[state.messages.length - 1] as AIMessage;
  return last.tool_calls?.length ? "tools" : END;
}

const toolNode = new ToolNode(tools);

export const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent")
  .compile();
