# Assessment audit — selective-errors-v2

Reviewed 2026-11-12. This file describes the fixed-key assessment implemented in `assessment.js` and its numerical checks. It is instructor documentation and contains the assessment logic.

## Scoring and scope

There are 24 reasoning points, with four in each of six analysis stages. Students **report only statements they believe contain an error**. A saved report requires two selections: the statistical problem (three choices) and appropriate correction (four choices). There is **no acceptance/no-problem answer option**. Opening the form alone does not report a statement. Acceptable statements should be left unreported, and saved reports can be removed before submission.

For an actual flawed quote, exactly one diagnosis identifies its error, and one correction gives the appropriate method or conclusion. For its supported counterpart, none of the diagnosis claims applies: saving any report is a false alarm. A statistically sound action selected for an already sound quote does not earn points. The options and layout are the same across both variants, without revealing which version was shown. Choices are shuffled deterministically by attempt seed and none is preselected.

Students judge only the quoted point under the stated unweighted teaching model, using alpha=0.05 unless specified otherwise. An unrelated flaw elsewhere in a response is not grounds for rejecting a supported quote. All six stages must be discussed, but **there is no minimum report count or requirement to answer every statement**. Two independent transfer questions remain required. Submission treats every unreported statement as accepted, locks the attempt, and reveals the key and explanations. Earlier required-answer sets and scores are archived, not silently converted into current error reports.

## Balanced automatic score out of 100

With both flawed and supported statements present, the actual errors collectively carry **48 points**, supported statements collectively carry **48 points**, and two transfer questions carry **2 points each**. Each statement shares its class’s weight equally. A single-class reference profile allocates all 96 statement points to the class that is present.

For F actual errors and S sound statements, when both are positive:

- Actual flawed statement, unreported: **0** (missed error).
- Actual flawed statement, reported: **(48/F) × (correct diagnosis + correct correction)/2**, with each correctness indicator 0 or 1.
- Sound statement, reported: **0** (false alarm), regardless of the selected choices.
- Sound statement, unreported: **48/S**, without requiring any answer.

In mixed mode F=7 and S=17. Reporting exactly the seven actual errors with correct choices, and answering both transfers correctly, earns 100. Accepting everything or reporting everything with otherwise correct choices earns only 52. The equal class budgets prevent the majority of sound statements from making an accept-everything strategy score highly. This is a teaching rubric choice, not a statistical estimator of student mastery.

A missed error reduces a perfect score to **93.1**, one false alarm reduces it to **97.2**, and one wrong correction for an otherwise correctly reported error reduces it to **96.6**. One of each gives **86.9**. Final scores use unrounded components and are rounded to one decimal; stage maxima depend on their class mix. Reports also show raw counts of actual errors reported, misses, false alarms, sound statements retained, and correct diagnoses/corrections. A correct reporting decision can coexist with a wrong diagnosis or correction, so these counts are distinguished from points.

## Statistical review of the 24 reasoning points

The diagnosis below is keyed only when the displayed quote contains that error. With the supported counterpart, the correct student behavior is to leave the quote unreported; there is no applicable diagnosis option. These boundaries were checked against both generated quote variants and all correction choices.

