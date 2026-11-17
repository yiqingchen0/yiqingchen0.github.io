* Bundled Stata implementation of the Welch one-way ANOVA.
* Uses group summary statistics; no external package is required.
* After running this file: agent_welch outcome, by(numeric_group)
capture program drop agent_welch
program define agent_welch, rclass
    version 15.1
    syntax varname(numeric) [if] [in], BY(varname)
    confirm numeric variable `by'
    marksample touse
    markout `touse' `by'
    tempvar n m s w wm ai bi
    tempname W M A B FF DF1 DF2 PP
    preserve
    quietly keep if `touse'
    quietly collapse (count) `n'=`varlist' (mean) `m'=`varlist' ///
        (sd) `s'=`varlist', by(`by')
    local k = _N
    if `k' < 2 {
        restore
        display as error "At least two groups are required."
        exit 498
    }
    quietly count if `n' <= 1 | missing(`s') | `s' <= 0
    if r(N) > 0 {
        restore
        display as error "Each group needs n>1 and a positive sample variance."
        exit 498
    }
    quietly generate double `w' = `n'/(`s'^2)
    quietly summarize `w', meanonly
    scalar `W' = r(sum)
    quietly generate double `wm' = `w'*`m'
    quietly summarize `wm', meanonly
    scalar `M' = r(sum)/`W'
    quietly generate double `ai' = `w'*(`m'-`M')^2
    quietly summarize `ai', meanonly
    scalar `A' = r(sum)/(`k'-1)
    quietly generate double `bi' = (1-`w'/`W')^2/(`n'-1)
    quietly summarize `bi', meanonly
    scalar `B' = r(sum)
    scalar `DF1' = `k'-1
    scalar `DF2' = (`k'^2-1)/(3*`B')
    scalar `FF' = `A'/(1+2*(`k'-2)*`B'/(`k'^2-1))
    scalar `PP' = Ftail(`DF1',`DF2',`FF')
    restore
    display as text "Welch one-way ANOVA"
    display as text "F = " as result %12.6f `FF' ///
        as text "  df1 = " as result %9.3f `DF1' ///
        as text "  df2 = " as result %12.6f `DF2'
    display as text "p = " as result %12.8g `PP'
    return scalar F = `FF'
    return scalar df1 = `DF1'
    return scalar df2 = `DF2'
    return scalar p = `PP'
end
