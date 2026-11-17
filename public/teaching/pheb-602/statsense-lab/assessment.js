/* Selective error reporting: no report means the student accepts the statement.
 * Reported errors require a diagnosis and correction, without a no-problem option.
 * Balanced scoring accounts for missed errors and false alarms, out of 100.
 */
(() => {
'use strict';
const VERSION='selective-errors-v2';
const BANK={
 'raw.1':{
  sound:'The statement correctly distinguishes a numeric category code from a continuous measurement scale.',
  issue:'It assumes equally spaced quantitative effects merely because categories are stored as numbers.',
  distractors:['The statement is wrong because every integer-valued column must have a Poisson model.','The statement is wrong because binary predictors cannot be used in linear regression.'],
  action:'Use factor coding for exercise and education unless an explicitly justified numerical trend model is intended.',
  wrongActions:['Treat every numerical code as a continuous predictor without checking its meaning.','Remove every categorical variable because OLS permits only continuous predictors.','Reorder category codes using the observed outcome, then interpret them as a prespecified scale.'],
  rationale:'Storage format does not establish measurement scale or equal effect increments. An ordinal trend can be modeled deliberately, but its constraints need justification.'
 },
 'raw.2':{
  sound:'The statement correctly defines the complete-case sample while acknowledging possible selection bias.',
  issue:'It treats a small missing percentage as a guarantee that complete-case deletion is unbiased.',
  distractors:['The statement is wrong because an unobserved weight change is necessarily zero.','The statement is wrong because a larger observed sample automatically eliminates selection bias.'],
  action:'Report the 63 missing outcomes and the complete-case scope, examine missingness by group, and avoid claiming that deletion is automatically unbiased.',
  wrongActions:['Replace all missing changes with zero and count those values as observed outcomes.','Declare missingness harmless solely because it is below 5%.','Omit the exclusion count so the two group means look easier to compare.'],
  rationale:'The proportion missing alone does not identify the missingness mechanism. In the original file, outcomes are missing for 25/428 quitters and 38/1,201 continuing smokers.'
 },
 'raw.3':{
  sound:'The statement correctly labels the demo_* columns as generated teaching variables rather than original observations.',
  issue:'It misrepresents generated teaching variables as measurements collected in the original NHEFS study.',
  distractors:['The statement is wrong because adding a simulated column changes every original measurement.','The statement is wrong because simulated data can never illustrate a statistical method.'],
  action:'Retain the original data provenance and clearly label every demo_* column and its findings as simulated.',
  wrongActions:['Describe the generated markers as original clinical measurements because they are in the same CSV.','Remove the demo_ prefix and omit the generating mechanism from the documentation.','Present the synthetic-group comparison as an observed clinical result from NHEFS.'],
  rationale:'The six added columns have documented generators and seed 602. They can illustrate methods but cannot be represented as observed NHEFS findings.'
 },
 'raw.4':{
  sound:'The interpretation correctly follows the stated subtraction order: follow-up minus baseline.',
  issue:'It reverses the sign interpretation of a follow-up-minus-baseline change score.',
  distractors:['The statement is wrong because every weight-change score must be nonnegative.','The statement is wrong because a change in kilograms is automatically a percentage change.'],
  action:'Interpret positive wt82_71 as weight gain and negative wt82_71 as weight loss, with the result expressed in kilograms.',
  wrongActions:['Interpret positive wt82_71 as weight loss while keeping the same subtraction order.','Use the absolute value of every change and still describe it as signed weight change.','Multiply the kilogram change by 100 and label it percentage change without using baseline weight.'],
  rationale:'If follow-up weight exceeds baseline weight, follow-up minus baseline is positive. Units remain kilograms; a percentage change requires a baseline denominator.'
 },
 'visual.1':{
  sound:'The statement reasonably uses the visible right tail to motivate a resistant descriptive summary.',
  issue:'It incorrectly uses a large sample size or the CLT to claim that individual biomarker values are normal.',
  distractors:['The statement is wrong because a positive-valued variable cannot be right-skewed.','The statement is wrong because a median can be calculated only for normal measurements.'],
  action:'Describe the observed right tail; median and IQR are useful resistant summaries, and a log-scale plot may aid exploration.',
  wrongActions:['Ignore the visible skewness because n is greater than 30.','Assert normality of raw biomarker values because the sample mean has a small SE.','Remove the right half of the observations so the remaining histogram looks symmetric.'],
  rationale:'The CLT concerns a sampling distribution of a mean under conditions such as independence and finite variance. It does not make the raw observations symmetric.'
 },
 'visual.2':{
  sound:'The statement correctly identifies integer-valued support for the simulated visit count.',
  issue:'It assumes that drawing a histogram changes a discrete count into a continuous normal measurement.',
  distractors:['The statement is wrong because a count predictor can never be included in a regression model.','The statement is wrong because a Poisson-generated count can take any negative integer value.'],
  action:'Retain the nonnegative integer interpretation and use an appropriate discrete display; do not infer continuity or normality from the plot format.',
  wrongActions:['Treat visit counts as continuous normal measurements solely because a histogram was drawn.','Delete every zero count because a count distribution cannot include zero.','Convert all integer counts to text because numerical summaries are not defined for counts.'],
  rationale:'A plotting command does not change a variable’s support. Here the Poisson generator is known because demo_visits was generated; real count variables do not automatically follow a Poisson law.'
 },
 'visual.3':{
  sound:'The statement correctly focuses regression checks on the conditional model and residual behavior rather than normality of every predictor.',
  issue:'It imposes a false requirement that every regression covariate must itself be normally distributed.',
  distractors:['The statement is wrong because a normal predictor guarantees independent residuals.','The statement is wrong because a residual plot proves that all confounding has been removed.'],
  action:'Examine mean specification, residual behavior, variance, independence and influence; transform predictors only for a defensible modeling purpose.',
  wrongActions:['Transform every predictor until its marginal histogram is normal, regardless of the modeled relationship.','Declare OLS invalid whenever a predictor is binary or skewed.','Skip all model diagnostics once the predictors look approximately normal.'],
  rationale:'Normality of each X is not an OLS assumption. Transformations may help the mean relationship or interpretation, but marginal predictor normality is not a universal target.'
 },
 'visual.4':{
  sound:'The statement correctly treats boxplot extremes as observations to investigate rather than proven recording errors.',
  issue:'It treats a boxplot screening rule as proof of data error and a sufficient reason for automatic deletion.',
  distractors:['The statement is wrong because unusual observations cannot affect a fitted regression.','The statement is wrong because an observation inside the whiskers is guaranteed to be correctly recorded.'],
  action:'Check definitions and data quality, assess influence, and justify any exclusion with transparent sensitivity analysis.',
  wrongActions:['Delete every point beyond the whiskers without checking its source.','Keep every extreme value but refuse to examine influence or data quality.','Replace all extremes with the sample mean and describe the data as unmodified.'],
  rationale:'A boxplot identifies observations unusual relative to a distributional rule. It does not establish their validity or justify undisclosed deletion or alteration.'
 },
 'table1.1':{
  sound:'The statement correctly distinguishes individual variability measured by SD from precision of the mean measured by SE.',
  issue:'It substitutes SE for SD while labeling the result as variability between individuals.',
  distractors:['The statement is wrong because sample SD and SE become exactly equal whenever n exceeds 30.','The statement is wrong because SD decreases as 1/n whenever more individuals are sampled.'],
  action:'Use mean (sample SD) for the stated age summary; label any SE separately as uncertainty in the estimated mean.',
  wrongActions:['Keep the SE in parentheses and retain the SD label.','Report the variance as SD without taking a square root.','Interpret the SE as the spread of ages among individual participants.'],
  rationale:'Under the stated independent-sampling model, SE(mean)=s/sqrt(n). SD and SE answer different questions and cannot be interchanged because the sample is large.'
 },
 'table1.2':{
  sound:'The statement reasonably uses median and quartiles as a resistant summary of this long right tail.',
  issue:'It claims that a large n or a mean-and-SD display proves normality or symmetry of the raw marker.',
  distractors:['The statement is wrong because the mean and SD cannot be computed for any skewed dataset.','The statement is wrong because the IQR must be expressed in squared measurement units.'],
  action:'For a resistant description, report median [Q1, Q3]; do not claim normality from sample size or the chosen summary format.',
  wrongActions:['Claim symmetry merely because mean and SD have been calculated.','State that median and IQR require a normal population.','Use the SE in place of the IQR and describe it as individual spread.'],
  rationale:'Mean and SD are computable for skewed data and are not inherently forbidden. The error is the normality claim; median/IQR is a useful resistant alternative for this descriptive purpose.'
 },
 'table1.3':{
  sound:'The statement correctly uses the available total within each cessation group for that variable’s column percentages.',
  issue:'It uses the full sample as the denominator while labeling the values as within-group column percentages.',
  distractors:['The statement is wrong because percentages across every variable in Table 1 must jointly sum to 100%.','The statement is wrong because group percentages must use the number of variables as their denominator.'],
  action:'For a categorical variable with no missing values, divide its counts by 1,163 and 403 in the respective columns, so its levels sum to 100% within each group.',
  wrongActions:['Divide every group-specific category count by 1,566 and label it a within-group percentage.','Use 403 as the denominator for both cessation groups.','Exclude rare categories from the denominator while retaining their counts in the table.'],
  rationale:'A column percentage describes the distribution within a group and within a specified variable. Missing values require a stated denominator; the listed categorical variables have no missing values in this analysis sample.'
 },
 'table1.4':{
  sound:'The statement correctly treats Table 1 as descriptive and does not use univariate significance as a confounder test.',
  issue:'It treats p>0.05 in a baseline comparison as proof that a variable cannot confound an association.',
  distractors:['The statement is wrong because all variables with p<0.05 are necessarily confounders.','The statement is wrong because a baseline p-value establishes that cessation was randomized.'],
  action:'Choose adjustment variables using the scientific question and relevant design/causal knowledge, rather than a Table 1 p-value threshold alone.',
  wrongActions:['Remove every candidate with a baseline p-value greater than 0.05.','Include every significant baseline variable and claim this automatically eliminates all confounding.','Interpret non-significance as proof of identical covariate distributions in the populations.'],
  rationale:'A univariate significance test is not a test for confounding. Neither a significant nor a nonsignificant baseline comparison establishes the needed causal role of a variable.'
 },
 'tests.1':{
  sound:'Under the stated independent-person teaching model, the statement correctly compares change scores between two different groups.',
  issue:'It uses a within-person baseline/follow-up test to answer a between-cessation-group question.',
  distractors:['The statement is wrong because unequal group sizes prohibit any independent t test.','The statement is wrong because measuring an outcome twice automatically matches each quitter to a continuing smoker.'],
  action:'Compare the person-level change scores of quitters and continuing smokers with an independent unequal-variance t test under the stated working model.',
  wrongActions:['Pair each quitter with an arbitrary continuing smoker by row order.','Use the paired baseline/follow-up test on all people as the test of the difference between cessation groups.','Treat the grouping variable as the continuous outcome and apply a paired t test to the group labels.'],
  rationale:'Two measurements on a person define that person’s change. They do not create pairs between different cessation groups. The appropriate question is the difference in mean changes, about 2.541 kg here.'
 },
 'tests.2':{
  sound:'The statement correctly analyzes within-person differences using the paired structure.',
  issue:'It treats the same people’s two visits as independent samples and ignores within-person covariance.',
  distractors:['The statement is wrong because a paired t test requires equal baseline and follow-up means under the alternative.','The statement is wrong because increasing the sample size makes repeated measurements on a person independent.'],
  action:'Use a paired t test, equivalently a one-sample t test of the 1,566 change scores against zero, with 1,565 df.',
  wrongActions:['Use an independent test on 3,132 visits and assume all visits are independent people.','Apply Pearson chi-square directly to unbinned continuous weight measurements.','Use a paired t test after randomly permuting one visit’s person identifiers.'],
  rationale:'The variance of the difference includes the covariance of repeated measurements. An independent-samples analysis ignores that structure and answers a different sampling problem.'
 },
 'tests.3':{
  sound:'The statement correctly checks expected cell counts and uses an exact test for the sparse independent 2×2 table.',
  issue:'It assumes that a large total n guarantees adequate expected counts in every cell.',
  distractors:['The statement is wrong because a rare binary variable automatically requires a paired t test.','The statement is wrong because an expected count is an observed number of patients in the cell.'],
  action:'Inspect the expected counts and use a suitable exact test, such as two-sided Fisher, for this sparse independent 2×2 comparison.',
  wrongActions:['Use total n alone to assert that all expected frequencies exceed five.','Switch to McNemar solely because both variables are binary, despite no paired design.','Replace the observed cell counts with their expected values before testing the observed association.'],
  rationale:'The smallest expected count is approximately 2.059 despite total n=1,566. Fisher’s exact test avoids relying on the large-count chi-square approximation for this table.'
 },
 'tests.4':{
  sound:'The statement correctly describes a rank/distribution comparison and a p-value conditional on its null model.',
  issue:'It interprets a p-value as the probability that the population distributions are identical.',
  distractors:['The statement is wrong because Mann–Whitney necessarily compares arithmetic population means.','The statement is wrong because p>0.05 proves that the null distributions are identical.'],
  action:'At alpha=0.05, report insufficient evidence against the stated rank-test null here (p about 0.581); do not claim that equality is proved.',
  wrongActions:['Report a 58.1% probability that the null hypothesis is true.','Claim that the two population means have been proved equal by this rank test.','Conclude that the distributions must differ because a p-value was calculated.'],
  rationale:'A p-value is not a posterior probability of the null. A median-shift interpretation of a rank test requires additional shape/shift conditions; failure to reject does not prove equality.'
 },
 'anova.1':{
  sound:'The statement correctly considers the unequal group spreads and selects an unequal-variance mean comparison.',
  issue:'It assumes equal population variances are guaranteed solely because each group has n>30.',
  distractors:['The statement is wrong because unequal variances make every comparison of population means impossible.','The statement is wrong because using a nominal group variable creates a paired design.'],
  action:'For the independent, group-normal synthetic scores with unequal variances, use Welch ANOVA and report the variance check.',
  wrongActions:['Use ordinary pooled ANOVA on the claim that n>30 guarantees equal variances.','Use a paired t test to compare the three independent synthetic groups.','Standardize each group to have mean zero before testing whether the original means differ.'],
  rationale:'The observed SDs are about 3.00, 6.19 and 10.33, and the simulation intentionally uses unequal variances. Large samples do not establish homogeneity. The Welch F is about 39.215.'
 },
 'anova.2':{
  sound:'The statement correctly limits the omnibus conclusion and checks which pairwise contrasts are supported.',
  issue:'It treats rejection of the equal-means omnibus null as proof that every pair of means differs.',
  distractors:['The statement is wrong because an omnibus test can reject only when all pairwise p-values are below 0.05.','The statement is wrong because a nonsignificant A–B comparison proves exact equality of their population means.'],
  action:'Conclude that not all population means are equal, then use the specified multiplicity-adjusted pairwise results; A–B is not significant here.',
  wrongActions:['Declare every pair significant using only the omnibus p-value.','Claim A and B have exactly equal population means because their pairwise p-value is about 0.456.','Ignore the significant omnibus result because one pair is not significant.'],
  rationale:'The omnibus alternative is that at least one mean differs. Here A–B has p about 0.456 while comparisons with C are significant; an all-pairs conclusion is false.'
 },
 'anova.3':{
  sound:'The statement correctly addresses familywise error across the specified set of pairwise comparisons.',
  issue:'It claims that multiple unadjusted 0.05 tests automatically keep the familywise error rate at 0.05.',
  distractors:['The statement is wrong because the familywise error rate is always exactly 1 minus the largest p-value.','The statement is wrong because Holm adjustment requires all pairwise test statistics to be independent.'],
  action:'Apply the stated Holm procedure to the three pairwise Welch p-values, with the family of comparisons defined in advance.',
  wrongActions:['Use 0.05 for each unadjusted pair and call the familywise error exactly 0.05.','Replace all pairwise p-values with the omnibus p-value.','Select only the significant comparisons after looking at the data and claim multiplicity is eliminated.'],
  rationale:'Per-comparison alpha is not generally familywise alpha. Holm’s step-down procedure controls familywise error without requiring independent tests; no exact unadjusted familywise probability is asserted here.'
 },
 'anova.4':{
  sound:'The statement correctly separates null-model compatibility from posterior belief and practical importance.',
  issue:'It treats the ANOVA p-value as the posterior probability that all population means are equal.',
  distractors:['The statement is wrong because a tiny p-value guarantees a large clinically important difference.','The statement is wrong because a p-value reports the fraction of participants whose outcomes differ.'],
  action:'Interpret the small p-value as evidence against equal means under the test model, and assess effect sizes and context separately.',
  wrongActions:['Report the p-value as the probability the null is true.','State that a very small p-value proves practical importance without considering magnitudes.','Describe the p-value as the percentage of people for whom a treatment works.'],
  rationale:'The p-value concerns a test statistic at least as extreme under the null and assumptions. It is not the probability of a hypothesis, an effect size or an individual response rate.'
 },
 'regression.1':{
  sound:'The statement correctly distinguishes categorical coding from an explicitly justified numerical trend assumption.',
  issue:'It assumes equal effect increments across education categories merely from their codes 1–5.',
  distractors:['The statement is wrong because an ordinal predictor can never be assigned a justified trend model.','The statement is wrong because factor coding requires a normal distribution for the category codes.'],
  action:'Use i.education and i.exercise for the stated factor model, unless a numerical trend model is separately prespecified and defended.',
  wrongActions:['Use c.education solely because the stored codes are consecutive integers.','Drop all categorical covariates because OLS cannot use indicator variables.','Change the category ordering to maximize significance and still call the model prespecified.'],
  rationale:'A trend model can be legitimate, but numerical codes alone do not justify equal increments. The question concerns that unsupported assumption, not a blanket prohibition on ordinal trend models.'
 },
 'regression.2':{
  sound:'The statement correctly uses diagnostics and limits what HC3 robust inference can address.',
  issue:'It assumes large n guarantees constant residual variance and valid conventional standard errors.',
  distractors:['The statement is wrong because heteroscedasticity by itself necessarily biases OLS coefficients even under a correct zero-conditional-mean model.','The statement is wrong because HC3 automatically removes confounding and fixes every nonlinear relationship.'],
  action:'Consider HC3 standard errors for the variance concern while still checking mean specification, independence and influential observations.',
  wrongActions:['Skip residual checks because n=1,566 guarantees homoscedasticity.','Treat HC3 as proof that the model is causal and correctly specified.','Transform every predictor to marginal normality and assume this automatically fixes residual variance.'],
  rationale:'Large n does not imply constant variance. HC3 changes the covariance estimate used for inference; it does not identify causal effects or automatically repair the conditional mean model.'
 },
 'regression.3':{
  sound:'The statement correctly recognizes the deliberately near-duplicate age variable and checks redundant information.',
  issue:'It treats different column names as evidence against collinearity and omits a needed redundancy check.',
  distractors:['The statement is wrong because a high VIF establishes a causal effect.','The statement is wrong because multicollinearity and heteroscedasticity are the same diagnostic problem.'],
  action:'Retain the meaningful original age variable and omit the deliberately redundant age copy in this explanatory model, then reassess diagnostics.',
  wrongActions:['Keep both solely because their column names differ.','Interpret unstable individual age coefficients as proof that age has no association.','Rename the age-copy column and assume this removes the numerical collinearity.'],
  rationale:'The copy is age plus very small noise. Candidate-model VIFs are about 6,188; near-collinearity can inflate uncertainty and destabilize separate coefficients without implying that every prediction is invalid.'
 },
 'regression.4':{
  sound:'The statement correctly limits the coefficient to an adjusted observational conditional-mean association.',
  issue:'It claims that covariate adjustment proves a causal effect of identical size in every individual.',
  distractors:['The statement is wrong because statistical significance guarantees no unmeasured confounding.','The statement is wrong because R-squared is the percentage of people whose outcomes are exactly predicted.'],
  action:'Report the cessation coefficient and its interval as an adjusted association under the fitted model, with the stated observational and unweighted scope.',
  wrongActions:['Report the coefficient as a proven weight increase in every individual.','Claim that adding covariates automatically identifies a national causal treatment effect.','Interpret the coefficient’s confidence interval as an individual prediction interval.'],
  rationale:'Adjustment alone does not establish the assumptions needed for causal identification. A conditional mean coefficient also does not establish an identical individual effect.'
 }
};
const TRANSFER=[
 {id:'transfer.paired-binary',prompt:'A new study measures the same people’s binary outcome before and after an intervention. To compare the two marginal proportions while respecting pairing, which introductory test is appropriate?',choices:[
  'McNemar’s test, using the discordant before/after pairs.',
  'An independent Pearson chi-square test treating the two visits as different people.',
  'A Welch t test applied directly to the text labels positive and negative.',
  'An independent ANOVA with each visit treated as a separate group of unrelated people.'
 ],answer:0,explanation:'Repeated binary outcomes are paired. McNemar’s test targets the change in paired marginal proportions through discordant pairs; an independent table ignores within-person dependence.'},
 {id:'transfer.se-scaling',prompt:'Under independent sampling from the same population with a fixed finite SD, a sample size increases from n to 4n. What happens to the standard error of the sample mean?',choices:[
  'It becomes one-half as large, because SE = SD / sqrt(n).',
  'It becomes one-quarter as large, because SE = SD / n.',
  'It becomes twice as large, because more observations create more variability in the mean.',
  'The population SD of individual observations must become one-half as large.'
 ],answer:0,explanation:'SE is proportional to 1/sqrt(n) under the stated sampling conditions. Quadrupling n halves SE; it does not change the population variability of individuals.'}
];
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function random(seed){let x=seed>>>0;return()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function choices(texts,key,seed,verdicts){const r=random(hash(seed+'|'+key));const list=texts.map((text,i)=>({id:'o'+hash(key+'|'+i).toString(36),text,verdict:verdicts?.[i]}));for(let i=list.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;}
function questions(unit,seed){
 const b=BANK[unit.id];if(!b)throw Error('No question bank entry for '+unit.id);
 const issueTexts=[b.issue,...b.distractors];
 const diagnosisKey=unit.id+'.diagnosis';
 const diagnosis={id:diagnosisKey,prompt:'What is the statistical error you are reporting?',choices:choices(issueTexts,diagnosisKey,seed),answer:unit.truth==='supported'?null:'o'+hash(diagnosisKey+'|0').toString(36)};
 const actionKey=unit.id+'.action';
 const action={id:actionKey,prompt:'Which action or conclusion would correct the reported problem?',choices:choices([b.action,...b.wrongActions],actionKey,seed),answer:'o'+hash(actionKey+'|0').toString(36)};
 return{diagnosis,action,explanation:b.rationale,soundExplanation:b.sound};
}
function transfer(seed){return TRANSFER.map(t=>{const c=choices(t.choices,t.id,seed);return{id:t.id,prompt:t.prompt,choices:c,answer:'o'+hash(t.id+'|'+t.answer).toString(36),explanation:t.explanation};});}
const chosen=(q,id)=>q.choices.find(c=>c.id===id);
function answered(unit,response,seed){if(!response||response.version!==VERSION)return false;const q=questions(unit,seed);return!!chosen(q.diagnosis,response.diagnosisChoice)&&!!chosen(q.action,response.actionChoice);}
function isFlagged(unit,response,seed){return answered(unit,response,seed);}
function score(units,responses,transferChoices,seed){
 if(units.length!==24||new Set(units.map(u=>u.id)).size!==24)throw Error('Complete all 24 reasoning statements before final scoring.');
 const flawed=units.filter(u=>u.truth!=='supported').length,supported=units.length-flawed;
 // Equal total weight for finding/correcting errors and retaining sound reasoning.
 // A single-class reference profile receives the entire 96-point statement budget.
 const weights={flawed:flawed?(supported?48:96):0,supported:supported?(flawed?48:96):0,transfer:4};
 const judgments=units.map(u=>{
  const r=responses[u.id],flagged=isFlagged(u,r,seed),bad=u.truth!=='supported';
  if(r&&!flagged)throw Error('Finish or remove the incomplete error report for '+u.id+'.');
  const q=questions(u,seed),diagnosisCorrect=bad&&flagged&&r.diagnosisChoice===q.diagnosis.answer,actionCorrect=bad&&flagged&&r.actionChoice===q.action.answer;
  const maximum=bad?weights.flawed/flawed:weights.supported/supported;
  const points=bad?maximum*(Number(diagnosisCorrect)+Number(actionCorrect))/2:flagged?0:maximum;
  const status=bad?(flagged?(diagnosisCorrect&&actionCorrect?'correct-report':'incorrect-report'):'missed-error'):(flagged?'false-alarm':'correctly-unreported');
  return{id:u.id,stage:u.stage,title:u.title,body:u.body,truth:u.truth,correct:u.correct,explanation:u.explanation,questionExplanation:bad?q.explanation:q.soundExplanation+' '+q.explanation,flagged,match:flagged===bad,status,diagnosisCorrect,actionCorrect,points,maximum,diagnosis:{prompt:q.diagnosis.prompt,selected:flagged?chosen(q.diagnosis,r.diagnosisChoice).text:null,answer:bad?chosen(q.diagnosis,q.diagnosis.answer).text:null},action:{prompt:q.action.prompt,selected:flagged?chosen(q.action,r.actionChoice).text:null,answer:bad?chosen(q.action,q.action.answer).text:null}};
 });
 const transfers=transfer(seed).map(q=>{const s=chosen(q,transferChoices[q.id]);if(!s)throw Error('Answer both transfer questions.');return{id:q.id,prompt:q.prompt,selected:s.text,answer:chosen(q,q.answer).text,correct:s.id===q.answer,points:s.id===q.answer?2:0,maximum:2,explanation:q.explanation};});
 const stageScores=globalThis.AgentEngine.STAGES.map(s=>({stage:s.id,points:judgments.filter(j=>j.stage===s.id).reduce((n,j)=>n+j.points,0),maximum:judgments.filter(j=>j.stage===s.id).reduce((n,j)=>n+j.maximum,0)}));
 const errorPoints=judgments.filter(j=>j.truth!=='supported').reduce((n,j)=>n+j.points,0),retentionPoints=judgments.filter(j=>j.truth==='supported').reduce((n,j)=>n+j.points,0),transferPoints=transfers.reduce((n,j)=>n+j.points,0),rawPoints=errorPoints+retentionPoints+transferPoints;
 const counts={flawed,supported,reported:judgments.filter(j=>j.flagged).length,caught:judgments.filter(j=>j.flagged&&j.truth!=='supported').length,missed:judgments.filter(j=>j.status==='missed-error').length,falseAlarms:judgments.filter(j=>j.status==='false-alarm').length,retained:judgments.filter(j=>j.status==='correctly-unreported').length};
 return{version:VERSION,time:new Date().toISOString(),points:Math.round((rawPoints+Number.EPSILON)*10)/10,rawPoints,maximum:100,counts,weights,errorPoints,retentionPoints,transferPoints,correctDecisions:judgments.filter(j=>j.match).length,totalStatements:24,diagnosisCorrect:judgments.filter(j=>j.diagnosisCorrect).length,actionCorrect:judgments.filter(j=>j.actionCorrect).length,transferCorrect:transfers.filter(j=>j.correct).length,stageScores,judgments,transfers,grading:'Selective error reporting. In mixed profiles, error diagnosis/correction and correct retention each receive 48 points; transfer receives 4. A missed error or false alarm earns 0 for that statement. A reported actual error earns half its weight for the correct diagnosis and half for the correct correction. Single-class profiles allocate all 96 statement points to that class. Final scores are rounded to one decimal.'};
}
globalThis.AgentAssessment={VERSION,BANK,TRANSFER,questions,transfer,chosen,answered,isFlagged,score};
})();
