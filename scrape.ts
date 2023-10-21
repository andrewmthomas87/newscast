import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export async function scrapeArticleFromURL(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  const html = await res.text();

  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();

  dom.window.close();

  return article;
}