| Point | Error diagnosed and sound action | Boundaries that keep the answer unique |
| --- | --- | --- |
| raw.1 | Numerical category codes do not establish quantitative spacing or equal effect increments. Use factors unless a numerical trend is deliberately justified. | Integer storage does not imply a Poisson model; binary predictors are permitted in OLS. |
| raw.2 | A small missing proportion does not guarantee unbiased deletion. Report the 63 exclusions, examine missingness by group, and describe the selected sample. | A missing change is not zero; sample size alone does not remove selection bias. The key does not assert that complete-case analysis is valid only under MCAR. |
| raw.3 | The six demo_* columns are generated teaching variables. Preserve their synthetic label and original-data provenance. | Adding columns does not overwrite original observations; simulation can illustrate methods but cannot be called observed clinical evidence. |
| raw.4 | wt82_71 is follow-up minus baseline: positive means gain, negative means loss, in kg. | Changes may be negative. A percentage change requires a baseline denominator; multiplying kg by 100 is insufficient. |
| visual.1 | A long right tail motivates a resistant summary such as median/IQR and possibly a log-scale plot. Large n does not normalize raw observations. | The CLT concerns a sampling distribution under its conditions. Positive support can be skewed; medians do not require normality. |
| visual.2 | demo_visits retains nonnegative integer support regardless of display. Use a discrete display and the documented count interpretation. | Counts can be predictors and can include zero. A Poisson law is known here from the simulation, not inferred merely from being a count. |
| visual.3 | OLS does not require marginal normality of every predictor. Check the conditional mean, residual behavior, variance, independence and influence. | Neither a normal predictor nor a residual plot guarantees independence or absence of confounding. Transformations need a modeling purpose. |
| visual.4 | A boxplot extreme is a screening flag. Check validity and influence before justified exclusions or sensitivity analysis. | Whiskers neither prove an outside value erroneous nor guarantee an inside value correct. Extremes can influence estimates. |
| table1.1 | Age mean (SD) describes individual spread. SE describes precision of the estimated mean and must be labeled separately. | Under the working independent-sampling model, SE=s/sqrt(n), not SD. Variance has squared units and is not SD. |
| table1.2 | Median [Q1,Q3] is a resistant description of the long right tail. A mean/SD display or large n does not prove normality. | Mean and SD remain computable for skewed data; the key does not declare those summaries inherently invalid. IQR has the variable’s units. |
| table1.3 | For the listed categorical variables without missingness, use group denominators 1,163 and 403 for column percentages. | Levels of one variable sum to 100% within a group; all variables jointly do not. Full-sample percentages answer a different question. |
| table1.4 | A baseline p-value is not a confounder test. Choose adjustment using the scientific question and design/causal knowledge. | Neither significance nor non-significance establishes a variable’s causal role, randomization or identical population distributions. |
| tests.1 | Compare person-level changes between different cessation groups using an independent unequal-variance mean comparison under the stated teaching model. | Repeated visits within each person do not pair quitters with continuing smokers. Unequal group sizes do not preclude an independent test. |
| tests.2 | For mean within-person change versus zero, use a paired t test or one-sample test of the differences: n=1,566, df=1,565. | Larger n does not erase repeated-measure covariance. Arbitrarily permuting identities destroys the actual pairing. |
| tests.3 | Inspect expected counts; a two-sided Fisher exact test is suitable for this sparse independent 2×2 table. | Total n does not guarantee adequate expected cells. Binary variables alone do not imply a paired design, and expected counts are not observed counts. |
| tests.4 | At alpha=0.05, p≈0.581 gives insufficient evidence against the stated rank-test null. It is not a probability that distributions are equal. | Rank-sum is not generally a mean test or a median-only test without extra shape/shift conditions. Non-rejection does not prove equality. |
| anova.1 | The independent group-normal synthetic outcomes have unequal variances; Welch ANOVA is appropriate. | n>30 does not imply equal variance. Unequal variances do not make every mean comparison impossible. Groupwise centering would remove the mean differences under study. |
| anova.2 | A rejected equal-means omnibus null supports “not all means equal,” then inspect the specified adjusted pairwise comparisons. | It does not establish significance of every pair. A–B p≈0.456 is non-significant, not proof of exact equality. |
| anova.3 | Apply Holm to the prespecified family of three pairwise Welch tests to address familywise Type I error. | Per-test alpha is not generally familywise alpha. Holm does not require independent tests. No exact unadjusted familywise probability is claimed. |
| anova.4 | A small p-value is evidence against the equal-means null under the test model; evaluate magnitude and context separately. | A p-value is not a posterior null probability, practical effect size or individual response rate. |
| regression.1 | Use i.education and i.exercise for the stated factor model unless a separate numerical trend is prespecified and defended. | Consecutive codes do not justify equal effect increments. A justified ordinal trend is possible; factors do not require normal category codes. |
| regression.2 | Large n does not guarantee homoscedasticity. Consider HC3 for variance-related inference while checking other model issues. | HC3 does not fix confounding, misspecified mean functions or dependence automatically. Heteroscedasticity alone need not bias OLS coefficients under a correct zero-conditional-mean model. |
| regression.3 | Age plus tiny noise is deliberately redundant. Retain meaningful original age and omit the copy in this explanatory model, then reassess. | Different names do not remove numerical collinearity. VIF concerns variance inflation, not causation or heteroscedasticity; unstable separate coefficients do not establish no association. |
| regression.4 | Interpret the cessation coefficient and interval as an adjusted observational conditional-mean association within the stated scope. | Adjustment and significance do not establish causal identification, identical individual effects or national representativeness. A coefficient CI is not an individual prediction interval. |

