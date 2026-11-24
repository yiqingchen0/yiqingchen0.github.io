/*
PHEB 602 interactive ANOVA and linear-regression analysis.
Stata 15.1 or newer. Official Stata commands only.
Put this DO file and acupuncture_source.dta in the same working folder.
Run: do regression-analysis.do
The deliverable copy can be run as: do PHEB602_Regression_Analysis.do

ANOVA, simple, unadjusted and multiple regression use the SAME 301 complete observations of pk5,
pk1, randomized group, age and headache duration. Age remains continuous.
A fifth stored model uses robust SEs for the multiple-regression equation.

Generated outputs in the working folder are replaced:
  regression-analysis.log
  Regression_coefficients.csv, Regression_fit.csv
  Regression_simple_fit.png, Regression_simple_predicted_means.png
  Regression_residuals_fitted.png, Regression_residual_qq.png
  Regression_leverage_residuals.png, Regression_analysis_data.dta
No source dataset or Table 1 output is overwritten.

The original regression results were run in Stata 19.5 on 18 November 2026.
THIS ADAPTATION HAS NOT BEEN EXECUTED DURING THE WEBSITE UPDATE.
Structure and alignment with the v7 source methods were checked statically.
Trial: doi:10.1136/bmj.38029.421863.EB.
Data release: doi:10.1186/1745-6215-7-15.
*/
version 15.1
clear all
set more off
set level 95
set scheme s2color

* Load and validate the original participant records.
capture log close regression_web
log using "regression-analysis.log", text replace name(regression_web)
use "acupuncture_source.dta", clear
describe
assert _N == 401
assert c(k) == 94
isid id
list id group age pk1 pk2 pk5 in 1/8, noobs

assert inlist(group,0,1)
label define wf_group 0 "Usual care" 1 "Acupuncture + usual care", replace
label values group wf_group
generate double improve = pk1 - pk5 if !missing(pk1, pk5)
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
count if model_sample
assert r(N) == 301
count if model_sample & group == 0
assert r(N) == 140
count if model_sample & group == 1
assert r(N) == 161
local WF_prefix "Regression"
local WF_table_prefix "Regression"

* ANOVA AND LINEAR REGRESSION: the same 301 participants for all four models.
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

sort id
isid id
assert _N == 401
save "Regression_analysis_data.dta", replace
log close regression_web
