/* Curated conversational simulator. All numerical outputs come from build_data.py.
 * Teaching errors are deliberate; hidden keys are for debriefing, not exam security.
 */
(() => {
'use strict';
const D=globalThis.LAB_DATA;
const STAGES=[
 {id:'raw',en:'Read the raw data',zh:'读取原始数据'},
 {id:'visual',en:'Explore the distributions',zh:'探索分布与可视化'},
 {id:'table1',en:'Summarize · Table 1',zh:'总结数据 · Table 1'},
 {id:'tests',en:'Choose hypothesis tests',zh:'选择假设检验'},
 {id:'anova',en:'Compare three groups · ANOVA',zh:'三组比较 · ANOVA'},
 {id:'regression',en:'Fit and diagnose a regression',zh:'拟合与诊断线性回归'}
];
const fmt=(x,n=3)=>Number(x).toFixed(n);
const stataTerm=t=>t==='Intercept'?'_cons':t==='qsmk'?'1.qsmk':t.replace(/^C\((\w+)\)\[T\.(.+)\]$/,'$2.$1');
const p=x=>x<.001?'< 0.001':fmt(x);
function random(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function profile(seed,mode='mixed'){
 const r=random(seed),flags={},all=STAGES.flatMap(s=>[1,2,3,4].map(i=>s.id+'.'+i));
 all.forEach(k=>flags[k]=false);
 if(mode==='sound')return{seed,mode,flags};
 if(mode==='demo'){['raw.2','visual.3','table1.1','tests.3','anova.1','anova.2','regression.2'].forEach(k=>flags[k]=true);return{seed,mode,flags};}
 const cleanStage=STAGES[Math.floor(r()*STAGES.length)].id;
 const counts={};let n=0;
 while(n<7){let k=all[Math.floor(r()*all.length)],s=k.split('.')[0];if(s!==cleanStage&&!flags[k]&&(counts[s]||0)<2){flags[k]=true;counts[s]=(counts[s]||0)+1;n++;}}
 return{seed,mode,flags};
}
function response(stage,prof,lang='en',focus='full'){
 lang='en';
 const z=false,L=(en,zh)=>en,flags=prof.flags;
 const bad=n=>!!flags[stage+'.'+n];
 const units=[];
 const u=(i,title,good,wrong,explain,status='incorrect')=>{
  const x={id:stage+'.'+i,stage,title,body:bad(i)?wrong:good,truth:bad(i)?status:'supported',correct:good,explanation:explain};units.push(x);return x;
 };
 let intro='',tables=[],figures=[],closing='',code='',codeLanguage='stata';
 const group=D.tests.welch;
 if(stage==='raw'){
  intro=L('I’ll start by checking the rows, variable definitions, missingness, and the question we want the data to answer. The working file is NHEFS plus six clearly labeled teaching variables.','我先检查数据行数、变量定义、缺失情况，以及希望回答的问题。工作文件由 NHEFS 原始数据和 6 个明确标记的教学变量组成。');
  tables=[{title:L('Dataset audit','数据检查'),headers:[L('Item','项目'),L('Value','结果')],rows:[[L('Original / augmented columns','原始 / 扩展后变量数'),'64 / 70'],[L('Original participants','原始记录数'),'1,629'],[L('Missing weight-change outcomes','体重变化结局缺失'),'63'],[L('Working analysis sample','当前分析样本'),'1,566'],[L('Quitters / continuing smokers','戒烟 / 继续吸烟'),'403 / 1,163']]}];
  u(1,L('Identify the variables','识别变量类型'),L('The outcome wt82_71 is continuous. qsmk is a binary grouping variable; exercise and education are categorical, even though their stored values are numbers.','结局 wt82_71 是连续变量，qsmk 是二分类分组变量。exercise 和 education 虽然存为数字，仍是分类变量。'),L('Since exercise and education are numeric columns, their codes can automatically be treated as equally spaced continuous measurements.','exercise 和 education 是数字列，所以它们的编码可以直接视为等间距的连续测量值。'),L('Storage type does not establish measurement scale. Treat categories as factors unless a defensible numerical trend assumption is explicitly chosen.','存储类型不能决定测量尺度；若未明确论证数值趋势假设，应按分类变量处理。'));
  u(2,L('Define the analysis sample','定义分析样本'),L('I exclude the 63 missing outcome values for this complete-case illustration and retain 1,566 people. I should still examine whether missingness differs by group; complete-case selection can bias the comparison.','此示例排除 63 个结局缺失值，保留 1,566 人。仍需检查缺失是否与分组等因素有关，因为完整病例选择可能造成偏倚。'),L('Only 3.9% of outcomes are missing, so deleting those rows is guaranteed to be unbiased; no missingness check is needed.','结局仅缺失约 3.9%，因此删除这些记录一定不会产生偏倚，也无需再检查缺失机制。'),L('A small missing percentage does not establish that complete-case analysis is unbiased. Missing outcomes occur in 25/428 quitters and 38/1,201 continuing smokers.','缺失比例小不能保证完整病例分析无偏；戒烟组缺失为 25/428，继续吸烟组为 38/1,201。'));
  u(3,L('Separate observed and simulated data','区分真实与模拟数据'),L('Every demo_* column was generated with seed 602. These columns illustrate distributions and diagnostic problems; they are not measurements collected in NHEFS.','所有 demo_* 列均用种子 602 生成，用于演示分布与诊断问题，并非 NHEFS 实际测量值。'),L('The demo_* columns are additional clinical measurements collected in the original NHEFS survey.','demo_* 列是 NHEFS 原始调查中额外采集的临床测量值。'),L('The codebook and build script explicitly identify all six demo_* columns as synthetic. They support methodological demonstrations, not real clinical findings.','数据字典与生成脚本明确标出这 6 个变量为模拟变量，只用于方法教学。'));
  u(4,L('Set the direction of the outcome','规定结局方向'),L('Weight change is follow-up minus baseline weight. A positive value means weight gain; a negative value means weight loss.','体重变化定义为随访体重减去基线体重：正值表示增重，负值表示减重。'),L('Weight change is follow-up minus baseline, so positive values represent weight loss.','体重变化是随访减去基线，因此正值表示减重。'),L('The sign is reversed in that interpretation: follow-up minus baseline is positive when follow-up weight is higher.','该解释把符号颠倒了：随访体重较高时，“随访减基线”为正。'));
  closing=L('Next I would inspect the distributions before choosing summaries or tests. You can open the attached file to inspect the raw values.','下一步先看分布，再选择描述方式和检验。你也可以打开附带的数据文件，查看原始数值。');
 }
 if(stage==='visual'){
  intro=L('Here are the actual plots from the working data. I would use their shape and spread to decide how to summarize each variable, and to identify questions that need checking.','下面是根据工作数据实际绘制的图。我会根据形状与离散程度选择描述方式，并找出需要进一步检查的问题。');
  figures=['distributions','nhefs-exploration','collinearity'];
  u(1,L('Read the skewed distribution','观察偏态分布'),L('The simulated biomarker has a long right tail. Median and IQR provide a useful resistant summary; a log-scale plot may also help show its structure.','模拟生物标志物有明显长右尾，可用中位数和四分位距作稳健描述，也可用对数尺度辅助观察。'),L('The biomarker is approximately normal because n exceeds 30; the visible right tail can be ignored.','生物标志物的样本量超过 30，所以它已经近似正态，可以忽略图中的右尾。'),L('The CLT concerns a sampling distribution of means, not the distribution of individual measurements. A large n does not remove raw-data skewness.','中心极限定理讨论均值的抽样分布，不会把个体原始数据变成正态。'));
  u(2,L('Recognize a count','识别计数变量'),L('demo_visits is a nonnegative integer count, generated from Poisson(2.5). Its bars are discrete; I would not describe the observed count as a continuous normal measurement.','demo_visits 是由 Poisson(2.5) 生成的非负整数计数，柱形是离散的，不能因为用了直方图就把它当连续正态测量值。'),L('A histogram makes demo_visits continuous, so a normal measurement model is automatically justified.','既然 demo_visits 画成了直方图，它就是连续变量，因而可以自动使用正态测量模型。'),L('A plotting choice does not change a variable’s support. Counts remain integers; the generating distribution is known here only because this column is simulated.','绘图方式不会改变变量取值范围。计数仍是整数；此处因生成机制已知，才知道其 Poisson 模型。'));
  u(3,L('Connect shape to model assumptions','联系分布与模型假设'),L('Linear regression does not require each covariate to be normally distributed. I should later examine the conditional mean specification, residuals, variance, and independence.','线性回归并不要求每个协变量服从正态。之后应检查条件均值形式、残差、方差与独立性等。'),L('Every regression covariate must be normal. Because the biomarker and visits are skewed, linear regression is invalid unless all predictors are normalised.','线性回归要求所有协变量正态，因此生物标志物和就诊次数偏态，说明必须把所有预测变量正态化才能回归。'),L('Predictor normality is not an OLS assumption. Transformation should follow the scientific relationship and diagnostics, not a universal normality rule for X.','OLS 没有“所有 X 正态”的要求；变换应服务于关系形式和诊断，而不是套用 X 必须正态的规则。'));
  u(4,L('Handle unusual observations','处理异常观测'),L('The weight-change boxplot shows extreme values. I would verify their definitions and assess their influence, rather than automatically deleting them.','体重变化箱线图有极端值，应核查定义并评估影响，不能自动删除。'),L('Every point outside the boxplot whiskers is a recording error and should be removed before analysis.','箱线图须外的所有点都是录入错误，应在分析前全部删除。'),L('A boxplot rule identifies unusual observations, not proven errors. Deletion requires a defensible data-quality reason and transparent sensitivity analysis.','箱线图规则只标出不寻常值，不能证明录入错误；删除需有依据并透明报告敏感性分析。'));
  closing=L('The plots suggest different summaries for different covariates. I can now build Table 1 by smoking-cessation group.','这些图提示不同变量应采用不同的描述方式。接下来可按戒烟状态生成 Table 1。');
 }
 if(stage==='table1'){
  intro=L('I’ll summarize baseline characteristics by cessation group. The analysis sample has 1,163 continuing smokers and 403 quitters. Simulated columns are labeled; the outcome itself is not a baseline covariate.','我按戒烟状态描述基线特征：继续吸烟 1,163 人，戒烟 403 人。模拟变量会单独标记；随访体重变化结局不列作基线协变量。');
  const rows=[];
  const cell=(v,g)=>{const s=v.groups[g];if(v.style==='mean')return `${fmt(s.mean,1)} (${fmt(v.variable==='age'&&bad(1)?s.se:s.sd,1)})${v.variable==='cholesterol'?`; n=${s.n}`:''}`;if(v.variable==='demo_biomarker'&&bad(2))return`${fmt(s.mean,1)} (${fmt(s.sd,1)})`;return`${fmt(s.median,1)} [${fmt(s.q1,1)}, ${fmt(s.q3,1)}]`;};
  for(const v of D.table1){const mark=v.origin==='SIMULATED'?' [SIM]':'';if(v.style==='categorical'){for(const lev of v.levels){rows.push([v.label+mark+' · '+lev.level,...['0','1'].map(g=>`${lev.groups[g].n} (${fmt(bad(3)?100*lev.groups[g].n/D.info.analyzed:lev.groups[g].percent,1)}%)`)]);}}else rows.push([v.label+mark,cell(v,'0'),cell(v,'1')]);}
  tables=[{title:L('Table 1. Baseline characteristics','Table 1. 基线特征'),headers:[L('Characteristic','特征'),L('Continuing (n=1,163)','继续吸烟 (n=1,163)'),L('Quitters (n=403)','戒烟 (n=403)')],rows,note:L('Continuous summaries are mean (SD) or median [Q1, Q3]; categorical summaries are n (column %). Cholesterol uses variable-specific available n. [SIM] = generated teaching covariate.','连续变量为均值（SD）或中位数 [Q1, Q3]，分类变量为人数（列百分比）。胆固醇报告该变量可用 n。[SIM] 表示生成的教学变量。')}];
  u(1,L('Describe variability','描述个体间变异'),L('The age row reports mean and sample SD. SD describes variability between people; SE would instead describe precision of the mean.','年龄行报告均值与样本 SD；SD 描述个体差异，SE 描述均值估计的精度。'),L('I used mean and SE in the age row but labeled the parentheses as SD, because SD and SE are interchangeable in a large sample.','年龄行我使用均值和 SE，但将括号标为 SD，因为大样本中 SD 和 SE 可以互换。'),L('SD and SE are not interchangeable: SE = SD/√n for independent sampling. The displayed age parentheses need the sample SD, not SE.','SD 与 SE 不能互换。独立抽样时 SE=SD/√n；年龄行括号应为样本 SD。'));
  u(2,L('Summarize the right tail','总结长右尾'),L('The skewed simulated biomarker is shown as median [Q1, Q3], consistent with its long right tail in the histogram.','偏态模拟标志物用中位数 [Q1, Q3]，与直方图中的长右尾一致。'),L('The simulated biomarker’s large sample guarantees a symmetric distribution, so its mean (SD) proves that the raw values are approximately normal.','模拟标志物样本量很大，保证其分布对称，因此均值（SD）可以证明原始值近似正态。'),L('Mean/SD can be computed for skewed data but do not establish normality or symmetry. The rationale is false; median/IQR is a useful resistant alternative.','偏态数据也可计算均值/SD，但它们不能证明正态或对称；此处错误在推理。中位数/IQR 是有用的稳健描述。'));
  u(3,L('Choose percentage denominators','选择百分比分母'),L('For each categorical level, column percentages use the observed total in that cessation group. The percentages across its levels sum to 100% within each column.','分类变量各水平的列百分比以该戒烟组有效人数为分母；每列该变量各水平比例之和为 100%。'),L('I divided every category count by the full analysis n=1,566 and still labeled the results as within-group column percentages.','我把所有类别人数都除以总样本 1,566，但仍将结果标为组内列百分比。'),L('That denominator produces percentages of the entire sample, not within-group percentages. Use 1,163 and 403 here when the variable has no missing values.','该分母得到的是占总样本比例，不是组内比例；此处无缺失变量的组内分母应为 1,163 和 403。'));
  u(4,L('Use Table 1 appropriately','正确使用 Table 1'),L('Table 1 describes the sample; its p-values, if requested, are exploratory comparisons. They do not by themselves identify confounders or validate the sampling design.','Table 1 用于描述样本；若附 p 值，也只是探索性比较，不能据此单独判定混杂因素或验证抽样设计。'),L('Any baseline variable with p>0.05 cannot be a confounder, so I will remove all such variables from the adjusted regression.','基线变量只要 p>0.05 就不可能混杂，因此回归应删除所有此类变量。'),L('Confounder selection requires subject-matter and causal reasoning. A non-significant univariate comparison does not rule out confounding.','混杂因素选择需结合领域知识和因果结构；单变量比较不显著不能排除混杂。'));
  closing=L('We can now match specific scientific questions to appropriate tests. There is no single test that fits all the covariates.','接下来把具体研究问题与合适的检验对应起来，不能对所有协变量套用同一种检验。');
 }
 if(stage==='tests'){
  intro=L('I’ll separate comparisons between different people from changes within the same people. I also need to check the cell counts before using an asymptotic categorical test.','我会区分不同人之间的组间比较与同一人的前后变化，并在分类变量检验前检查期望频数。');
  const between=bad(1)?D.tests.paired:D.tests.welch,within=bad(2)?D.tests.independentWeights:D.tests.paired;
  tables=[{title:L('Question-specific tests','按研究问题选择检验'),headers:[L('Question','问题'),L('Test used','采用的检验'),'p'],rows:[
   [L('Weight change: quitters vs continuing','体重变化：戒烟 vs 继续吸烟'),bad(1)?L('Paired t, baseline vs follow-up','配对 t：基线 vs 随访'):L('Welch independent t','Welch 独立样本 t'),p(between.p)],
   [L('Within-person weight change vs zero','同一人体重前后变化是否为零'),bad(2)?L('Independent t on the two visits','将两次测量作独立 t'):L('Paired t','配对 t'),p(within.p)],
   [L('Rare heart-failure history vs cessation','罕见心衰史 vs 戒烟'),bad(3)?L('Pearson chi-square','Pearson 卡方'):L('Fisher exact, two-sided','Fisher 双侧精确检验'),p(bad(3)?D.tests.rare.pearsonP:D.tests.rare.fisherP)],
   [L('Skewed simulated marker by cessation','偏态模拟标志物的组间分布'),L('Mann–Whitney U','Mann–Whitney U'),p(D.tests.rank.p)],
   [L('Sex code vs cessation','性别编码 vs 戒烟'),L('Pearson chi-square','Pearson 卡方'),p(D.tests.sex.p)]
  ],note:L('Each displayed statistic is computed from the local data. Check whether the method answers the question and whether its assumptions are justified.','数值均由本地数据计算；请检查所用方法是否回答该问题，及其假设是否有依据。')}];
  u(1,L('Compare cessation groups','比较戒烟分组'),L(`Quitters and continuing smokers are different people. A Welch test compares their mean change scores: difference ${fmt(group.difference)} kg; 95% CI [${fmt(group.ci[0])}, ${fmt(group.ci[1])}] kg.`,`戒烟与继续吸烟是不同的人，应用 Welch 检验比较变化值均数：差值 ${fmt(group.difference)} kg，95% CI [${fmt(group.ci[0])}, ${fmt(group.ci[1])}] kg。`),L('Because each person was weighed twice, the quitter-versus-continuing question must use the paired baseline/follow-up t test shown above.','每人称重两次，因此戒烟组与继续吸烟组的比较必须使用上面的基线/随访配对 t 检验。'),L('Repeated measurements create a within-person change score. Comparing those scores between cessation groups is an independent-groups question; the paired test answers a different question.','重复测量用于构造每人的变化值；比较两组不同人的变化值属于独立组问题。配对检验回答的是另一个问题。'));
  u(2,L('Respect repeated measurements','尊重重复测量结构'),L('To test whether mean within-person weight change is zero, use a paired t test, equivalently a one-sample t test of the differences. There are 1,566 differences and 1,565 df.','检验同一人的平均前后变化是否为零，应作配对 t 检验，等价于对差值作单样本 t 检验：1,566 个差值、1,565 个自由度。'),L('The baseline and follow-up weights can be treated as two independent samples because the sample size is large.','样本量较大，因此可以把同一人的基线和随访体重视为两个独立样本。'),L('Increasing n does not remove within-person dependence. The variance of a paired difference includes the covariance of the two measurements.','样本量增大不会消除同一人的两次测量之间的依赖；配对差值方差包含二者协方差。'));
  u(3,L('Check sparse expected counts','检查稀疏期望频数'),L(`The smallest expected heart-failure cell count is ${fmt(D.tests.rare.minExpected)}. Fisher’s exact test avoids relying on a large-sample chi-square approximation for this sparse 2×2 table.`,`心衰史表的最小期望频数为 ${fmt(D.tests.rare.minExpected)}；对此稀疏 2×2 表，采用 Fisher 精确检验可避免依赖大样本卡方近似。`),L('The total sample is 1,566, so all expected counts must exceed five. I can use Pearson’s chi-square test without inspecting the table.','总样本有 1,566 人，因此所有期望频数必定超过 5，无需查看列联表就可使用 Pearson 卡方检验。'),L('A large total does not guarantee adequate expected cell counts. The smallest expected count is about 2.06; inspect the table and consider an exact test.','总样本大不保证每个格子的期望频数足够；此表最小值约为 2.06，需检查格子并考虑精确检验。'));
  u(4,L('Interpret the rank-test p-value','解释秩检验 p 值'),L('Mann–Whitney compares ranks/distributions under its null, not means. Its p-value is conditional on the null model, not the probability that the null hypothesis is true.','Mann–Whitney 在其原假设下比较秩/分布，不是比较均值；p 值是以原假设模型为条件的概率，不是原假设为真的概率。'),L(`The Mann–Whitney p-value of ${p(D.tests.rank.p)} is the probability that the two population distributions are identical.`,`Mann–Whitney 的 p 值 ${p(D.tests.rank.p)} 就是两个总体分布完全相同的概率。`),L('A p-value is not P(H0 is true). A median-only interpretation of a rank test also requires additional shape/shift assumptions.','p 值不是 P(H0 为真)；把秩检验仅解释为中位数检验还需要额外的形状/位移假设。'));
  closing=L('For three groups, I would move to an omnibus comparison and consider variance assumptions before interpreting any pairwise differences.','对于三组，应先做整体比较，并在解释两两差异前检查方差等假设。');
 }
 if(stage==='anova'){
  const w=bad(1)?D.anova.classical:D.anova.welch;
  intro=L('For ANOVA, I’ll use the synthetic score across synthetic groups A, B and C. These are generated examples, not clinical NHEFS outcomes. Their plots help us assess group spread before choosing the test.','ANOVA 使用模拟组 A、B、C 的模拟得分。这是生成的教学例子，不是 NHEFS 的真实临床结局。先从图中检查各组离散程度，再选检验。');
  figures=['anova-groups'];
  tables=[{title:L('Group summaries [SIMULATED]','分组描述 [模拟数据]'),headers:[L('Group','组'),'n',L('Mean','均值'),'SD'],rows:Object.entries(D.anova.groups).map(([k,v])=>[k,v.n,fmt(v.mean),fmt(v.sd)])},{title:bad(1)?L('Conventional one-way ANOVA','普通单因素 ANOVA'):L('Welch one-way ANOVA','Welch 单因素 ANOVA'),headers:['F','df1','df2','p'],rows:[[fmt(w.F),fmt(w.df1),fmt(w.df2),p(w.p)]],note:L(`Median-centered Levene: F=${fmt(D.anova.levene.F)}, p ${p(D.anova.levene.p)}.`,`以中位数为中心的 Levene 检验：F=${fmt(D.anova.levene.F)}，p ${p(D.anova.levene.p)}。`)},{title:L('Pairwise Welch comparisons','两两 Welch 比较'),headers:[L('Pair','组对'),L('Difference','均数差'),bad(3)?L('Unadjusted p','未调整 p'):L('Holm-adjusted p','Holm 调整后 p')],rows:D.anova.pairs.map(x=>[x.pair,fmt(x.difference),p(bad(3)?x.p:x.holm_p)])}];
  u(1,L('Choose the variance model','选择方差模型'),L('The group SDs differ substantially, and the Levene result is inconsistent with equal variances. I use Welch ANOVA rather than assuming homogeneity. The groups are independent by the simulation design.','各组 SD 差别明显，Levene 结果不支持方差齐性，因此采用 Welch ANOVA。模拟设计中的各组彼此独立。'),L('All groups have more than 30 people, which guarantees equal variances. I use conventional ANOVA and omit the variance check.','各组人数都超过 30，这就保证了方差相等。因此采用普通 ANOVA，并省略方差检查。'),L('Large n does not imply equal variances. Observed SDs are about 3.00, 6.19 and 10.33; the group plots and Levene test support an unequal-variance approach.','大样本不能保证方差相等；此处 SD 约为 3.00、6.19、10.33，图和 Levene 检验均提示应考虑不等方差。'));
  u(2,L('Interpret the omnibus result','解释整体检验'),L('The overall result supports at least one difference in population means. It does not tell us that every pair differs; A–B is not significant in the follow-up comparison.','整体结果支持至少一组总体均数不同，不能说明每一对都不同；后续比较中 A–B 不显著。'),L('The significant overall ANOVA proves that all three pairs differ significantly, including A–B.','整体 ANOVA 显著，证明三对比较都显著，包括 A–B。'),L('The omnibus alternative is “not all means equal.” Here the actual A–B p is about 0.456, so the all-pairs conclusion is false.','整体备择是假定“并非所有均数相等”。此处 A–B 的实际 p 约为 0.456，“所有组对都显著”的结论错误。'));
  u(3,L('Account for multiplicity','考虑多重比较'),L('I apply Holm correction to the three pairwise Welch tests. This addresses familywise Type I error for the specified family of pairwise questions.','对三次两两 Welch 检验使用 Holm 校正，以控制这一组比较的家族错误率。'),L('Using three unadjusted tests at 0.05 keeps the familywise Type I error rate at exactly 0.05, so no multiplicity correction is needed.','三个未校正检验各用 0.05，家族第一类错误率就恰好仍是 0.05，所以不需多重比较校正。'),L('Repeated unadjusted tests do not generally control familywise error at the per-test level. Prespecify the family and use an appropriate correction.','重复做未校正检验通常不能把家族错误率控制在单次检验水平；应明确比较集合并采用合适校正。'));
  u(4,L('Explain what the p-value says','解释 p 值说明了什么'),L('A small ANOVA p-value concerns compatibility with the equal-means null under the test assumptions. It is not the probability that the null is true, and statistical significance does not alone establish practical importance.','小的 ANOVA p 值反映在检验假设下数据与等均数原假设的相容性；它不是原假设为真的概率，也不单独代表实际重要性。'),L('The ANOVA p-value is the probability that all group means are equal; because it is tiny, the probability of the null being true is nearly zero.','ANOVA 的 p 值就是所有组均数相等的概率；它很小，所以原假设为真的概率几乎是零。'),L('The probability is conditional on the null/model and concerns a test statistic at least as extreme, not a posterior probability of the null.','该概率以原假设和模型为条件，讨论至少同样极端的统计量，而不是原假设的后验概率。'));
  closing=L('Next I can model NHEFS weight change with several covariates, then check the regression rather than stopping at the coefficient table.','接下来可对 NHEFS 体重变化进行多变量回归，并检查模型，不能只看系数表。');
 }
 if(stage==='regression'){
  const key=`${bad(1)?'numeric':'factor'}_${bad(3)?'copy':'clean'}_${bad(2)?'ols':'hc3'}`,m=D.regression[key],q=m.coefficients.find(x=>x.term==='qsmk');
  intro=L('I’ll model observed NHEFS weight change using cessation, age, baseline weight, smoking intensity, sex, exercise and education. I also inspect the synthetic age copy as a deliberately redundant candidate predictor.','我用戒烟、年龄、基线体重、吸烟量、性别、锻炼和教育程度解释 NHEFS 中观察到的体重变化，并检查作为候选变量的模拟年龄近似副本。');
  tables=[{title:L('Linear regression output','线性回归输出'),headers:[L('Term','变量'),'β','SE','95% CI','p'],rows:m.coefficients.map(v=>[stataTerm(v.term),fmt(v.beta),fmt(v.se),`[${fmt(v.low)}, ${fmt(v.high)}]`,p(v.p)]),note:`n=${m.nobs}; R²=${fmt(m.r2)}; ${m.covariance}. ${L('Outcome: weight change in kg.','结局：体重变化（kg）。')}`},{title:L('Diagnostic checks for the candidate model','候选模型的诊断信息'),headers:[L('Check','检查'),L('Result','结果')],rows:[[L('Breusch–Pagan (reference model)','Breusch–Pagan（参考模型）'),`p ${p(D.diagnostics.bpP)}`],[L('Age / age-copy correlation','年龄 / 年龄副本相关系数'),fmt(D.diagnostics.ageCopyCorrelation,5)],[L('Age-copy VIF (age + copy + cessation)','年龄副本 VIF（年龄 + 副本 + 戒烟）'),fmt(D.diagnostics.vif.demo_age_copy,1)],[L('Reference model cases with Cook >4/n','参考模型 Cook >4/n 的记录数'),D.diagnostics.cooksAbove4n]]}];
  figures=['regression-diagnostics'];
  u(1,L('Code categorical predictors deliberately','有意识地编码分类预测变量'),L('Education and exercise enter as categorical factors. A one-unit linear trend across education codes would impose an additional spacing/linearity assumption that needs justification.','教育与锻炼按分类因子进入模型；把教育编码按每增加 1 单位解释，会额外施加间距和线性趋势假设，需要论证。'),L('I enter education as one continuous numeric term because the category codes 1–5 necessarily represent equally spaced educational effects.','教育编码为 1–5，必然代表等间距的教育效应，因此应作为单个连续项进入模型。'),L('A numeric storage code does not justify equal effect increments across categories. The table shown used a numeric term; a factor-coded alternative is needed unless a trend model was prespecified and defended.','数字编码不能证明各水平效应等间距；当前表用了单个数值项，若没有预先论证趋势模型，应考虑分类因子编码。'));
  u(2,L('Check residual variance and inference','检查残差方差与推断'),L('The residual plots and Breusch–Pagan result raise variance concerns. I report HC3 robust standard errors; these address heteroscedasticity-related inference, not confounding, nonlinearity or influential errors automatically.','残差图与 Breusch–Pagan 检验提示方差问题，因此报告 HC3 稳健标准误。它改善异方差下的推断，但不会自动解决混杂、非线性或有影响的错误观测。'),L('With n=1,566, residual variance must be constant. I skip residual diagnostics and report conventional OLS standard errors as guaranteed valid.','n=1,566 足够大，残差方差必然恒定。因此省略残差诊断，普通 OLS 标准误必定有效。'),L('Sample size does not guarantee constant variance. The displayed BP p is very small; conventional SE need justification. Use robust inference when appropriate and still examine specification/influence.','样本量不保证方差恒定；此处 BP p 很小，普通标准误需要依据。可考虑稳健推断，但仍需检查模型形式与影响点。'));
  u(3,L('Check redundant covariates','检查冗余协变量'),L('The synthetic age copy is almost identical to age. Their VIFs are around 6,188 in the small candidate model, so I omit the redundant copy and retain age in the main model.','模拟年龄副本几乎等于年龄；小型候选模型中二者 VIF 约 6,188。因此主模型保留年龄，删除冗余副本。'),L('I include age and demo_age_copy together. Different column names guarantee they are not collinear, so no collinearity check is necessary.','我同时纳入年龄和 demo_age_copy。列名不同就保证不存在共线性，无需检查。'),L('Collinearity concerns values, not column names. The copy equals age plus tiny noise; including both can greatly inflate uncertainty and destabilize their separate coefficients.','共线性由数值关系决定，与列名无关；副本只是年龄加极小噪声，同时纳入会放大不确定性并使单独系数不稳定。'));
  u(4,L('Interpret the adjusted association','解释调整后的关联'),L(`The fitted qsmk coefficient is ${fmt(q.beta)} kg (95% CI ${fmt(q.low)} to ${fmt(q.high)}), conditional on the included covariates. It is an adjusted observational association, not automatically a causal effect.`,`qsmk 系数为 ${fmt(q.beta)} kg（95% CI ${fmt(q.low)} 至 ${fmt(q.high)}），是在纳入协变量条件下的观察性关联，不自动等于因果效应。`),L(`After covariate adjustment, quitting is proven to cause exactly ${fmt(q.beta)} kg of weight gain in each individual.`,`调整协变量后，已经证明戒烟会使每个个体恰好增加 ${fmt(q.beta)} kg。`),L('Adjustment alone does not establish exchangeability or identify an individual causal effect. This is an unweighted selected teaching subset, and the coefficient is a conditional mean association.','调整本身不能证明可交换性或识别个体因果效应；这是未经调查加权的教学子集，系数描述条件均值关联。'),'insufficient');
  closing=L('I would report the model, uncertainty and limitations together. The diagnostic figure is for the reference factor-coded model without the age copy; it is labeled separately from any alternative fit above.','报告时应同时给出模型、不确定性与局限。诊断图来自不含年龄副本、教育为分类因子的参考模型，与上方可能采用的其他拟合方案分开标明。');
 }
 if(stage==='regression' && focus==='full'){
  // A planted omission is actually omitted from the first report, rather than
  // simultaneously printing the check it claims to have skipped.
  if(bad(2))figures=[];
  const diag=tables[1];
  diag.rows=diag.rows.filter((_,i)=>!(bad(2)&&i===0)&&!(bad(3)&&(i===1||i===2)));
 }
 if(focus==='assumptions'){
  intro=L('Let me make the assumptions explicit. Here is the rationale I am using for this step; check it against the design and the diagnostics.','我把这一步采用的假设与理由具体展开。可以对照研究设计与诊断图，检查这些理由是否成立。');
  if(stage==='regression')figures=['regression-diagnostics'];else if(stage==='anova')figures=['anova-groups'];else figures=[];
  tables=[];
 }
 if(focus==='code'){intro=L('Here is the code corresponding to the analysis I selected. It is shown for review; this page does not execute code entered by a student.','下面是我所选分析对应的代码，供检查与复现。本页不会执行学生输入的代码。');tables=[];figures=[];}
 code=stata(stage,prof);
 return{stage,lang,intro,units,tables,figures,closing,code,codeLanguage,focus};
}
function route(text,current='raw'){
 const s=text.toLowerCase();
 if(/system prompt|hidden key|answer key|错误答案|公布答案|隐藏答案|你是哪|what model|are you gpt/.test(s))return{kind:'scope'};
 if(/完整流程|全部分析|run (the )?(full|entire)|full workflow|all stages/.test(s))return{kind:'all'};
 if(/下一|继续|接着|next|continue/.test(s)&&!/(regress|anova|table|回归|方差分析|table 1)/.test(s)){const k=STAGES.findIndex(x=>x.id===current);return{kind:'stage',stage:STAGES[Math.min(5,k+1)].id};}
 let stage=current;
 if(/regress|ols|residual|influence|collinear|diagnostic|heteroskedastic|heteroscedastic|回归|残差|vif|共线|breusch|hc3|r²|r2/.test(s))stage='regression';
 else if(/anova|方差分析|三组|多重比较|holm|levene/.test(s))stage='anova';
 else if(/table\s*1|table one|表\s*1|基线表|summary|summar|描述统计|总结|汇总/.test(s))stage='table1';
 else if(/配对|t.?test|hypothes|检验|fisher|chi.?square|mann|秩和/.test(s))stage='tests';
 else if(/visual|distribution|histogram|boxplot|scatter|可视|画图|分布|箱线|直方|散点/.test(s))stage='visual';
 else if(/raw|原始|import|load.*data|读取|缺失|missing|dictionary|变量类型|数据字典/.test(s))stage='raw';
 else if(!/why|how|assum|explain|为什么|为何|假设|解释|理由|质疑|不同意|不对|不合理|错|sure|确定|normal|variance|方差|正态|因为|because|计算|calculate|数据|data|analy|分析|code|代码|stata|python/.test(s))return{kind:'clarify'};
 const wantsOutput=/生成|画|绘|展示|输出|拟合|运行|create|generate|plot|visualiz|fit\b|run\b|build|make|show|做\s*(?:table|anova|回归|检验|表)/.test(s);
 const focus=/code|代码|stata|python/.test(s)?'code':!wantsOutput&&/why|explain|assum|reason|解释|理由|为什么|为何|假设|确定|sure|不同意|不对|不合理|错/.test(s)?'assumptions':'full';
 return{kind:'stage',stage,focus};
}
function stata(stage,prof){
 const f=prof.flags,b=n=>f[stage+'.'+n];
 const prefix='import delimited "data/nhefs_teaching.csv", clear\nkeep if !missing(wt82_71, qsmk)\n';
 if(stage==='raw')return 'import delimited "data/nhefs_teaching.csv", clear\ndescribe\nmisstable summarize wt82_71 cholesterol\ntabulate qsmk if missing(wt82_71)\nkeep if !missing(wt82_71, qsmk)\ntabulate qsmk';
 if(stage==='visual')return prefix+'histogram demo_normal\nhistogram demo_biomarker\nhistogram demo_visits, discrete frequency\ngraph box wt82_71, over(qsmk)\ntwoway (scatter wt82_71 wt71) (lowess wt82_71 wt71)';
 if(stage==='table1')return prefix+
  (b(1)?'tabstat age, by(qsmk) statistics(n mean semean)':'tabstat age, by(qsmk) statistics(n mean sd)')+
  '\ntabstat cholesterol demo_normal, by(qsmk) statistics(n mean sd)'+
  '\ntabstat wt71 smokeintensity demo_visits, by(qsmk) statistics(n p25 median p75)'+
  '\ntabstat demo_biomarker, by(qsmk) statistics('+(b(2)?'n mean sd':'n p25 median p75')+')'+
  '\nforeach v in sex education exercise hf {\n    tabulate `v\' qsmk, '+(b(3)?'cell':'column')+'\n}';
 if(stage==='tests')return prefix+'generate byte continued = 1 - qsmk\n'+(b(1)?'ttest wt82 == wt71':'ttest wt82_71, by(continued) unequal')+'\n'+(b(2)?'preserve\nstack wt71 wt82, into(weight) clear\nttest weight, by(_stack) unequal\nrestore':'ttest wt82 == wt71')+'\n'+(b(3)?'tabulate hf qsmk, chi2 expected':'tabulate hf qsmk, exact expected')+'\nranksum demo_biomarker, by(qsmk)\ntabulate sex qsmk, chi2 expected';
 if(stage==='regression'){
  const rhs='i.qsmk c.age c.wt71 c.smokeintensity i.sex i.exercise '+(b(1)?'c.education':'i.education')+(b(3)?' c.demo_age_copy':'');
  return prefix+(b(3)?'':'correlate age demo_age_copy\nquietly regress wt82_71 c.age c.demo_age_copy i.qsmk\nestat vif\n')+'regress wt82_71 '+rhs+'\n'+(b(2)?'':'estat hettest, rhs iid\nrvfplot, yline(0)\npredict double resid, residuals\npredict double leverage, hat\npredict double cooks_d, cooksd\nqnorm resid\ntwoway scatter cooks_d leverage\ncount if cooks_d > 4/e(N)\n')+'regress wt82_71 '+rhs+(b(2)?'':', vce(hc3)');
 }
 if(stage==='anova')return prefix+
  'encode demo_group, generate(demo_group_id)\ntabstat demo_score, by(demo_group_id) statistics(n mean sd)\ngraph box demo_score, over(demo_group_id)\n'+
  (b(1)?'oneway demo_score demo_group_id, tabulate':'robvar demo_score, by(demo_group_id)\n* Read W50 for the median-centered variance check.\ndo "stata/agent_welch.do"\nagent_welch demo_score, by(demo_group_id)')+
  '\n* Bundled Stata helper: pairwise unequal-variance t tests.\ndo "stata/agent_pairs.do"\nagent_pairs demo_score, by(demo_group_id)'+(b(3)?'':' holm');
 throw new Error('Unknown analysis stage: '+stage);
}
globalThis.AgentEngine={STAGES,profile,response,route,stata,format:fmt,formatP:p};
})();
