/*
PHEB 602 interactive workflow: input, preparation, summaries, Table 1,
ANOVA, linear regression and reproducible Stata code.

Stata 15.1 or newer. Official Stata commands only.
Put this DO file and acupuncture_source.dta in one working folder.
In Stata, change the working directory to that folder, then run:
    do workflow-analysis.do
For the separately named deliverable copy, run:
    do PHEB602_Interactive_Workflow.do

This script keeps all 401 participant records and never overwrites the source
DTA. It replaces only these generated outputs in the working folder:
  workflow-analysis.log
  Table1_reproduced.csv, Table1_primary_tests.csv, Table1_available_n.csv
  baseline_headache_histogram.png
  Workflow_regression_coefficients.csv, Workflow_regression_fit.csv
  Workflow_simple_fit.png, Workflow_simple_predicted_means.png
  Workflow_residuals_fitted.png, Workflow_residual_qq.png
  Workflow_leverage_residuals.png, Workflow_analysis_data.dta
Run in a separate folder if earlier generated outputs should be retained.

The Table 1 calculation/formatter body is reused verbatim from the interactive
Table 1 script. Source analyses were run in Stata 19.5 on 18/19 November 2026.
THIS ORDERED ADAPTATION HAS NOT BEEN EXECUTED DURING THE WEBSITE UPDATE.
Its code structure and source-method alignment were checked statically.
The website displays saved results and does not run a Stata engine.

Source lecture: PHEB602_Stata_Review_Table1_v7_115Slides.pptx.
Source analysis: PHEB602_Complete_Review_v7.do and TABLE1_TESTS_v7.do.
Trial: doi:10.1136/bmj.38029.421863.EB.
Data release: doi:10.1186/1745-6215-7-15.
*/
version 15.1
clear all
set more off
set level 95
set scheme s2color

* STEP 1. INPUT DATA: one raw source file, one record per participant.
capture log close workflow_web
log using "workflow-analysis.log", text replace name(workflow_web)
use "acupuncture_source.dta", clear
describe
assert _N == 401
assert c(k) == 94
isid id
list id group age pk1 pk2 pk5 in 1/8, noobs

* STEP 2. PROCESS INPUT DATA.
* 2a. Validate codes and measurement ranges without recoding the source.
assert inlist(group, 0, 1)
quietly count if group == 0
assert r(N) == 196
quietly count if group == 1
assert r(N) == 205
assert inlist(sex, 0, 1)
assert inlist(migraine, 0, 1)
assert inrange(age, 18, 65)
assert chronicity >= 0 & !missing(chronicity)
assert pk1 >= 0 & !missing(pk1)
assert inrange(gen1, 0, 100) if !missing(gen1)
assert inrange(ef1, 0, 100) if !missing(ef1)

* 2b. Apply the verified clinical crosswalk, retaining numeric codes.
label define wf_group 0 "Usual care" 1 "Acupuncture + usual care", replace
label values group wf_group
label define wf_sex 0 "Male" 1 "Female", replace
label values sex wf_sex
label define wf_diagnosis 0 "Tension-type" 1 "Migraine", replace
label values migraine wf_diagnosis
tabulate group, missing
tabulate sex, missing
tabulate migraine, missing

* 2c. Preserve missingness and retain raw frequency variables.
* Zero can be a valid score. Only the documented suspect frequency entries
* accompanying missing follow-up headache scores are changed in CLEAN COPIES.
misstable summarize pk1 pk2 pk5 gen1 ef1
count if missing(pk2) & f2 == 0
assert r(N) == 75
count if missing(pk5) & f5 == 0
assert r(N) == 100
clonevar f2_clean = f2
clonevar f5_clean = f5
replace f2_clean = . if missing(pk2) & f2 == 0
replace f5_clean = . if missing(pk5) & f5 == 0
label variable f2_clean "3-month frequency: suspected placeholder zeros set missing"
label variable f5_clean "12-month frequency: suspected placeholder zeros set missing"

