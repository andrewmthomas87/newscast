import OpenAI from "openai";
import { Throttler } from "./utils/throttler";
import { Article } from "./articles";
import { ChatCompletionMessage } from "openai/resources/index.mjs";

export class AI {
  public openai: OpenAI;
  public model: string;
  public throttler: Throttler;

  constructor(apiKey: string, model: string, throttler: Throttler) {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
    this.throttler = throttler;
  }

  async summarizeArticle({ result, data }: Article) {
    const articleContent = `${result.name}\n\n${data?.textContent}`;
    const messages = [
      {
        role: "system",
        content:
          "You are summarizing news articles. Be concise. Retain meaningful details.",
      },
      {
        role: "user",
        content: articleContent,
      },
      {
        role: "user",
        content: "Summarize the article in 5-10 bullet points.",
      },
    ] satisfies ChatCompletionMessage[];

    const completion = await this.throttler.run(() =>
      this.openai.chat.completions.create({
        model: this.model,
        messages,
        temperature: 1,
        max_tokens: 512,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    );

    return { messages, completion };
  }
}
