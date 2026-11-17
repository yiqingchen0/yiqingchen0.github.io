# StatSense Lab — PHEB 602 · Biostatistics I

*Evaluate statistical reasoning. Identify errors. Make better decisions.*

**StatSense Lab** is the website. **Agent** is its simulated chat assistant; the chat header, replies and assistant identity retain that name.

**Open `index.html` in a browser.** The page works offline with no API key, server, installation, or internet connection. Keep the whole folder together; the HTML file depends on its local scripts, data and figures.

The interface, generated assistant replies, feedback and instructions are in **English**. Every displayed analysis code block uses **Stata**. This is a controlled conversational simulation, not a live GPT service. The browser displays precomputed outputs and curated reasoning; it does not execute student-entered code or run Stata.

## Use the lab

1. Open `index.html` and choose **Start with the raw data** or enter a question.
2. Continue through **raw data → visualization → Table 1 → hypothesis tests → ANOVA → linear regression**, or select **Run the full workflow**.
3. Ask follow-up questions such as “Why this test?”, “What assumptions are you making?”, or “Show the Stata code.” Questions in Chinese are also understood within the supported scope, but replies remain English.
4. **Report only statements you believe are wrong.** Select **Report an error**, choose the statistical problem and correction, then **Save error report**. The diagnosis has three choices and the correction has four. There is no acceptance/no-problem choice. Opening and closing the form does not create a report; saved reports can be edited or removed before submission.
5. Leave statements you accept unreported. Select **Finish & score** to inspect your saved reports. There is no required report count and no need to answer every statement. If stages are missing, **Complete remaining analysis steps** adds them without changing the error profile. The two independent single-choice transfer questions remain required.
6. Submit to receive an automatic **score out of 100**, missed-error and false-alarm counts, stage breakdowns, and statistical explanations. **An actual error left unreported earns zero; a sound statement reported as wrong also earns zero.** Submission locks the attempt. Export the full JSON report or one-row score CSV, or print the report. Nothing is sent automatically.

When this updated page is reloaded, earlier generated assistant replies and legacy button-generated user prompts are refreshed in English, with Stata code. Custom student-authored messages, notes and corrections are preserved in their original language. Earlier answer sets and scores are archived and included in exports; answers from the former required-answer version are not silently reinterpreted as error reports. Refreshing is enough; there is no need to clear conversation history. Browser storage is local and editable; export important work before changing browsers or moving the folder.

## Stata files

Set Stata’s working directory to this project folder, then run:

```stata
do "stata/reference_analysis.do"
```

Alternatively, pass the project directory as the first quoted argument:

```stata
do "/path/to/NHEFS_Chatbot_Local/stata/reference_analysis.do" "/path/to/NHEFS_Chatbot_Local"
```

The bundled scripts use Stata 15.1 or later and require no external add-ons:

- `stata/reference_analysis.do`: correct reference workflow, including distributions, Table 1, independent and paired tests, categorical/rank tests, ANOVA, multiplicity and regression diagnostics.
- `stata/agent_welch.do`: defines `agent_welch`, an explicitly bundled implementation of Welch one-way ANOVA using group summaries. It is not presented as a built-in Stata command.
- `stata/agent_pairs.do`: defines `agent_pairs`, which performs pairwise independent unequal-variance t tests with optional Holm adjustment.

Example:

```stata
import delimited "data/nhefs_teaching.csv", clear
keep if !missing(wt82_71, qsmk)
encode demo_group, generate(demo_group_id)
robvar demo_score, by(demo_group_id)
* W50 is the median-centered variance check.
do "stata/agent_welch.do"
agent_welch demo_score, by(demo_group_id)
do "stata/agent_pairs.do"
agent_pairs demo_score, by(demo_group_id) holm
```