* 2d. Define paired change and the fixed regression analysis sample.
generate double improve = pk1 - pk5 if !missing(pk1, pk5)
label variable improve "Baseline minus 12-month headache score: positive is improvement"
generate byte complete12 = !missing(pk5)
generate byte model_sample = !missing(pk5, pk1, group, age, chronicity)

* Teaching ANOVA age bands use the source cut points. Age remains continuous
* in the multiple-regression model; age-group comparisons are observational.
generate byte agegrp = .
replace agegrp = 1 if inrange(age,18,34)
replace agegrp = 2 if inrange(age,35,49)
replace agegrp = 3 if inrange(age,50,65)
label define wf_agegrp 1 "18-34" 2 "35-49" 3 "50-65", replace
label values agegrp wf_agegrp
label variable agegrp "Age groups for ANOVA; keep age continuous in multiple regression"
assert inlist(agegrp,1,2,3) if model_sample
count if !missing(pk1, pk2)
assert r(N) == 326
count if model_sample
assert r(N) == 301
count if model_sample & group == 0
assert r(N) == 140
count if model_sample & group == 1
assert r(N) == 161
tabulate group complete12, row

* STEP 3. DATA SUMMARY.
* 3a. Means and sample SD describe continuous variables and participant variation.
* Reporting mean/SD does not certify a normally distributed population.
summarize age chronicity gen1 ef1, detail
tabstat age chronicity gen1 ef1, by(group) ///
    statistics(n mean sd) columns(statistics)

* 3b. Baseline headache scores have a right tail; report median and quartiles.
* Quartile endpoints describe the middle 50%, not a confidence interval.
summarize pk1, detail
tabstat pk1, by(group) statistics(n p25 p50 p75) columns(statistics)

* 3c. Percentages use available observations within the randomized group.
* SF-36 summaries use 400 overall: 195 usual care and 205 acupuncture.
tabulate sex group, column
tabulate migraine group, column
misstable summarize gen1 ef1
tabstat gen1 ef1, by(group) statistics(n mean sd) columns(statistics)

* STEP 4. TABLE 1: unchanged denominator, test and formatter body.
* BEGIN REUSED TABLE 1 BODY.
* The group headers are randomized totals. Available n can differ by row.
tempfile denominators
tempname nh
postfile `nh' str16 variable int group available_n randomized_N ///
    using "`denominators'", replace
