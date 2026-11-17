* Correct reference analysis: NHEFS + the frozen synthetic teaching columns.
* Set Stata's working directory to the NHEFS_Chatbot_Local folder first.
* Optionally pass that directory as the first quoted argument to this do-file.
* This file contains correct reference methods, not the chatbot's planted errors.
version 15.1
args project_dir
if `"`project_dir'"' != "" {
    cd `"`project_dir'"'
}
set more off
do "stata/agent_welch.do"
do "stata/agent_pairs.do"

* 1. Raw data, definitions and complete-case scope.
import delimited "data/nhefs_teaching.csv", clear varnames(1)
assert _N == 1629
describe
misstable summarize wt82_71 cholesterol
generate byte missing_change = missing(wt82_71)
tabulate qsmk missing_change, row
keep if !missing(wt82_71,qsmk)
assert _N == 1566
assert abs(wt82_71-(wt82-wt71)) < .0001
tabulate qsmk

* 2. Visualize variable distributions and the observed outcome.
histogram demo_normal
histogram demo_biomarker
histogram demo_visits, discrete frequency
graph box wt82_71, over(qsmk)
twoway (scatter wt82_71 wt71) (lowess wt82_71 wt71)
twoway scatter demo_age_copy age

* 3. Table 1: use SD for spread, and variable-specific available n.
tabstat age cholesterol demo_normal, by(qsmk) statistics(n mean sd)
tabstat wt71 smokeintensity demo_biomarker demo_visits, ///
    by(qsmk) statistics(n p25 median p75)
foreach v in sex education exercise hf {
    tabulate `v' qsmk, column
}

* 4. Questions determine the test; unequal uses Satterthwaite df.
generate byte continued = 1-qsmk
ttest wt82_71, by(continued) unequal
assert abs((r(mu_1)-r(mu_2))-2.54058145496) < .00001
ttest wt82 == wt71
tabulate hf qsmk, exact expected
tabulate sex qsmk, chi2 expected
ranksum demo_biomarker, by(qsmk)

* 5. Synthetic-group ANOVA and multiplicity.
encode demo_group, generate(demo_group_id)
tabstat demo_score, by(demo_group_id) statistics(n mean sd)
graph box demo_score, over(demo_group_id)
robvar demo_score, by(demo_group_id)
* robvar's W50 is the median-centered Levene/Brown-Forsythe check.
agent_welch demo_score, by(demo_group_id)
scalar reference_F = r(F)
scalar reference_df2 = r(df2)
assert abs(reference_F-39.2152572962) < .00001
assert abs(reference_df2-838.220906413) < .0001
agent_pairs demo_score, by(demo_group_id) holm

* 6. Candidate redundancy, model coding and diagnostic checks.
correlate age demo_age_copy
quietly regress wt82_71 c.age c.demo_age_copy i.qsmk
estat vif
local rhs i.qsmk c.age c.wt71 c.smokeintensity i.sex i.exercise i.education
regress wt82_71 `rhs'
* iid + rhs gives the studentized BP/Koenker test using all RHS terms.
estat hettest, rhs iid
rvfplot, yline(0)
predict double residual, residuals
predict double leverage, hat
predict double cooks_d, cooksd
qnorm residual
twoway scatter cooks_d leverage, yline(.0025542784)
count if cooks_d > 4/e(N)
* HC3 adjusts inference for heteroskedasticity; it does not remove confounding.
regress wt82_71 `rhs', vce(hc3)
assert abs(_b[1.qsmk]-3.2834969233) < .0001
