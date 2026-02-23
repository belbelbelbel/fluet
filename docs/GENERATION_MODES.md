# Generation Modes & Brand Voice

## Overview

The content generator supports **generation modes** and **client brand voice** to produce higher-quality, on-brand content.

## Generation Modes

| Mode | Purpose | Output |
|------|---------|--------|
| **Standard** | Platform-optimized content from your prompt | Single post/caption |
| **Viral Hooks** | Scroll-stopping hooks for IG/TikTok | 20 hooks |
| **Client Voice** | Match brand tone, personality, emotional positioning | Captions in exact brand voice |
| **Carousel** | Instagram carousel structure | Hook slide + value slides + CTA |
| **Call-to-Action** | High-converting CTAs | 10 CTAs (soft, authority, community, conversion) |
| **Authority Building** | Thought-leader content | Credibility-focused content |
| **Strategy** | 30-day content plan | Pillars, post ideas, formats, KPIs |
| **Trend Adaptation** | Adapt trending topics to niche | 5 creative adaptations |
| **Content Repurpose** | Long-form → social posts | 10 posts (IG, LinkedIn, TikTok) |
| **Audience Research** | Act as target audience | Psychological triggers + content ideas |

## Brand Voice (per client)

Stored in `client_brand_voice`:

- **Brand description** – Personality, positioning, what makes it unique
- **Target audience** – Demographics, goals, pain points, language patterns
- **Tone** – Formal, casual, funny, professional
- **Industry** – e.g. Food & Beverage, Fashion, Tech
- **Do's / Don'ts** – What to include or avoid
- **Example posts** – Reference content to match
- **Preferred hashtags** / **Banned words**

When generating for a client, brand voice is automatically injected into prompts.

## Files

- `utils/ai/prompt-builder.ts` – Mode definitions, brand voice injection
- `utils/ai/optimized-generator.ts` – Uses prompt-builder, calls OpenAI
- `app/api/generate/route.ts` – Accepts `generationMode`, fetches brand voice when `clientId` present
- `app/dashboard/generate/page.tsx` – Mode selector, brand voice display
- `app/dashboard/clients/[clientId]/brand-voice/page.tsx` – Edit brand voice

## DB Migration

Run `npm run db:push` after adding `brand_description` and `target_audience` to `client_brand_voice`.
