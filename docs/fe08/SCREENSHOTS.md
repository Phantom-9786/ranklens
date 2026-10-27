# Checkpoint 1 evidence

For the Portal, upload these three PNGs:

1. [01-happy-path.png](screenshots/01-happy-path.png): public live report lookup completed, showing its structured score card.
2. [04-midstream-cut.png](screenshots/04-midstream-cut.png): localhost proxy deliberately cut the response; partial text and Retry are visible.
3. [06-rate-limit.png](screenshots/06-rate-limit.png): localhost proxy returned HTTP 429; designed rate-limit explanation and Retry countdown.

Optional supporting evidence:

- [02-network-failure.png](screenshots/02-network-failure.png): connection cut before the first response token.
- [03-public-interrupted-response.png](screenshots/03-public-interrupted-response.png): a genuine interrupted public request with its existing report card preserved and Retry available.
- [05-retry-recovered.png](screenshots/05-retry-recovered.png): real Gemini answer after retrying the deliberately cut connection.
- [07-mobile-recovery.png](screenshots/07-mobile-recovery.png): phone-width responsive recovery layout; not physical iPhone Safari.
- [08-malformed-tool.png](screenshots/08-malformed-tool.png): malformed tool payload handled without exposing schema internals.
- [09-api-midstream-error.png](screenshots/09-api-midstream-error.png): typed mid-stream API error with partial text and recovery.

The local fault proxy uses the deployed UI and forwards Retry to the real public service. Its injected partial test text is explicitly labelled and never represented as a genuine model answer. Screenshots are original browser captures.
