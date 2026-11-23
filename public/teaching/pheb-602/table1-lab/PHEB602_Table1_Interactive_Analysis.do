/*
Table 1: Demographic Table for Study Population
Acupuncture for chronic headache, all randomized participants at baseline.

Use Stata 15.1 or newer. Official Stata commands only.
Save this file and acupuncture_source.dta in the same folder.
In Stata, change the working directory to that folder, then run:
    do table1-analysis.do

Outputs in that folder: table1-analysis.log, Table1_reproduced.csv,
Table1_primary_tests.csv, Table1_available_n.csv, and
baseline_headache_histogram.png.
Existing files with those names are replaced.

Adapted from the PHEB602 v7 Table 1 workflow and verified primary tests.
The source tests were completed in Stata 19.5 on 19 November 2026.
This compact adaptation has been statically checked, not rerun in Stata.
The website does not run a Stata engine.

Sources:
Vickers et al. BMJ 2004;328:744. doi:10.1136/bmj.38029.421863.EB.
Vickers. Trials 2006;7:15. doi:10.1186/1745-6215-7-15.
CONSORT 2025, Item 25. doi:10.1136/bmj-2024-081124.
*/

version 15.1
clear all
set more off
set level 95
capture log close table1_web
log using "table1-analysis.log", text replace name(table1_web)
use "acupuncture_source.dta", clear

* 1. Validate participant records and randomized allocation.
isid id
assert _N == 401
assert inlist(group, 0, 1)
quietly count if group == 0
assert r(N) == 196
quietly count if group == 1
assert r(N) == 205
assert inlist(sex, 0, 1)
assert inlist(migraine, 0, 1)
assert inrange(age, 18, 65)
assert chronicity >= 0 & !missing(chronicity)
assert !missing(pk1)
assert inrange(gen1, 0, 100) if !missing(gen1)
assert inrange(ef1, 0, 100) if !missing(ef1)

* Clinical crosswalk corroborated in the original trial's completer table:
* sex=1 female, sex=0 male; migraine=1 migraine, migraine=0 tension-type.
* These baseline summaries use all randomized participants, not completers.
label define table1_group 0 "Usual care" 1 "Acupuncture + usual care", replace
label values group table1_group
tabulate group, missing
tabulate sex, missing nolabel
tabulate migraine, missing nolabel

* 2. Inspect the input and each variable's available observations.
describe
list id group age pk1 pk2 pk5 in 1/8, noobs
misstable summarize age sex migraine chronicity pk1 gen1 ef1 pk2 pk5
summarize age chronicity pk1 gen1 ef1, detail
tabstat age chronicity pk1 gen1 ef1, by(group) ///
    statistics(n mean sd p25 p50 p75) columns(statistics)
tabulate sex group, column
tabulate migraine group, column

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

log close table1_web
