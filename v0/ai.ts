import OpenAI from 'openai';
import { Throttler } from './utils/throttler';

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
    const messages: OpenAI.ChatCompletionMessage[] = [
      {
        role: 'user',
        content: `# Search\n\n${search}\n\n# Result\n\n${result}`,
      },
      {
        role: 'user',
        content: 'Does the result match the search? Simply respond "yes" or "no".',
      },
    ];

    const completion = await this.throttler.run(() =>
      this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 1,
      }),
    );

    const content = completion.choices[0].message.content;
    return content && content.toLowerCase() === 'yes';
  }

  async summarizeArticle(title: string, content: string) {
    const messages: OpenAI.ChatCompletionMessage[] = [
      {
        role: 'system',
        content: 'You summarize news articles. Be concise. Retain meaningful details.',
      },
      {
        role: 'user',
        content: `${title}\n\n${content}`,
      },
      {
        role: 'user',
        content: 'Summarize the article in 5-10 bullet points.',
      },
    ];

    const completion = await this.throttler.run(() =>
      this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 512,
      }),
    );
    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('expected completion content');
    }

    return result;
  }

  async mergeSummaries(summaries: string[]) {
    const messages: OpenAI.ChatCompletionMessage[] = [
      {
        role: 'system',
        content: 'You merge several lists of bullet points into a single list. Retain as much detail as possible.',
      },
      ...summaries.map<OpenAI.ChatCompletionMessage>((summary) => ({
        role: 'user',
        content: summary,
      })),
      {
        role: 'user',
        content: 'Merge the lists into a single list of 5-10 bullet points.',
      },
    ];

    const completion = await this.throttler.run(() =>
      this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 512,
      }),
    );
    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('expected completion content');
    }

    return result;
  }

  async generateSegment(summary: string) {
    const messages: OpenAI.ChatCompletionMessage[] = [
      {
        role: 'system',
        content: 'You are a news reporter. You are reporting on a story. Stick to the facts.',
      },
      { role: 'user', content: `# Story\n\n${summary}` },
      { role: 'user', content: 'First, deliver a brief introductory statement to the story (1 sentence).' },
    ];

    let completion = await this.throttler.run(() =>
      this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 64,
      }),
    );
    const introduction = completion.choices[0].message.content;
    if (!introduction) {
      throw new Error('expected completion content');
    }

    messages.push(completion.choices[0].message);
    messages.push({
      role: 'user',
      content: "Next, deliver a summary of the story (30 seconds). Don't repeat the introduction.",
    });

    completion = await this.throttler.run(() =>
      this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 256,
      }),
    );
    const body = completion.choices[0].message.content;
    if (!body) {
      throw new Error('expected completion content');
    }

    messages.push(completion.choices[0].message);
    messages.push({ role: 'user', content: 'Finally, deliver a brief concluding statement (1 sentence).' });

    completion = await this.throttler.run(() =>
      this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 64,
      }),
    );
    const conclusion = completion.choices[0].message.content;
    if (!conclusion) {
      throw new Error('expected completion content');
    }

    return { introduction, body, conclusion };
  }
}
