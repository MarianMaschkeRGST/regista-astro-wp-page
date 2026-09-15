**2026/09/15**
The overall structure matches the document. The part the document cares about most is where the build is weakest. The page flow and the WordPress data model fit, but the AI mostly restates what the user wrote and matches beliefs, and sections 04–06 pick posts at random. That's close to the document's NG case (賢いレコメンドサイト). In one place, section 06, I built the opposite of what the document intends.

## On track

Input first, and the right question. The page opens on 「いま、何を考えていますか？」 rather than a navigation or search box (STEP 1).
Analysis axes. who / theme / stage / drive / ask cover §2's 役割・問題意識・感情・フェーズ・価値観. VALUE is used for belief matching instead of being a separate axis.
BELIEF is a hard constraint. The model can only choose beliefs that exist in WordPress (z.enum). That fits §8 (BELIEFを制約条件として組み込む) and §7 (公式見解を勝手に生成しない).
One structure: BELIEF → METHOD → PROJECT. It runs through ACF relationships, WordPress remains the source, and sections 01–06 follow STEP 3–8.
The §6 block model already exists in WordPress. The "Project Fields" group has summary, question, context, hypothesis, action, evidence, learning, quote and next_question.

## Where we deviated

### 1. QUESTION and REFRAME are one field, and the prompt treats the input as a need to fulfil.

The rubric starts "A visitor describes what they are looking for". The page's meta description says "Tell us what you are looking for." §3 explicitly rejects 「何を探していますか？」.
One rephrased field does STEP 3 and STEP 4 together. The outputs show the effect: mostly restatement of the user's wish (「〜したいのですね」). The weather test got 「明日の東京の天気を知りたいのですね…一緒に整理できます」, which is 迎合 (a §7 NG) and not a reframe.
01 shows the raw input. §3 says YOUR QUESTION should return the question form, without asserting it (「もしかすると…でしょうか」).

### 2. The model speaks as Regista and makes promises.

"In the company's voice" produces lines like 「一緒に考えられます」 and 「ぜひ一緒に挑戦しましょう」. Those are commitments on the company's behalf (§7 NG: 公式見解を勝手に生成する).
02 (AI text) uses the same quote style as 01 (user input), with no label. That breaks §7's rule against blurring AI text and original content.

### 3. Sections 04–06 are picked at random.

§7 asks for a combined evaluation that includes each item's role in the story.
We pick randomly from posts linked through the relationships.
The axis reading (who/theme/stage) is computed, then nothing uses it.

### 4. Section 06 does the opposite of the document's SURPRISE.

§7 describes the 4th slot as 「関連度は少し下がるが、構造が似た意外な接続」. CASE A links youth support to 寺院・朝市 because both are about building relationships in a community.
I built "shares no selected method or belief": unrelated, not structurally similar. The similarity should come through a shared belief or method, with the difference being the field or the kind of actor.
That was my interpretation and it's wrong. §7 also has one slot for this, and your component note says 1件, but we return 2.

### 5. Only title and excerpt reach the page.

The §6 block fields exist in WordPress but aren't exposed: projectFields isn't in GraphQL, and REST returns acf: [].
With excerpts, 05 can't show what changed (§9: 表現ではなく現象). The 3rd slot, 「強いEVIDENCEを持つ別案件」, needs the evidence field.

### 6. Order of work.

§11 says define the brand core and content structure first, and add AI after.
We built the AI first. I don't think that was wrong: it exposed content problems early, like the ACF name collisions, missing fields and overlapping beliefs.
But the AI is now ahead of the content it depends on.

#### Annotation:

Ignore this point. It is irrelevant for the development team. We are testing out the technical concept.

## Where I'd deviate from the document

### Keep the confirmation step, but only for the QUESTION.

The document has no confirmation gate. A light 「この問いで合っていますか？」 fits §3's intent to leave room and lets users correct it early.
Show the REFRAME only on the result page, so it arrives as the insight.
Today the confirm screen shows the rephrasing and beliefs, and the result page repeats them in 02–03.

### Don't build §7's scoring system yet.

With 4 beliefs, 5 methods and 5 projects, semantic similarity plus role scoring is overkill.
Use the relationships to build candidate lists, and let the model choose from them with enum-constrained IDs, the same pattern that already works for beliefs.
Keep randomness only as a tie-breaker, so return visits vary.

### Merge 07 WHAT CHANGED into the project cards.

§9 says each project should show what changed. A separate section splits that up and lengthens an 11-section page whose goal is action (§8), not reading time.

### Make beliefs match less often.

§5 plans 5–7 principles. Today 3 of your 4 beliefs are about regional or social contribution, so most inputs match all three.
They need to be distinct enough to tell inputs apart before more AI work pays off.

### Never show the drive/emotion reading.

§7 forbids 過度な心理分析. Use it internally for tone and for choosing the call to action, but never tell users 「あなたは危機感を…」.

## Suggested order

### Rubric and schema. This is cheap, and the biggest gain in alignment.

Split question and reframe.
Frame the input as what they're thinking about.
Forbid echoing the need back and speaking as Regista.
Require the reframe to change the unit, the actor or the time horizon (§3 STEP 4).
Label AI text on the page.

### Return the axis reading as structured fields (nullable enums).

Sections 06, 10 and 11 need them.

### WordPress content model.

Expose Project Fields to GraphQL.
Add THEORY / DATA / CASE / LEARNING fields to methods (§5).
Add the change-based project categories (§5: 若者の挑戦をひらく …). Those categories are also what make a real SURPRISE possible: same belief, different category.
Then replace the random picks with model-ranked picks from the candidates, and redefine 06.

### KPIs. Log queries and call-to-action clicks. Both WordPress sites already have the regista/v1 namespace from your Next project's query-log plugin, which is probably reusable.

If it would help your team discussion, I can turn this into a shareable page.
