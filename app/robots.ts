import type { MetadataRoute } from "next"

// Nothing written here is training data. Every crawler that feeds a model is told to stay out.
const MODEL_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "PerplexityBot",
  "Bytespider",
  "Amazonbot",
  "FacebookBot",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "cohere-ai",
  "cohere-training-data-crawler",
  "Diffbot",
  "ImagesiftBot",
  "Omgilibot",
  "Omgili",
  "YouBot",
  "Timpibot",
  "PetalBot",
  "AI2Bot",
  "DuckAssistBot",
  "MistralAI-User",
  "Kangaroo Bot",
  "webzio-extended",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: MODEL_CRAWLERS, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/admin", "/p/"] },
    ],
  }
}