forvalues g = -1/1 {
    local condition "1"
    if `g' >= 0 local condition "group == `g'"
    quietly count if `condition'
    local total = r(N)
    foreach v in age sex migraine chronicity pk1 gen1 ef1 {
        quietly count if (`condition') & !missing(`v')
        post `nh' ("`v'") (`g') (r(N)) (`total')
    }
}
postclose `nh'
preserve
use "`denominators'", clear
label variable group "-1 overall; 0 usual care; 1 acupuncture"
list, noobs
export delimited using "Table1_available_n.csv", replace
restore

* 3. Examine shape. A reporting format is not evidence of normality.
histogram pk1, width(5) frequency ///
    xtitle("Baseline headache severity score") ///
    title("All randomized participants, baseline") ///
    name(table1_pk1_histogram, replace)
graph export "baseline_headache_histogram.png", width(1800) replace
histogram age, width(5) frequency by(group) name(table1_age, replace)
qnorm age if group == 0, name(table1_age_qq0, replace)
qnorm age if group == 1, name(table1_age_qq1, replace)
graph box pk1, over(group) name(table1_pk1_box, replace)

* 4. Reproduce the seven V7 primary comparisons.
* All P values are two-sided and unadjusted.
* a: unequal-variance two-sample t, Satterthwaite df.
* b: Wilcoxon rank-sum, tie-adjusted normal approximation.
* c: Pearson chi-square. Fisher is calculated as a companion, not selected.
* Migraine and tension-type are levels of one variable, so share one test.
tempfile primary_tests
tempname ph
postfile `ph' str20 variable str60 test_method str1 footnote ///
    double n_usual double n_acupuncture double statistic double df ///
    double p_value double p_fisher double minimum_expected ///
    using "`primary_tests'", replace

foreach v in age chronicity gen1 ef1 {
    ttest `v', by(group) unequal
    scalar T1web_p_`v' = r(p)
    post `ph' ("`v'") ("Unequal-variance t (Satterthwaite df)") ("a") ///
        (r(N_1)) (r(N_2)) (r(t)) (r(df_t)) (T1web_p_`v') (.) (.)
    return list
    display "Two-sided P for `v' = " %24.17g T1web_p_`v'
}

ranksum pk1, by(group)
* Stata 19.5 stores r(p), verified against the calculation below.
* Stata 15.1 compatibility: use its stored tie-adjusted z statistic.
scalar T1web_p_pk1 = 2*normal(-abs(r(z)))
post `ph' ("pk1") ("Wilcoxon rank-sum (tie-adjusted normal)") ("b") ///
    (r(N_1)) (r(N_2)) (r(z)) (.) (T1web_p_pk1) (.) (.)
return list
display "Two-sided P for pk1 = " %24.17g T1web_p_pk1

foreach v in sex migraine {
    tabulate `v' group, chi2 expected exact matcell(T1web_counts)
    scalar T1web_p_`v' = r(p)
    scalar T1web_fisher = r(p_exact)
    scalar T1web_chi2 = r(chi2)
    scalar T1web_df = (r(r)-1)*(r(c)-1)
    scalar T1web_N = r(N)
    return list
    assert rowsof(T1web_counts) == 2 & colsof(T1web_counts) == 2
    scalar T1web_n0 = T1web_counts[1,1] + T1web_counts[2,1]
    scalar T1web_n1 = T1web_counts[1,2] + T1web_counts[2,2]
    matrix T1web_expected = J(2,2,.)
    scalar T1web_minexp = .
    forvalues i = 1/2 {
        forvalues j = 1/2 {
            matrix T1web_expected[`i',`j'] = ///
                (T1web_counts[`i',1]+T1web_counts[`i',2]) * ///
                (T1web_counts[1,`j']+T1web_counts[2,`j']) / T1web_N
            scalar T1web_minexp = min(T1web_minexp,T1web_expected[`i',`j'])
        }
    }
    * Both verified V7 tables have all expected counts >=5.
    assert T1web_minexp >= 5 & !missing(T1web_minexp)
    matrix list T1web_expected
    display "Pearson two-sided P for `v' = " %24.17g T1web_p_`v'
    display "Companion Fisher two-sided P = " %24.17g T1web_fisher
    post `ph' ("`v'") ("Pearson chi-square") ("c") ///
        (T1web_n0) (T1web_n1) (T1web_chi2) (T1web_df) ///
        (T1web_p_`v') (T1web_fisher) (T1web_minexp)
}
postclose `ph'
preserve
use "`primary_tests'", clear
assert _N == 7
isid variable
assert inrange(p_value,0,1) & !missing(p_value)
generate byte row_order = .
replace row_order = 1 if variable == "age"
replace row_order = 2 if variable == "sex"
replace row_order = 3 if variable == "migraine"
replace row_order = 4 if variable == "chronicity"
replace row_order = 5 if variable == "pk1"
replace row_order = 6 if variable == "gen1"
replace row_order = 7 if variable == "ef1"
sort row_order
drop row_order
format n_usual n_acupuncture %12.0f
format statistic df p_value p_fisher minimum_expected %24.17g
list, noobs abbreviate(30)
export delimited using "Table1_primary_tests.csv", datafmt replace
restore

* 5. Build the 8-row Table 1 with overall summaries and P values.
* Means and sample SD: age, chronicity, gen1, ef1.
* Median and quartile endpoints: pk1. Number and observed-group %: categories.
* One decimal, explicit half-up rounding, matching the source formatter.
tempfile formatted_table
tempname th
postfile `th' str80 Characteristic str45 Overall_N401 ///
    str45 Usual_care_N196 str45 Acupuncture_N205 ///
    str12 P_value str1 Test_footnote ///
    using "`formatted_table'", replace

foreach key in age sex migraine tension chronicity pk1 gen1 ef1 {
    local variable "`key'"
    local kind "mean_sd"
    if "`key'" == "age" local rowlabel "Age, years, mean (SD)"
    if "`key'" == "chronicity" local rowlabel "Headache chronicity, years, mean (SD)"
    if "`key'" == "gen1" local rowlabel "SF-36 general health, mean (SD)"
    if "`key'" == "ef1" local rowlabel "SF-36 energy/fatigue, mean (SD)"
    if "`key'" == "pk1" {
        local rowlabel "Baseline headache score, median (Q1, Q3)"
        local kind "quartiles"
    }
    if inlist("`key'", "sex", "migraine", "tension") {
        local kind "category"
        local category = 1
        if "`key'" == "sex" local rowlabel "Female sex, n (%)"
        if "`key'" == "migraine" local rowlabel "Migraine diagnosis, n (%)"
        if "`key'" == "tension" {
            local rowlabel "Tension-type headache, n (%)"
            local variable "migraine"
            local category = 0
        }
    }
    forvalues g = -1/1 {
        local j = `g' + 2
        local condition "1"
        if `g' >= 0 local condition "group == `g'"
        if "`kind'" == "mean_sd" {
            quietly summarize `variable' if `condition'
            local m = strtrim(string(floor(10*r(mean)+.5)/10, "%9.1f"))
            local s = strtrim(string(floor(10*r(sd)+.5)/10, "%9.1f"))
            local cell`j' "`m' (`s')"
        }
        if "`kind'" == "quartiles" {
            quietly summarize `variable' if `condition', detail
            local m = strtrim(string(floor(10*r(p50)+.5)/10, "%9.1f"))
            local q1 = strtrim(string(floor(10*r(p25)+.5)/10, "%9.1f"))
            local q3 = strtrim(string(floor(10*r(p75)+.5)/10, "%9.1f"))
            local cell`j' "`m' (`q1', `q3')"
        }
        if "`kind'" == "category" {
            quietly count if (`condition') & !missing(`variable')
            local available = r(N)
            quietly count if (`condition') & `variable' == `category'
            local number = r(N)
            local k = strtrim(string(`number', "%9.0f"))
            local p = strtrim(string(floor(1000*`number'/`available'+.5)/10, "%9.1f"))
            local cell`j' "`k' (`p'%)"
        }
    }
    local pv ""
    local marker ""
    if "`key'" != "tension" {
        local pv = strtrim(string(T1web_p_`key', "%5.3f"))
        if T1web_p_`key' < .001 local pv "<0.001"
        local marker "a"
        if "`key'" == "pk1" local marker "b"
        if inlist("`key'", "sex", "migraine") local marker "c"
    }
    post `th' ("`rowlabel'") ("`cell1'") ("`cell2'") ("`cell3'") ///
        ("`pv'") ("`marker'")
}
postclose `th'
preserve
use "`formatted_table'", clear
assert _N == 8
list, noobs abbreviate(32)
export delimited using "Table1_reproduced.csv", replace
restore

* Required table footnote:
* SF-36 available observations: 400 overall, 195 usual care, 205 acupuncture.
* Higher headache scores indicate more symptoms. Higher SF-36 scores are better.
* a: unequal-variance two-sample t test, Satterthwaite degrees of freedom.
* b: Wilcoxon rank-sum test, tie-adjusted normal approximation.
* c: Pearson chi-square test. All P values are two-sided and unadjusted.
* Diagnosis is tested once; the tension-type row has a blank P value.
* Table1_primary_tests.csv preserves full-precision P values separately.

* END REUSED TABLE 1 BODY.

local WF_prefix "Workflow"
local WF_table_prefix "Workflow_regression"

* STEP 5. ANOVA AND LINEAR REGRESSION: the same 301 participants for all four models.
* Outcome pk5 is 12-month headache score; higher means greater symptoms.
* Regression 1.group is acupuncture minus usual care, the reverse of the
* usual-care-minus-acupuncture contrast printed by the Table 1 t tests.
count if model_sample
assert r(N) == 301

* One-way ANOVA: observational age-group means, not randomized treatment arms.
* H0: mean(pk5 | agegrp=1) = mean(pk5 | agegrp=2) = mean(pk5 | agegrp=3).
* Classical F inference assumes independent observations, normal within-group
* errors and a common variance. These assumptions are not certified by a P value.
anova pk5 i.agegrp if model_sample
assert e(N) == 301
* The same means are fitted by indicator OLS, with ages 18-34 as reference.
regress pk5 i.agegrp if model_sample
assert e(N) == 301
estimates store WORKFLOW_ANOVA
testparm i.agegrp

* Simple linear regression: baseline headache score as the only predictor.
regress pk5 c.pk1 if model_sample
assert e(N) == 301
estimates store WORKFLOW_SIMPLE

* Unadjusted comparison of observed follow-up means by randomized group.
regress pk5 i.group if model_sample
assert e(N) == 301
estimates store WORKFLOW_UNADJUSTED
lincom 1.group

* Multiple linear regression: age and duration remain continuous.
regress pk5 c.pk1 i.group c.age c.chronicity if model_sample
assert e(N) == 301
estimates store WORKFLOW_MULTI
lincom 1.group
lincom age
test age chronicity
estimates table WORKFLOW_ANOVA WORKFLOW_SIMPLE ///
    WORKFLOW_UNADJUSTED WORKFLOW_MULTI, ///
    b(%9.3f) se(%9.3f) stats(N r2 r2_a)
* R-squared = 1-SSE/SST for this observed sample with an intercept.
* It is distinct from adjusted R-squared and does not measure a percentage
* of participants, a causal contribution or prediction accuracy on new patients.

* Plot the simple relationship and the fitted-mean intervals.
* Fitted-mean confidence intervals are not individual prediction intervals.
twoway (scatter pk5 pk1 if model_sample, msize(vsmall)) ///
    (lfit pk5 pk1 if model_sample), ///
    xtitle("Baseline headache score") ytitle("12-month headache score") ///
    legend(order(1 "Participant" 2 "Fitted mean")) ///
    name(workflow_simple_fit, replace)
graph export "`WF_prefix'_simple_fit.png", width(1800) replace
estimates restore WORKFLOW_SIMPLE
margins, at(pk1=(10 25 50))
marginsplot, xtitle("Baseline headache score") ///
    ytitle("Fitted mean 12-month headache score") ///
    name(workflow_mean_predictions, replace)
graph export "`WF_prefix'_simple_predicted_means.png", width(1800) replace

* Diagnose the conventional multiple-regression model before robust fitting.
* E(error|predictors)=0 and independent participants support OLS interpretation.
* Exact classical t/F inference additionally assumes normal, constant-variance
* errors. A normality-test P alone is not a complete model assessment.
estimates restore WORKFLOW_MULTI
predict double workflow_fitted if e(sample), xb
predict double workflow_resid if e(sample), residuals
predict double workflow_leverage if e(sample), hat
predict double workflow_cook if e(sample), cooksd
rvfplot, yline(0) title("Residuals versus fitted mean") ///
    name(workflow_residual_plot, replace)
graph export "`WF_prefix'_residuals_fitted.png", width(1800) replace
qnorm workflow_resid, title("Normal Q-Q plot of model residuals") ///
    name(workflow_residual_qq, replace)
graph export "`WF_prefix'_residual_qq.png", width(1800) replace
swilk workflow_resid
estat hettest
estat ovtest
estat vif
lvr2plot, title("Leverage and normalized squared residuals") ///
    name(workflow_influence, replace)
graph export "`WF_prefix'_leverage_residuals.png", width(1800) replace

* Robust SEs change uncertainty, not the OLS mean equation or coefficients.
* They do not repair misspecified means, dependent records or dropout bias.
regress pk5 c.pk1 i.group c.age c.chronicity ///
    if model_sample, vce(robust)
assert e(N) == 301
estimates store WORKFLOW_MULTI_ROBUST
lincom 1.group
tabulate group complete12, row

* Export regression estimates in full precision. All numeric postfile fields
* are explicitly double. No outcome data are reloaded during model fitting,
* diagnostics, prediction, or collection of the stored coefficient estimates.
tempfile workflow_coefficients workflow_fit
tempname workflow_coefficient_handle workflow_fit_handle
postfile `workflow_coefficient_handle' str32 model str32 term ///
    double n double coefficient double std_error double t_statistic ///
    double df_r double p_value double ci_low double ci_high ///
    using "`workflow_coefficients'", replace
postfile `workflow_fit_handle' str32 model double n double r2 ///
    double adjusted_r2 double rmse double df_model double df_residual ///
    using "`workflow_fit'", replace

foreach fitted_model in WORKFLOW_ANOVA WORKFLOW_SIMPLE ///
    WORKFLOW_UNADJUSTED WORKFLOW_MULTI WORKFLOW_MULTI_ROBUST {
    estimates restore `fitted_model'
    local coefficient_names "_cons pk1"
    if "`fitted_model'" == "WORKFLOW_UNADJUSTED" ///
        local coefficient_names "_cons 1.group"
    if "`fitted_model'" == "WORKFLOW_ANOVA" ///
        local coefficient_names "_cons 2.agegrp 3.agegrp"
    if inlist("`fitted_model'", "WORKFLOW_MULTI", "WORKFLOW_MULTI_ROBUST") ///
        local coefficient_names "_cons pk1 1.group age chronicity"
    foreach term of local coefficient_names {
        scalar WF_b = _b[`term']
        scalar WF_se = _se[`term']
        scalar WF_t = WF_b / WF_se
        scalar WF_df = e(df_r)
        scalar WF_p = 2*ttail(WF_df, abs(WF_t))
        scalar WF_low = WF_b - invttail(WF_df,.025)*WF_se
        scalar WF_high = WF_b + invttail(WF_df,.025)*WF_se
        post `workflow_coefficient_handle' ("`fitted_model'") ("`term'") ///
            (e(N)) (WF_b) (WF_se) (WF_t) (WF_df) (WF_p) (WF_low) (WF_high)
    }
    post `workflow_fit_handle' ("`fitted_model'") (e(N)) (e(r2)) ///
        (e(r2_a)) (e(rmse)) (e(df_m)) (e(df_r))
}
postclose `workflow_coefficient_handle'
postclose `workflow_fit_handle'

* All regressions and postestimation have finished before these data swaps.
preserve
use "`workflow_coefficients'", clear
assert _N == 17
isid model term
assert n == 301
assert inrange(p_value,0,1) & !missing(p_value)
format n %12.0f
format coefficient std_error t_statistic df_r p_value ci_low ci_high %24.17g
export delimited using "`WF_table_prefix'_coefficients.csv", datafmt replace
restore
preserve
use "`workflow_fit'", clear
assert _N == 5
isid model
assert n == 301
format n df_model df_residual %12.0f
format r2 adjusted_r2 rmse %24.17g
export delimited using "`WF_table_prefix'_fit.csv", datafmt replace
restore

* Refit the conventional final model on the restored participant data so its
* active e(sample) is valid after the export-only dataset changes.
regress pk5 c.pk1 i.group c.age c.chronicity if model_sample
estimates store WORKFLOW_MULTI

* STEP 6. REPRODUCIBLE STATA CODE: retain the script, log and analysis state.
* This file is the executable counterpart of the website's Stata Code tab.
* Baseline summaries use available values; the regression outcome is observed
* for 301/401 participants. Full-cohort inference needs missing-data assumptions.
sort id
isid id
assert _N == 401
count if model_sample
assert r(N) == 301
save "Workflow_analysis_data.dta", replace
display "Workflow completed: 401 source participants, 301 regression observations."
log close workflow_web
