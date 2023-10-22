import OpenAI from "openai";
import { Throttler } from "./utils/throttler";
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

  async isMatch(search: string[], result: string[]) {
    const messages = [
      {
        role: "user",
        content: `# Search\n\n${search}\n\n# Result\n\n${result}`,
      },
      {
        role: "user",
        content:
          'Does the result match the search? Simply respond "yes" or "no".',
      },
    ] satisfies ChatCompletionMessage[];

    const completion = await this.throttler.run(() =>
      this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 1,
      }),
    );

    const content = completion.choices[0].message.content;
    return content && content.toLowerCase() === "yes";
  }

  async summarizeArticle(title: string, content: string) {
    const article = `${title}\n\n${content}`;
    const messages = [
      {
        role: "system",
        content:
          "You are summarizing news articles. Be concise. Retain meaningful details.",
      },
      {
        role: "user",
        content: article,
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
        max_tokens: 512,
      }),
    );

    return completion.choices[0].message.content;
  }
}
