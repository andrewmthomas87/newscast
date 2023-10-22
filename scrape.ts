import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export async function scrapeDataFromURL(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    throw res;
  }

  const html = await res.text();

  const dom = new JSDOM(html, { url });
  const data = new Readability(dom.window.document).parse();

  dom.window.close();

  return data;
}
