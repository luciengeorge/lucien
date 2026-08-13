Most portfolios are a list of jobs. This one is a chat box. You ask it something about me and it answers from my own writing, and if the answers get worse, my pull requests stop merging.

That second part is the interesting half.

## Markdown is the only source

Everything you can read about me on this site lives in one folder of markdown. `content/fyxer.md`, `content/education.md`, `content/personal.md`, and so on. Those files do double duty: they render as the HTML pages you can browse, and they get embedded into a vector index that grounds the chat.

That is the whole design constraint, and it exists to prevent one specific failure. If the chat had its own copy of my history, the two would drift, and the drift would be invisible. A visitor asking "where does he work?" would get last year's answer while the work page said something else. One source means a content edit updates the page, the markdown mirror at `/about.md`, the `llms-full.txt` dump that AI crawlers read, and what the assistant knows. There is nowhere for a second version of the truth to hide.

The cost is a step I have to remember: editing markdown does not reach the chat until the embeddings are rebuilt. That is a real footgun and I have walked into it.

## How a question gets answered

The retrieval path has four steps, and the second one is the one people skip.

**Expand the query.** Nobody types good search queries into a chat box. They type "what's his stack?" or "any side projects?". Embedding that directly gives you weak retrieval, because the useful keywords are absent. So the raw question goes to a small generation call first, with a prompt full of worked examples, and comes back as something like "Lucien George tech stack programming languages frameworks tools TypeScript React". That expanded string is what gets embedded. When the expansion call fails, the code falls back to the raw question rather than erroring, because a slightly worse answer beats no answer.

**Retrieve.** The expanded query hits a single vector namespace with a score floor and a cap on how many chunks come back. The floor matters more than the cap: without it, a question about something I have never written about retrieves the eight least-irrelevant chunks anyway, and hands the model a pile of unrelated context to hallucinate from.

**Ground.** Retrieved chunks get substituted into a system prompt with an explicit slot for them. The prompt's job is mostly refusal: answer from this context, and when it does not cover the question, say so.

**Stream.** The answer streams back, with a hard cap on tool-calling steps so a confused model cannot loop.

There is one more piece worth mentioning because it is invisible when it works. The first message you see on the homepage is generated, not hardcoded, but it is not generated per visitor. It is written once, cached for thirty days, and served identically to everyone, so the homepage stays edge-cacheable and sets no cookies. The cache key contains the model name, which means changing the model without bumping the key serves an intro written by the old one. I know because I did that.

## The part that actually keeps it honest

A RAG chat is easy to build and easy to quietly break. Reword the system prompt, change the score floor, add content, and answer quality moves without a single test failing. Nothing in a normal test suite notices that the assistant has started making things up.

So there is an eval suite, and it blocks pull requests.

Fifty-seven cases across three files. **Factual** cases have expected facts to hit. **Adversarial** cases try to make it invent things, including questions about jobs I have never had. **Edge cases** are the awkward shapes: empty-ish questions, questions about topics the index genuinely does not cover, prompt injection attempts.

Two design decisions did most of the work.

**The actor runs the real pipeline, not a mock.** Each case goes through the same query expansion, the same vector search against the live index, the same system prompt as production. If it were mocked, it would pass forever while production rotted. The expansion prompt in the harness is copied verbatim from the route for exactly this reason, and that duplication is deliberate: I would rather have two copies that a test compares than one abstraction that hides a difference.

That intent was better than my execution, and I only found out later. See below.

**The judge grades against retrieved context, not against the expected-facts list.** This sounds like a detail and it is the difference between a useful gate and an annoying one. If you judge fabrication by comparing the answer to a short list of expected facts, every true statement that happens not to be on the list reads as a hallucination. So the judge sees the actual chunks the actor was given and is told, explicitly, that anything supported by that context is grounded even when it goes beyond what the case expected.

The judge is sampled several times per case with the median score taken, because a single sample from a reasoning model is not a stable measurement. Scores roll up per category against thresholds in a config file, and the run exits non-zero if any category misses. That exit code is the gate.

## Where this is wrong

I would rather write this part than pretend the setup is finished.

For a long stretch the gate passed every case at a perfect score. Fifty-seven out of fifty-seven, average exactly 1.00, in all three categories including the adversarial one. I assumed that was a judge problem introduced when I swapped models, so I checked the previous run under the previous judge. Same result. Both judges scored everything perfectly.

A gate that has never failed is not evidence that the system is good. It is weak evidence either way, and the thresholds at 0.85 and 0.95 cannot fire when every score is 1.00. So I wrote, in an earlier draft of this piece, that the gate was measuring nothing.

Then it failed one, and the failure was more interesting than the streak.

A factual case about my Shopify work came back at 0.75, marked down for not being concise. The answer was correct and grounded, but it contained this:

```
... expanded to other major partners. to=link_work_entry code彩票登录:
{"slug":"shopify"}Lucien worked at Shopify from January 2022 ...
```

That is the model's internal tool-routing syntax, emitted as visible prose, followed by a corrupted token and then the whole answer a second time.

The cause is the harness, not the assistant. Production passes three tool definitions to the model. The eval actor passes none. Both share the same system prompt, and that prompt tells the model to call one of those tools. Instructed to use a tool it had not been given, the model wrote the call out as text instead.

So the claim I made above, that the actor runs the real pipeline rather than a mock, was true of retrieval and the prompt and false at the tool boundary, which is the one seam I had not thought to check. The gate did discriminate. It just took a run where the model happened to reach for a tool, because whether it does varies between runs even at temperature zero with a fixed seed, since reasoning models ignore both.

Two lessons, and the second one is the one I would keep. A gate that never fails deserves suspicion rather than confidence. And when it finally fires, the first question is not "how do I make this pass" but "which of my assumptions did this just falsify" — because in this case the answer was an assumption sitting in the paragraph above, in an article I had already written.

## What I would keep

If I rebuilt this tomorrow, four things carry over. One source of content, because two sources of truth is a bug with a delay on it. Evals that exercise the real retrieval path, because the mocked version tests nothing that can break. A judge that scores against what the model was actually given, because grading against a wishlist punishes correct answers. And one source for anything the harness claims to share with production, tools included, because "the same as prod" is a claim that rots quietly until something forces you to check it.

The rest is plumbing, and the plumbing was never the hard part.
