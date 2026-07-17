import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { END, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { SYSTEM_PROMPT } from "./prompt.js";
import { tools } from "./tools.js";

function buildModel() {
  const provider = process.env.LLM_PROVIDER ?? "ollama";

  if (provider === "openrouter") {
    return new ChatOpenAI({
      model: "openai/gpt-oss-120b:free",
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
      temperature: 0,
    });
  }

  return new ChatOpenAI({
    model: process.env.OLLAMA_MODEL ?? "qwen3.5:9b",
    apiKey: "ollama",
    configuration: {
      baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
    },
    temperature: 0,
  });
}

const model = buildModel().bindTools(tools);

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