The paired/unpaired distinction and unequal-variance option follow the official [Stata t-test manual](https://www.stata.com/manuals/rttest.pdf). The independent rank-test null follows the [Stata rank-sum manual](https://www.stata.com/manuals/rranksum.pdf). The percentage and exact-test distinctions follow the [Stata two-way table manual](https://www.stata.com/manuals/rtabulatetwoway.pdf). Factor notation and robust covariance estimation are documented in the [Stata regression manual](https://www.stata.com/manuals/rregress.pdf).

The p-value boundaries follow the [ASA statement on statistical significance and p-values](https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf). Holm’s validity under arbitrary dependence is documented in the [official p.adjust reference](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html); this reference supplies a statistical property, not code used by the webpage. Missingness is assessed through mechanism and analysis assumptions, rather than a percentage-only rule, consistent with the [National Academies report on missing data](https://www.ncbi.nlm.nih.gov/books/NBK209904/pdf/Bookshelf_NBK209904.pdf). Observational adjustment and causal identification are distinguished in Hernán and Robins’ [Causal Inference: What If](https://miguelhernan.org/whatifbook).

## Transfer questions

1. **Repeated binary outcome, same people before and after:** McNemar’s test uses discordant pairs to compare paired marginal proportions. Independent chi-square or ANOVA ignores pairing; a Welch test on text labels is not defined. Small discordant counts may call for the exact version. See the official [Stata matched case-control/matched proportions documentation](https://www.stata.com/manuals/repitab.pdf).
2. **Independent sampling, fixed finite population SD, n to 4n:** SE(mean)=SD/sqrt(n), so SE halves. It does not become one quarter, double, or imply a change in the individual population SD. The stated sampling conditions exclude design effects that would invalidate this elementary scaling.

## Numerical checks against bundled data

`check_assessment.cjs` independently reads the frozen CSV and checks the quantities that affect options and keys. `check_stata.cjs` independently reconstructs the bundled Welch ANOVA and Holm calculations. Approximate values are rounded only for display.

| Quantity | Checked value or identity |
| --- | --- |
| Original and analysis n | 1,629 original; 63 missing outcomes; 1,566 analyzed |
| Missing outcome by group | 25/428 quitters and 38/1,201 continuing smokers |
| Analysis group n | 403 quitters and 1,163 continuing smokers |
| Outcome direction | wt82_71 = wt82 − wt71 within stored numerical precision |
| Categorical column percentages | Sum to 100% for each categorical variable within each group, before display rounding |
| SD/SE | SE = sample SD/sqrt(group n) for age summaries |
| Between-group change | Quitter minus continuing mean change ≈2.540581 kg |
| Paired difference df | 1,566 − 1 = 1,565 |
| Rare binary table | Eight observed heart-failure histories; smallest expected count ≈2.058748 |
| Rank-test p | ≈0.581205, using the documented tie-adjusted large-sample approximation without continuity correction |
| Synthetic ANOVA SDs | A≈3.00195; B≈6.19362; C≈10.3294 |
| Variance check | Median-centered Levene p<0.001 |
| Welch ANOVA | F≈39.215257; df1=2; df2≈838.220906 |
| Pairwise comparisons | A–B raw/Holm p≈0.456444; A–C and B–C remain significant after Holm |
| Collinearity | Age-copy VIF≈6,188 in the labeled age + copy + cessation candidate model |
| Residual variance check | Reference-model Breusch–Pagan p<0.001 |

## Automated verification and limits

- All 24 points have three distinct diagnosis choices and four distinct correction choices. A flawed quote has exactly one diagnosis key. A supported quote has no applicable diagnosis key; every saved report is a false alarm. No diagnosis options state that the quote is acceptable. Option text/order is identical across a quote’s two variants, with keys withheld in the interface.
- Across 250 seeded profiles: correct selective reports give 100; all wrong reports and transfers give 0; a missed error, false alarm, wrong diagnosis/correction, or combination receives the specified weight. Submitting no reports is valid and earns 52 in mixed mode with correct transfer answers. Reporting every statement with otherwise correct choices also earns 52. Partial saved reports and missing stages/transfer answers are rejected, while unreported statements are allowed.
- Fully sound references give 100 for no reports with correct transfers and penalize a false alarm. An all-flawed test profile gives 100 for fully correct reports and only 4 for no reports with correct transfers. No division by a zero class count occurs.
- Shuffling is stable within an attempt and exercises all three diagnosis positions and all four correction/transfer positions across seeds.
- Offline DOM integration verifies cancel/remove behavior; seven saved reports with one missed error, one false alarm and one wrong correction produce 86.9 before and after reload. It also submits zero reports, checks the fully sound reference, exports JSON/CSV, locks submitted reports, completes missing stages without rerolling errors, and archives earlier required-answer scores and choices without fabricating reports.
- Statistical review supports the intended single best answers; it is not a claim of psychometric validation or measured reliability. Stata execution and real-browser visual QA were unavailable on this development machine. The existing README records those limits. The page remains an editable, local formative teaching tool.
