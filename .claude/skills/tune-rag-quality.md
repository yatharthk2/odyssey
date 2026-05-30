---
name: tune-rag-quality
description: Use when the Inpersona chatbot's responses are low quality — answers are vague, miss obvious facts, hallucinate, repeat themselves, or feel "off" beyond what just adding more content can fix. Walks through the levers in `backend/settings.py` and `backend/chat/prompt.py` that meaningfully change response quality, ordered by ROI.
---

# Tuning Inpersona's RAG response quality

When the chatbot is "kinda working but the answers aren't great", the levers below cover most of what's worth touching. They're ordered by **impact-per-effort** — start at the top.

## Lever 1: More documents in the KB (highest ROI by far)

The chatbot can only answer based on what's in `backend/documents/`. Today it's basically one resume. Adding 3-5 more docs — project READMEs, LinkedIn recommendations, a recruiter FAQ, blog posts — massively improves answer richness with zero code changes.

See `update-inpersona-kb` skill for the reindex flow.

## Lever 2: Chunking (`chunk_size`, `chunk_overlap` in settings.py)

```python
chunk_size: int = 800       # default after the cleanup pass
chunk_overlap: int = 100
```

Current defaults are tuned for resume-style content where each role/project is a logical unit (~600-800 chars). Smaller values shred bullets into incoherent fragments; larger values dilute retrieval (the embedder loses focus when one chunk covers multiple unrelated jobs).

- For **resume + bullet-heavy content** → 800/100 (current)
- For **prose / blog posts** → 1000-1200 with 150 overlap
- For **FAQ-style Q&A pairs** → small chunks (256/50) so each Q/A is one unit

Chunk size only takes effect on **fresh indices** — change it AND wipe `storage/` + `chroma_db/` to reindex. See `update-inpersona-kb`.

## Lever 3: `similarity_top_k` (settings.py)

```python
similarity_top_k: int = 6   # default
```

How many chunks the retriever feeds to the LLM per query. Small KBs (single-digit chunks) benefit from a higher k (6-10) because the cost of over-retrieving is small. Large KBs (100+ chunks) need a lower k (3-5) or the LLM context overflows.

For our current ~10-chunk KB, `top_k=6-8` is the right zone.

## Lever 4: Model selection (`groq_model`, `default_model_provider`)

```python
groq_model: str = "llama-3.1-8b-instant"   # current — fast, generous rate limit
# Alternatives:
# "llama-3.3-70b-versatile"  — smarter, but 3-4x stricter rate limit; 429s become the dominant latency
```

| Model | Quality | Speed | Free rate limit | When to use |
|---|---|---|---|---|
| `llama-3.1-8b-instant` | Solid for short factual answers | ~500 tok/s | High (~30 req/min) | Default. Personal portfolio scale. |
| `llama-3.3-70b-versatile` | Noticeably better reasoning | ~300 tok/s | Tight (~10 req/min) | Only if quality > speed AND you stay under low request rates |
| Gemini `gemini-2.5-pro` | Strong, but cold-start is slower | ~200 tok/s | Separate Google quota | Backup if Groq is down |

If Groq starts 429-ing constantly, the fix is either: switch to 8b-instant, or pay for a Groq tier (~$50/mo for the smallest paid tier — overkill for this site).

## Lever 5: HyDE on/off

HyDE (Hypothetical Document Embeddings) generates a fake answer first, then embeds that and retrieves similar chunks. It helps on **large, diverse KBs** where the query phrasing differs from how the answer is written. For a **small personal KB** (our case), HyDE often makes things worse — the hallucinated hypothetical drifts and pulls in irrelevant chunks.

UI exposes this as the "Use Hyde Query" toggle. Default off; recommend leaving it off for users.

## Lever 6: The system prompt (`backend/chat/prompt.py`)

The single most load-bearing file in the backend for response quality is `prompt.py`. It defines:
- **Voice**: respond as Yatharth in first person
- **Format**: HTML (not markdown), specific tag set (`<p>`, `<h3>`, `<ul>`, `<strong>`)
- **Structure**: TL;DR first line, then 1-2 detail sections
- **Topic filter**: refuse off-topic questions with a canned response

When to edit:
- **Stale few-shot examples** — the prompt has worked examples that reference specific roles/dates. If those go out of date with the resume, the model picks up wrong facts from the prompt. Update them when the resume changes substantially.
- **Tone shift wanted** — the prompt sets the entire conversational register. More casual? Less list-heavy? More direct? Edit here.
- **Format breakage** — if the chat starts showing raw markdown (`**bold**` instead of `<strong>`), the prompt's HTML rules got lost. Re-emphasize the HTML-only directive at the top of the prompt.

**Frontend renders the response with `dangerouslySetInnerHTML`**, so any prompt change that alters the output format must be tested in the actual chat UI — bad HTML renders as garbage, not errors.

## Lever 7: Chat history window (`query_engine.py`)

```python
recent_history = self.chat.to_list()[-8:]   # last 4 turns (user + assistant = 2 messages per turn)
```

The full chat deque holds 10 turns / 20 messages, but only the last 4 turns are dumped into the prompt. Older turns dilute both retrieval AND the LLM's focus on the current question.

Going higher (`[-16:]` = 8 turns) helps if users have long, contextually-linked conversations. Going lower (`[-4:]` = 2 turns) sharpens single-question answers at the cost of conversational coherence.

## Lever 8: Cache size (`cache_size` in settings.py)

```python
cache_size: int = 6   # default — top-6 most-asked questions stay warm
```

Redis caches the N most-frequent questions (LRU eviction). Higher = more cache hits but more memory. For a personal site, 6 is plenty — recruiters tend to ask the same questions ("background", "current role", "tech stack").

The cache is **exact-match on lowercased question text**. "What's your background?" and "Tell me about you" miss each other. For a semantic cache (embedding similarity), would need to wire one in — not implemented today.

## Things that ARE NOT actually quality levers

- **Bigger LLM**: switching from llama-3.1-8b to GPT-4 doesn't fix bad retrieval. Add docs (lever 1) first.
- **Bigger embedding model**: `bge-base` is fine for a tiny KB. Don't bother with `bge-large` until you have hundreds of chunks.
- **Fine-tuning**: zero ROI for personal RAG. You'd be fine-tuning on your own resume — RAG already does that effectively.
- **Reranking** (`bge-reranker`): would help on larger KBs but adds latency and complexity. Skip until lever 1+2+3 are exhausted.

## Sequence I'd actually follow for a quality complaint

1. Read 2-3 example answers the user is unhappy with
2. Check if the underlying fact is in `backend/documents/` — if not, add it (lever 1)
3. If facts are there but answers are sparse, bump `top_k` to 8 (lever 3)
4. If facts are there but the model "drifts" — outdated prompt examples (lever 6)
5. If chunks look reasonable in retrieval logs but the answer ignores them — chunk size mismatch (lever 2)
6. Only if all of the above are tuned and answers are still slow/bad → consider model bump or hybrid search

## Measuring before/after

There's no eval harness today. Manually maintain ~20 question/expected-answer pairs in a notes file; run them against the chat before and after a tuning change; eyeball whether quality went up. Quick-and-dirty but enough signal to avoid optimizing on vibes.
