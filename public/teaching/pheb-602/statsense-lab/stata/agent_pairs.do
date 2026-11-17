* All pairwise independent unequal-variance t tests, with optional Holm adjustment.
* Example: agent_pairs demo_score, by(demo_group_id) holm
capture program drop agent_pairs
program define agent_pairs
    version 15.1
    syntax varname(numeric) [if] [in], BY(varname) [HOLM]
    confirm numeric variable `by'
    marksample touse
    markout `touse' `by'
    quietly levelsof `by' if `touse', local(levels)
    local k : word count `levels'
    if `k' < 2 {
        display as error "At least two groups are required."
        exit 498
    }
    local comparisons = `k'*(`k'-1)/2
    local upper = `k'-1
    tempname results
    matrix `results' = J(`comparisons',4,.)
    matrix colnames `results' = group1 group2 difference p_raw
    local row = 0
    forvalues i = 1/`upper' {
        local first : word `i' of `levels'
        local start = `i'+1
        forvalues j = `start'/`k' {
            local second : word `j' of `levels'
            quietly ttest `varlist' if `touse' & ///
                inlist(`by',`first',`second'), by(`by') unequal
            local row = `row'+1
            matrix `results'[`row',1] = `first'
            matrix `results'[`row',2] = `second'
            matrix `results'[`row',3] = r(mu_1)-r(mu_2)
            matrix `results'[`row',4] = r(p)
        }
    }
    preserve
    clear
    quietly svmat double `results', names(col)
    generate original_order = _n
    if "`holm'" != "" {
        sort p_raw original_order
        generate double p_holm = min(1,(`comparisons'-_n+1)*p_raw)
        if `comparisons' > 1 {
            replace p_holm = max(p_holm,p_holm[_n-1]) in 2/`comparisons'
        }
        sort original_order
        format difference %10.6f
        format p_raw p_holm %12.7g
        list group1 group2 difference p_raw p_holm, noobs clean
    }
    else {
        format difference %10.6f
        format p_raw %12.7g
        list group1 group2 difference p_raw, noobs clean
    }
    restore
end