Code in a chatbot response follows that conversation’s selected analysis and may deliberately contain a methodological error. The **reference** do-file above provides the sound workflow. Table 1 percentiles use Stata’s default percentile convention; rank comparisons use the large-sample tie-adjusted approximation without continuity correction. The regression displays Stata-style coefficient labels and uses HC3 when the selected reasoning supports robust inference. See the official [t-test manual](https://www.stata.com/manuals/rttest.pdf), [rank-sum manual](https://www.stata.com/manuals/rranksum.pdf), [percentile manual](https://www.stata.com/manuals/dpctile.pdf), and [regression manual](https://www.stata.com/manuals/rregress.pdf).

## Approximately 30% deliberate errors

A full workflow contains **24 auditable reasoning decisions**, four per stage. Mixed mode selects **7 flawed decisions (29.2%)**, with at most two per stage and at least one completely sound stage. The other 17 decisions are sound. This rate refers to the specified decisions, not every sentence, number or reply.

Each new conversation receives a fixed random profile. Repeating a question does not reroll its errors. Instructor demonstration settings offer a fixed profile or a fully sound reference profile for new conversations. These controls are not authenticated or protected from students.

The error bank covers variable coding, missingness, simulated-data provenance, direction of change, distribution assumptions, SD versus SE, percentage denominators, confounder selection, paired versus independent tests, sparse expected counts, p-value interpretation, variance homogeneity, omnibus versus pairwise inference, multiplicity, residual diagnostics, collinearity and causal overclaims. Some errors change the selected statistical output; others affect the reasoning or omit a necessary check. The numerical alternatives are calculated from the bundled data.

Students decide which of the 24 reasoning points contain errors. **Only suspected errors require answers.** Unreported statements are treated as accepted when the student submits. A missed actual error and a false alarm on a sound statement each earn zero for that statement. For a reported actual error, the correct diagnosis earns half its weight and the correct correction earns the other half. Reporting a sound statement earns no credit, even if the selected action is otherwise statistically reasonable.

The automatic score balances error detection/correction and correct retention: **actual errors share 48 points**, **sound statements correctly left unreported share 48 points**, and **two transfer questions add 4 points**. Thus the mixed profile’s seven errors each carry 48/7 points and its 17 sound statements each carry 48/17. Accepting everything, or reporting everything with otherwise correct choices, earns only 52/100 if both transfer answers are correct. A single-class reference profile allocates all 96 statement points to that class. Final scores are rounded to one decimal; stage maxima reflect their mix of sound and flawed statements.

Each actual error has one applicable diagnosis and one appropriate correction. Sound quotes deliberately have no applicable diagnosis option: students should leave them unreported. The form and option order do not identify which quotes are sound. Options are shuffled reproducibly, with no preselected answer. Keys appear after final submission. The [assessment audit](ASSESSMENT_AUDIT.md) records the scoring formula, statistical rules, numerical checks, distractor boundaries and primary references. This is a curated teaching assessment, not a psychometrically validated examination.

## Data provenance

The original public teaching subset comes from Hernán and Robins, *Causal Inference: What If*: [dataset source](https://miguelhernan.org/whatifbook), retrieved 2026-11-11.

- `data/nhefs_original.csv`: 1,629 rows and 64 original columns, unchanged.
- `data/NHEFS_Codebook.xls`: original codebook.
- `data/nhefs_teaching.csv`: 1,629 rows and 70 columns, including six synthetic columns.
- Excluding 63 missing weight-change outcomes leaves 1,566 people: 403 quitters and 1,163 continuing smokers. Cholesterol summaries use its variable-specific available n.
- `qsmk=1` denotes quitting; `wt82_71` is follow-up minus baseline weight in kg.

The real-data analyses are unweighted complete-case observational illustrations, not survey-adjusted national estimates or identified causal effects. All `demo_*` variables are synthetic, not original NHEFS measurements. Their frozen values were generated with seed 602 and are included in the working CSV:

| Variable | Teaching purpose |
| --- | --- |
| `demo_normal` | Normal(50, 10²) continuous covariate |
| `demo_biomarker` | Log-normal covariate with log mean log(10), log SD 1.15 |
| `demo_visits` | Poisson(2.5) nonnegative count |
| `demo_group` | Nominal A/B/C grouping for the synthetic ANOVA |
| `demo_score` | Group-normal outcome: A mean20/SD3, B mean20/SD6, C mean24/SD10 |
| `demo_age_copy` | Age plus Normal(0, 0.15²), creating severe collinearity |

The score has arbitrary units and may be negative. Stata scripts analyze the supplied frozen values; running a different random-number generator with seed 602 is not claimed to regenerate the same values.

## Contents and verification

```text
index.html / style.css     English chat interface
app.js / engine.js        Conversation, error profiles, answers and score report
assessment.js             Variant-specific single-best-answer bank and scoring
ASSESSMENT_AUDIT.md        Statistical audit and grading specification
data.js                   Offline preview and reference outputs
assets/                   Actual data figures and icon
data/                     Original/working CSVs, codebook and reference JSON
stata/                    Stata reference workflow and bundled helpers
check_engine.js           Error budgets, stable reasoning and Stata-only output checks
check_ui.cjs              Offline DOM interaction and saved-chat migration checks
check_language.cjs        Legacy preset prompts in chat history and exports
check_stata.cjs           Independent checks of Welch and Holm formulas
check_assessment.cjs      Selective reports, missed/false alarms, scores and data facts
```

Completed checks include 250 seeded selective-report profiles; diagnosis/correction choices without an acceptance option; perfect, missed-error, false-alarm and wrong-correction scores; zero-report submission; fully sound/all-flawed scoring edge cases; stable shuffled options; Stata-only code; English generated content; data preview; report persistence; keys withheld in the interface and current response exports before submission; archived earlier work; locking; JSON/CSV exports; missing-stage completion; stopping/new-chat interactions; and input escaping. Welch F/df and Holm calculations were independently compared with the raw CSV and reference results. Offline DOM checks verify a combined missed error, false alarm and wrong correction scores 86.9/100 after reload; a zero-report mixed attempt scores 52/100; and a zero-report fully sound reference scores 100/100, with correct transfer answers.

**Verification limits:** Stata is not installed on the development machine, so the do-files have not been executed in Stata. The current Codex browser does not permit local `file://` previews, so real-browser visual/click testing was not completed; no browser restriction was bypassed. The page itself uses ordinary local HTML/CSS/JavaScript and has no runtime network dependencies.

This is an editable local teaching prototype. Keys are present in local source, reports are not authenticated, and no central submissions or gradebook are connected.
