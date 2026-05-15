
import { initChatModel } from "langchain";

const local_model = await initChatModel("ollama:gpt-oss", {
  temperature: 0.5,
  timeout: 300,
  maxTokens: 25000,
});

const online_model = await initChatModel("gemini-3.1-pro-preview", {
  modelProvider: "google-genai",
  temperature: 0.5,
  timeout: 600_000,
  maxTokens: 25000,
});
