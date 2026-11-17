(() => {
'use strict';
const TRIANGLE='<svg class="agent-triangle" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M24 5 L44.78461 41 H3.21539 Z" fill="currentColor"/></svg>';
const E=globalThis.AgentEngine,A=globalThis.AgentAssessment,D=globalThis.LAB_DATA,KEY='nhefs-chat-local-v1';
let state={version:1,language:'en',mode:'mixed',chats:[],active:null};
let storage=true,busy=false,cancelled=false,generation=0,replyTimer=null,dataPage=0,dataTab='raw',dataSearch='',noteTarget=null;
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
try{const p=JSON.parse(localStorage.getItem(KEY));if(p?.version===1&&Array.isArray(p.chats))state=p;}catch{storage=false;}
state.language='en';
const L=(en,zh)=>en;
const langOf=()=> 'en';
const presetKey=s=>String(s).trim().replace(/[\s，、。！？：；:;!?.,·]/g,'').toLowerCase();
const legacyPrompts=new Map([
 ['运行完整流程：原始数据、可视化、Table 1、假设检验、ANOVA、线性回归。','Run the full workflow from raw data through visualizations, Table 1, tests, ANOVA and regression.'],
 ['运行完整流程。','Run the full workflow.'],
 ['读取原始数据，先检查变量类型和缺失情况。','Load the raw data and check variable types and missingness.'],
 ['画出协变量和结局的分布，并解释图中的发现。','Visualize the distributions of the covariates and the outcome.'],
 ['按戒烟状态生成 Table 1，并解释为何选择这些描述方式。','Generate Table 1 by smoking cessation and explain your summary choices.'],
 ['你做了哪些假设？','What assumptions are you making?'],
 ['解释残差和影响点检查。','Explain the residual and influence checks.'],
 ...E.STAGES.flatMap(s=>[
  ['请进行这一步分析：'+s.zh,'Please discuss this step: '+s.en],
  ['请解释'+s.zh+'所做的假设。','Explain the assumptions for '+s.en+'.'],
  ['继续：'+s.zh,'Continue to '+s.en]
 ])
].map(([source,english])=>[presetKey(source),english]));
const englishPreset=s=>legacyPrompts.get(presetKey(s))||s;
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2,9);
const active=()=>state.chats.find(c=>c.id===state.active);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storage=false;}if(!storage)$('#disclaimer').textContent=L('Browser storage is unavailable. Export this conversation before closing.','浏览器未能保存记录，请在关闭前导出对话。');};
const toast=t=>{const el=$('#toast');el.textContent=t;el.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display='none',3500);};
const stageName=id=>{const s=E.STAGES.find(x=>x.id===id);return s?.[state.language]||id;};
const currentStage=()=>active()?.lastStage||'raw';
const txt={new:['New chat','新对话'],dataset:['Data files','数据文件'],workflow:['Analysis outline','分析流程'],history:['Your conversations','对话记录'],teaching:['Design notes','教学说明'],notes:['My error reports','我的错误报告'],finish:['Finish & score','结束并评分']};
function translate(){
 document.documentElement.lang='en';
 for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=L(...txt[el.dataset.i18n]);
 $('#prompt').placeholder=L('Ask about the data, a plot, a test, or a regression…','询问数据、图表、检验或回归分析…');
 $('#attachment-caption').textContent=L('1,629 rows · observed + simulated variables','1,629 行 · 真实变量 + 模拟变量');
 $('#disclaimer').textContent=L('Course simulation. Agent may make statistical mistakes. Check the reasoning independently.','课程对话模拟。Agent 的分析可能包含统计错误，请独立核查。');
 $('#send').setAttribute('aria-label',L(busy?'Stop response':'Send message',busy?'停止回复':'发送消息'));
}
function createChat(){
 if(busy)stop();
 const seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;
 const c={id:uid(),title:L('New analysis','新的分析'),created:new Date().toISOString(),profile:E.profile(seed,state.mode),messages:[],notes:{},quizResponses:{},transferChoices:{},assessmentVersion:A.VERSION,review:null,lastStage:'raw'};
 state.chats.unshift(c);state.active=c.id;save();render();$('#prompt').focus();closeSidebar();
}
function ensureChat(){if(!active())createChat();return active();}
function renderHistory(){
 $('#history').innerHTML=state.chats.length?state.chats.map(c=>`<button class="history-item ${c.id===state.active?'active':''}" data-chat="${c.id}" title="${esc(c.title)}">${esc(c.title)}</button>`).join(''):`<div class="history-empty">${L('Your analyses will appear here.','你的分析对话将显示在这里。')}</div>`;
 $('#note-count').textContent=active()?reportedUnits(active()).length:0;
 $('#header-context').textContent=active()?.messages.length?stageName(currentStage()):'Statistics assistant';
}
function welcome(){return `<section class="welcome"><div class="welcome-glyph">${TRIANGLE}</div><h1>StatSense Lab</h1><p class="welcome-tagline"><em>Evaluate statistical reasoning. Identify errors. Make better decisions.</em></p><p class="welcome-course">PHEB 602 · Biostatistics I</p><div class="welcome-prompts">${[
 ['▤',L('Start with the raw data','从原始数据开始'),L('Inspect variables and missingness','检查变量类型与缺失情况'),L('Load the raw data and check variable types and missingness.','读取原始数据，先检查变量类型和缺失情况。')],
 ['◫',L('Make the plots','先画图看看'),L('Explore different distributions','看看不同类型变量的分布'),L('Visualize the distributions of the covariates and the outcome.','画出协变量和结局的分布，并解释图中的发现。')],
 ['≡',L('Build Table 1','生成 Table 1'),L('Summarize by smoking cessation','按戒烟状态总结数据'),L('Generate Table 1 by smoking cessation and explain your summary choices.','按戒烟状态生成 Table 1，并解释为何选择这些描述方式。')],
 ['↗',L('Run the full workflow','演示完整分析流程'),L('From raw data to regression','从原始数据一直做到回归'),L('Run the full workflow from raw data through visualizations, Table 1, tests, ANOVA and regression.','运行完整流程：原始数据、可视化、Table 1、假设检验、ANOVA、线性回归。')]
 ].map(([icon,title,sub,prompt])=>`<button class="welcome-prompt" data-prompt="${esc(prompt)}"><span>${icon}</span><span><strong>${title}</strong><small>${sub}</small></span></button>`).join('')}</div><div class="welcome-foot">Chat with Agent · NHEFS + 6 synthetic teaching variables</div></section>`;}
const unitsFor=c=>{const map=new Map();for(const m of c?.messages||[])if(m.role==='assistant'&&m.response)for(const u of m.response.units)if(!map.has(u.id))map.set(u.id,{...u,messageId:m.id});return[...map.values()];};
function tableHTML(t){return `<div class="table-title">${esc(t.title)}</div><div class="data-table-wrapper"><table class="data-table"><thead><tr>${t.headers.map(v=>`<th scope="col">${esc(v)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${t.note?`<p class="table-note">${esc(t.note)}</p>`:''}`;}
function assistantHTML(m){
 const r=m.response,c=active();
 if(!r)return`<article class="message"><div class="assistant-head"><span class="assistant-avatar">${TRIANGLE}</span>Agent</div><div class="assistant-content"><p>${esc(m.text)}</p></div></article>`;
 const code=`<details class="code-details" ${r.focus==='code'?'open':''}><summary>View the analysis code · Stata</summary><pre>${esc(r.code)}</pre><div class="code-note">Run Stata from this project folder. The ANOVA helpers are included in the stata/ folder. Code is shown for review; this page does not execute Stata.</div></details>`;
 return`<article class="message assistant-message" id="message-${m.id}"><div class="stage-separator">${esc(stageName(r.stage))}</div><div class="assistant-head"><span class="assistant-avatar">${TRIANGLE}</span>Agent <small>${L('Statistics assistant','统计助手')}</small></div><div class="assistant-content"><p>${esc(r.intro)}</p>${r.tables.map(tableHTML).join('')}${r.figures.map(id=>{const f=D.figures.find(x=>x.id===id);return`<figure class="figure"><img src="${f.path}" alt="${esc(f.alt)}" data-image="${f.id}" loading="lazy"><figcaption><strong>${esc(f.title)}</strong>${esc(f.alt)}</figcaption></figure>`;}).join('')}<h3>${L('Analysis rationale','分析思路')}</h3><ol class="analysis-units">${r.units.map(u=>{
 const reported=A.answered(u,c.quizResponses[u.id],c.profile.seed),review=c.review?.judgments.find(v=>v.id===u.id);
 return`<li class="analysis-unit ${reported?'marked':''}" id="unit-${m.id}-${u.id.replace('.','-')}"><button class="mark-unit" data-note="${u.id}" data-message="${m.id}" aria-label="${esc('Report a statistical error: '+u.title)}" title="Report an error">⚑</button><strong>${esc(u.title)}${review?`<span class="debrief-tag ${u.truth==='supported'?'':'error'}">${u.truth==='supported'?L('Supported','有依据'):L('Needs revision','需修正')}</span>`:''}</strong><p>${esc(u.body)}</p></li>`;}).join('')}</ol>${code}<p>${esc(r.closing)}</p></div><div class="message-actions"><button class="message-action" data-copy="${m.id}"><span>⧉</span>${L('Copy','复制')}</button><button class="message-action" data-why="${r.stage}"><span>↳</span>${L('Explain the assumptions','解释假设')}</button><button class="message-action" data-mark-message="${m.id}"><span>⚑</span>${L('Report an error','报告一个错误')}</button></div></article>`;
}
function renderMessages(){
 const c=active(),msgs=c?.messages||[];
 $('#messages').innerHTML=msgs.length?msgs.map(m=>m.role==='user'?`<article class="message user-message"><div class="user-bubble">${esc(m.text)}</div></article>`:assistantHTML(m)).join(''):welcome();
 document.body.classList.toggle('chat-started',!!msgs.length);
 renderSuggestions();
}
function renderSuggestions(){
 const c=active();if(!c?.messages.length||busy){$('#suggestions').innerHTML='';return;}
 const idx=E.STAGES.findIndex(s=>s.id===c.lastStage),next=E.STAGES[Math.min(5,idx+1)];
 const suggestions=[L('What assumptions are you making?','你做了哪些假设？')];
 if(idx<5)suggestions.unshift(L('Continue to '+next.en,'继续：'+next.zh));
 else suggestions.unshift(L('Explain the residual and influence checks.','解释残差和影响点检查。'));
 $('#suggestions').innerHTML=suggestions.map(s=>`<button class="suggestion" data-prompt="${esc(s)}">${esc(s)}</button>`).join('');
}
function addTablePValues(r){
 if(r.stage!=='table1'||!r.tables[0])return;
 const t=r.tables[0];t.headers.push('Exploratory test','p');let row=0;
 for(const v of D.table1){const count=v.style==='categorical'?v.levels.length:1;for(let j=0;j<count;j++)t.rows[row++].push(j?'':v.test,j?'':E.formatP(v.p));}
 t.note+=' Added p-values are unadjusted exploratory comparisons and do not determine confounder selection.';
 r.code+='\n* Optional exploratory Table 1 comparisons.\nforeach v in age cholesterol demo_normal {\n    ttest `v\', by(qsmk) unequal\n}\nforeach v in wt71 smokeintensity demo_biomarker demo_visits {\n    ranksum `v\', by(qsmk)\n}\nforeach v in sex education exercise {\n    tabulate `v\' qsmk, chi2 expected\n}\ntabulate hf qsmk, exact expected';
}
function normalizeStoredConversations(){
 // The original preset buttons created user-role messages too. Migrate those
 // known templates, without guessing translations of student-authored writing.
 state.language='en';
 for(const c of state.chats)for(const m of c.messages){
  if(m.role!=='user')continue;
  const translated=englishPreset(m.text);
  if(translated!==m.text){m.originalPresetText=m.originalPresetText||m.text;m.text=translated;m.origin='preset';}
 }
 if(state.presentationVersion==='agent-stata-v5')return;
 for(const c of state.chats){
  const unitMap=new Map();
  for(const m of c.messages){
   if(m.response){
    const old=m.response;
    const r=E.response(old.stage,c.profile,'en',old.focus||'full');
    if(old.stage==='table1'&&old.tables?.[0]?.headers.includes('p'))addTablePValues(r);
    m.response=r;
    for(const u of r.units)unitMap.set(u.id,u);
   }else if(m.role==='assistant'&&/[\u3400-\u9fff]/.test(m.text||'')){
    m.text='I can help you inspect the data, create plots, build Table 1, and discuss tests or regression using Stata. Ask about a specific analysis step or assumption.';
   }else if(m.role==='assistant'&&/\bAri\b/.test(m.text||'')){
    m.text=m.text.replace(/\bAri\b/g,'Agent');
   }
  }
  for(const note of Object.values(c.notes||{})){const u=unitMap.get(note.id);if(u){note.title=u.title;note.body=u.body;}}
  for(const j of c.review?.judgments||[]){const u=unitMap.get(j.id);if(u)Object.assign(j,{title:u.title,body:u.body,correct:u.correct,explanation:u.explanation});}
  if(/[\u3400-\u9fff]/.test(c.title))c.title='NHEFS · '+stageName(c.lastStage||'raw');
 }
 state.presentationVersion='agent-stata-v5';
}
function initializeAssessment(){
 for(const c of state.chats){
  c.notes=c.notes||{};c.quizResponses=c.quizResponses||{};c.transferChoices=c.transferChoices||{};
  if(c.review&&c.review.version!==A.VERSION){c.previousReviews=c.previousReviews||[];c.previousReviews.push(c.review);c.review=null;}
  const earlier=Object.fromEntries(Object.entries(c.quizResponses).filter(([,r])=>r.version!==A.VERSION));
  if(Object.keys(earlier).length){c.previousAnswers=c.previousAnswers||[];c.previousAnswers.push({archivedAt:new Date().toISOString(),answers:earlier});c.quizResponses=Object.fromEntries(Object.entries(c.quizResponses).filter(([,r])=>r.version===A.VERSION));}
  c.assessmentVersion=A.VERSION;
 }
}
function render(){translate();renderHistory();renderMessages();updateSend();}
function updateSend(){$('#send').disabled=!busy&&!$('#prompt').value.trim();$('#send').classList.toggle('stopping',busy);$('#send').textContent=busy?'■':'↑';}
function bottom(){const el=$('#conversation');el.scrollTop=el.scrollHeight;}
function sleepReply(ms){return new Promise(resolve=>{replyTimer=setTimeout(resolve,ms);});}
function addTyping(){const div=document.createElement('div');div.id='typing';div.className='message';div.setAttribute('role','status');div.setAttribute('aria-label',L('Agent is writing a response','Agent 正在回复'));div.innerHTML=`<div class="assistant-head"><span class="assistant-avatar">${TRIANGLE}</span>Agent</div><div class="assistant-content typing"><i></i><i></i><i></i><span class="typing-text">${L('Preparing the analysis…','正在整理分析…')}</span></div>`;$('#messages').appendChild(div);bottom();}
function stop(){cancelled=true;generation++;busy=false;$('#typing')?.remove();updateSend();renderSuggestions();toast(L('Response stopped. Your conversation is saved.','已停止回复，对话记录已保存。'));}
async function send(text,requestedStages=null){
 text=englishPreset(text.trim());if(!text||busy)return;
 const c=ensureChat(),lang=langOf(text),route=E.route(text,c.lastStage);
 if(c.messages.length===0)c.title=/[\u3400-\u9fff]/.test(text)?'NHEFS · '+stageName(route.stage||'raw'):(text.length>32?text.slice(0,32)+'…':text);
 c.messages.push({id:uid(),role:'user',text,time:new Date().toISOString()});$('#prompt').value='';resizePrompt();busy=true;cancelled=false;const token=++generation;render();save();bottom();
 const list=requestedStages?requestedStages.map(stage=>({kind:'stage',stage,focus:'full'})):route.kind==='all'?E.STAGES.map(s=>({kind:'stage',stage:s.id,focus:'full'})):[route];
 for(const target of list){
  if(cancelled||token!==generation)break;
  addTyping();await sleepReply(route.kind==='all'?500:650);if(token!==generation)return;$('#typing')?.remove();if(cancelled)break;
  if(target.kind==='stage'){
   const r=E.response(target.stage,c.profile,lang,target.focus||'full');
   if(/p\s*[- ]?values?|p\s*值/i.test(text))addTablePValues(r);
   c.messages.push({id:uid(),role:'assistant',response:r,time:new Date().toISOString()});c.lastStage=target.stage;
  }else{
   const text=target.kind==='scope'?(lang==='zh'?'我是 Agent，一个为 Biostat I 设计的可控对话模拟，围绕附带的 NHEFS 教学数据工作。我可以解释分析、图表和代码；我不是通用 GPT，也不会执行你输入的代码。参考解析在你提交复盘后显示。':'I am Agent, a controlled Biostat I conversation simulator using the attached NHEFS teaching data. I can explain the analyses, figures and code. I am not a general GPT model and do not execute entered code. Reference explanations appear after you submit your review.'):(lang==='zh'?'你希望我先检查原始数据、画图、生成 Table 1，还是解释某个检验/回归结果？也可以指出上一段中你想追问的假设。':'Would you like me to inspect the data, make plots, build Table 1, or explain a test or regression? You can also ask about an assumption in my previous response.');
   c.messages.push({id:uid(),role:'assistant',text,time:new Date().toISOString()});
  }
  save();renderHistory();renderMessages();
  // Keep the new answer's start visible rather than jumping past long tables.
  const last=$('#messages').lastElementChild;if(last)last.scrollIntoView({block:'start',behavior:'smooth'});
 }
 if(token!==generation)return;busy=false;updateSend();renderSuggestions();save();
}
function resizePrompt(){const p=$('#prompt');p.style.height='auto';p.style.height=Math.min(125,p.scrollHeight)+'px';}
function openDialog(title,body,sub=''){$('#dialog-heading').innerHTML=`<h2>${esc(title)}</h2>${sub?`<small>${esc(sub)}</small>`:''}`;$('#dialog-body').innerHTML=body;if(!$('#dialog').open)$('#dialog').showModal();$('#dialog').scrollTop=0;$('#dialog-body').scrollTop=0;}
function closeDialog(){$('#dialog').close();noteTarget=null;}
function dataDialog(){
 openDialog(L('The attached dataset','附带的数据文件'),`<p class="dialog-intro">${L('The original public NHEFS teaching file is preserved. Six demo_* columns were added with seed 602. No original values were overwritten.','保留原始公开 NHEFS 教学数据，用种子 602 添加 6 个 demo_* 列，未覆盖原始数值。')}</p><div class="button-row"><a class="button secondary" href="data/nhefs_teaching.csv" download>${L('Download working CSV','下载工作 CSV')} ↓</a><a class="button secondary" href="data/nhefs_original.csv" download>${L('Original NHEFS CSV','原始 NHEFS CSV')} ↓</a><a class="button secondary" href="data/NHEFS_Codebook.xls" download>${L('Original codebook','原始数据字典')} ↓</a></div><div class="button-row" style="margin-top:10px"><a class="button secondary" href="stata/reference_analysis.do" download>Reference Stata do-file ↓</a><a class="button secondary" href="stata/agent_welch.do" download>Welch ANOVA helper ↓</a><a class="button secondary" href="stata/agent_pairs.do" download>Pairwise / Holm helper ↓</a></div><div class="notice">${L('SIMULATED: demo_normal, demo_biomarker, demo_visits, demo_group, demo_score and demo_age_copy are generated for teaching. Their associations are not real NHEFS findings.','模拟变量：demo_normal、demo_biomarker、demo_visits、demo_group、demo_score、demo_age_copy 仅用于教学，不代表真实 NHEFS 研究发现。')}</div><div class="tab-row"><button class="tab-button ${dataTab==='raw'?'active':''}" data-data-tab="raw">${L('Raw preview','原始值预览')}</button><button class="tab-button ${dataTab==='dictionary'?'active':''}" data-data-tab="dictionary">${L('Variable dictionary','变量字典')}</button></div><div id="data-content"></div><p class="source-line">${L('Source: Hernán & Robins, Causal Inference: What If.','来源：Hernán 与 Robins，Causal Inference: What If。')} <a href="https://miguelhernan.org/whatifbook" target="_blank" rel="noreferrer">Dataset source ↗</a></p>`,L('70 columns · 1,629 rows · all files local','70 列 · 1,629 行 · 文件均在本地'));
 renderDataContent();
}
function renderDataContent(){
 if(dataTab==='dictionary'){$('#data-content').innerHTML=`<div class="dictionary-grid">${D.variables.map(v=>`<div class="dictionary-item"><span class="small-badge ${v.origin==='SIMULATED'?'synthetic':''}">${v.origin}</span><code>${v.name}</code><p>${esc(v.kind)}<br>${esc(v.definition)}<br>${L('Missing in original rows: ','原始记录中缺失：')}${v.missing}</p></div>`).join('')}</div>`;return;}
 const cols=D.rawColumns.map((name,i)=>({name,i})).filter(v=>!dataSearch||v.name.toLowerCase().includes(dataSearch.toLowerCase()));
 const start=dataPage*20,rows=D.rawRows.slice(start,start+20);
 $('#data-content').innerHTML=`<div class="data-toolbar"><span>${start+1}–${Math.min(start+20,D.info.originalRows)} / 1,629 · ${L('preview columns','预览列')} ${cols.length}</span><input id="data-search" aria-label="Filter preview columns" placeholder="${L('Filter column names…','按列名筛选…')}" value="${esc(dataSearch)}"><div><button class="icon-button" id="data-prev" aria-label="Previous rows" ${dataPage===0?'disabled':''}>‹</button><button class="icon-button" id="data-next" aria-label="Next rows" ${start+20>=D.info.originalRows?'disabled':''}>›</button></div></div><div class="raw-table"><table class="data-table"><thead><tr><th>#</th>${cols.map(c=>`<th>${c.name}</th>`).join('')}</tr></thead><tbody>${rows.map((row,j)=>`<tr><td>${start+j+1}</td>${cols.map(c=>`<td>${row[c.i]===null?'—':typeof row[c.i]==='number'?esc(Number(row[c.i].toFixed(3))):esc(row[c.i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="small-print">${L('Preview shows selected analysis columns; the downloaded working CSV contains all 70 columns. A dash indicates a missing value, not zero.','预览展示选定分析列，下载的工作 CSV 含全部 70 列。“—”表示缺失，不是零。')}</p>`;
 $('#data-search').addEventListener('input',e=>{dataSearch=e.target.value;const start=e.target.selectionStart;renderDataContent();$('#data-search').focus();$('#data-search').setSelectionRange(start,start);});
}
function workflowDialog(){
 const seen=new Set(unitsFor(active()).map(u=>u.stage));
 openDialog(L('A complete statistical workflow','完整统计分析流程'),`<p class="dialog-intro">${L('Ask naturally, move between steps, or run the full workflow. Follow-up questions preserve the same reasoning choices in this conversation.','可以自然提问、在各步骤间切换，也可以运行完整流程。同一对话中的分析选择保持一致，便于追问和审查。')}</p>${E.STAGES.map((s,i)=>`<div class="workflow-item"><span class="workflow-number">${seen.has(s.id)?'✓':String(i+1).padStart(2,'0')}</span><div><h3>${s[state.language]}</h3><p>${[L('Definitions, missingness, provenance','定义、缺失与变量来源'),L('Shape, support, unusual values','形状、取值范围与异常观测'),L('Mean/SD, median/IQR, n (%)','均值/SD、中位数/IQR、n (%)'),L('Welch, paired t, ranks, chi-square, Fisher','Welch、配对 t、秩检验、卡方、Fisher'),L('Unequal variances, omnibus tests, multiplicity','方差不齐、整体检验与多重比较'),L('Coding, residuals, influence, collinearity','编码、残差、影响点与共线性')][i]}</p></div><button class="button secondary" data-stage="${s.id}">${L('Discuss','讨论')} →</button></div>`).join('')}<div class="button-row" style="margin-top:20px"><button class="button" id="run-all">${L('Run the full workflow','运行完整流程')} →</button></div>`);
}
function teachingDialog(){
 openDialog('Design notes',`<div class="teacher-text"><p>StatSense Lab is a local teaching website for auditing statistical reasoning. Agent is its simulated chat assistant. Numerical tables and plots come from the bundled NHEFS teaching data; response variants and answer choices are curated.</p><h3>Error design</h3><p>A full workflow has 24 reasoning points. Mixed mode plants seven flawed points (29.2%), at most two per stage, with at least one entirely sound stage. The profile stays fixed within a conversation.</p><h3>Report only suspected errors</h3><p>Students leave acceptable statements unreported. To report a suspected error, they select its statistical problem and an appropriate correction. There is no “no problem” answer option and no requirement to answer questions for every statement. Opening the form does not flag a statement; saving both choices creates an error report. A report can be edited or removed before submission.</p><h3>Automatic scoring</h3><p>At submission, every unreported statement is treated as accepted. An actual error left unreported is a missed error and earns zero for that statement. A sound statement reported as wrong is a false alarm and earns zero, regardless of the choices selected.</p><p>In mixed profiles, finding and correcting actual errors contributes 48 points, correctly leaving sound statements unreported contributes 48 points, and the two transfer questions contribute 4 points. Each actual error shares its component equally: half for the correct diagnosis and half for the correct correction. This balance prevents accepting everything or reporting everything from receiving a high score. In a fully sound reference profile, the sound statements share all 96 statement points. Final scores are rounded to one decimal.</p><h3>Completing an attempt</h3><p>Discuss all six stages, report only the errors you identify, answer the two transfer questions, then submit. There is no minimum or target number of reports. Submission locks the attempt and reveals missed errors, false alarms, choices, explanations and the score. Reports export as JSON and a one-row score CSV.</p><h3>Question quality and earlier work</h3><p>The diagnosis choices describe potential errors, never an acceptance option. Only an actual flawed quote has an applicable diagnosis key. Reporting a supported quote is an incorrect decision, rather than a multiple-choice question with a correct no-problem choice. The <a href="ASSESSMENT_AUDIT.md">assessment audit</a> documents the rules and numerical checks. Earlier answer sets and scores remain historical records and are not silently converted into error reports.</p><h3>Scope</h3><p>The real-data analyses are unweighted complete-case observational examples. All demo_* variables are synthetic. Local files and reports are editable; this is a formative teaching tool.</p><h3>Instructor demonstration setting</h3><label>For new conversations<select id="demo-mode"><option value="mixed" ${state.mode==='mixed'?'selected':''}>Mixed · approximately 30%</option><option value="demo" ${state.mode==='demo'?'selected':''}>Fixed demonstration profile</option><option value="sound" ${state.mode==='sound'?'selected':''}>Fully sound reference</option></select></label><p class="small-print">This local setting is not an authenticated instructor role. It affects new conversations only.</p></div>`);
 $('#demo-mode').addEventListener('change',e=>{state.mode=e.target.value;save();toast('Setting saved for new conversations.');});
}
function findUnit(id,messageId){const m=active()?.messages.find(m=>m.id===messageId&&m.response);return m?.response.units.find(u=>u.id===id)||unitsFor(active()).find(u=>u.id===id);}
function reportedUnits(c=active()){return unitsFor(c).filter(u=>A.answered(u,c.quizResponses?.[u.id],c.profile.seed));}
function orderedUnits(c=active()){const all=unitsFor(c);return E.STAGES.flatMap(s=>all.filter(u=>u.stage===s.id));}
function choiceHTML(q,name,selected,extra=''){
 return `<fieldset class="answer-group"><legend>${esc(q.prompt)}</legend>${q.choices.map((o,i)=>`<label class="answer-option"><input type="radio" name="${name}" value="${o.id}" ${selected===o.id?'checked':''} ${extra}><span class="answer-letter">${'ABCD'[i]}</span><span>${esc(o.text)}</span></label>`).join('')}</fieldset>`;
}
function noteDialog(id,messageId,returnTo='chat'){
 const c=active(),u=findUnit(id,messageId);if(!u)return;
 if(c.review){toast('These reports are locked. Use the score report to review the key.');return;}
 noteTarget={id,messageId:messageId||u.messageId,returnTo};
 const q=A.questions(u,c.profile.seed),r=c.quizResponses[id]||{};
 const context='Only save a report if you believe this statement contains a statistical error. If you accept the statement, close this window without saving. Judge this quote under the stated unweighted teaching model; use alpha=0.05 unless specified otherwise.';
 openDialog('Report a statistical error',`<p class="dialog-intro">${context}</p><div class="note-quote">${esc(u.body)}</div><form id="note-form" class="choice-review-form">${choiceHTML(q.diagnosis,'diagnosisChoice',r.diagnosisChoice)}${choiceHTML(q.action,'actionChoice',r.actionChoice)}<p class="form-foot">Saving both choices reports this statement as wrong. Opening or closing this form alone does not create a report. Correct answers appear after final submission.</p><div id="note-error" role="alert"></div><div class="button-row"><button class="button" type="submit" id="save-answer">Save error report</button><button class="button secondary" type="button" id="cancel-report">Cancel</button>${A.answered(u,r,c.profile.seed)?'<button class="button secondary" type="button" id="remove-note">Remove error report</button>':''}</div></form>`);
}
function messagePicker(mid){
 const c=active(),m=c.messages.find(x=>x.id===mid);if(!m?.response)return;
 openDialog('Report only statements you think are wrong',`<p class="dialog-intro">Leave statements you accept unreported. You do not need to answer questions for every statement.</p>`+m.response.units.map(u=>`<div class="note-card"><h3>${esc(u.title)}<button class="button secondary" data-note="${u.id}" data-message="${mid}">${A.answered(u,c.quizResponses[u.id],c.profile.seed)?'Edit error report':'Report an error'} ↗</button></h3><p>${esc(u.body)}</p></div>`).join(''));
}
function notesDialog(){
 const c=active();if(!c)return openDialog('My error reports','<div class="empty-state">Start an analysis conversation. Report only statements you believe are wrong.</div>');
 const done=reportedUnits(c),legacy=Object.values(c.notes||{});
 const body=`<p class="dialog-intro">${done.length} error report${done.length===1?'':'s'} saved. Unreported statements will be treated as accepted on submission. There is no required number of reports.</p>${done.map(u=>{const r=c.quizResponses[u.id],q=A.questions(u,c.profile.seed);return`<div class="note-card"><h3>${esc(u.title)}<button class="icon-button" data-note="${u.id}" data-message="${r.messageId}" data-return="notes" aria-label="Edit error report">↗</button></h3><blockquote>${esc(u.body)}</blockquote><p><strong>Reported problem:</strong> ${esc(A.chosen(q.diagnosis,r.diagnosisChoice).text)}</p><p><strong>Proposed correction:</strong> ${esc(A.chosen(q.action,r.actionChoice).text)}</p></div>`;}).join('')}${!done.length?'<div class="empty-state">No errors reported. Use “Report an error” only for a statement you believe is wrong.</div>':''}${legacy.length?`<details class="legacy-notes"><summary>Earlier written notes (preserved, not scored)</summary>${legacy.map(n=>`<div class="note-card"><h3>${esc(n.title)}</h3><p>${esc(n.reason)}</p><p>${esc(n.fix)}</p></div>`).join('')}</details>`:''}${c.previousAnswers?.length?'<p class="small-print">Earlier answer sets are preserved in the export; they are not treated as current error reports.</p>':''}<div class="button-row"><button class="button" id="open-score-summary">Finish & score</button><button class="button secondary" id="export-notes">Export conversation & reports ↓</button></div>`;
 openDialog('My error reports',body);
}
function finishDialog(){
 if(busy)return toast('Wait for the response to finish, or stop it, before submitting.');
 const c=active();if(!c||!unitsFor(c).length)return toast('Discuss at least one analysis step first.');
 if(c.review)return debriefDialog();
 const units=orderedUnits(c),seen=new Set(units.map(u=>u.stage)),done=reportedUnits(c);
 const transfers=A.transfer(c.profile.seed),transferDone=transfers.filter(q=>A.chosen(q,c.transferChoices[q.id])).length;
 const full=units.length===24&&seen.size===6;
 const stageRows=E.STAGES.map(s=>{const su=units.filter(u=>u.stage===s.id),n=su.filter(u=>A.answered(u,c.quizResponses[u.id],c.profile.seed)).length;return`<div class="review-stage"><div><strong>${esc(s.en)}</strong><span>${su.length}/4 statements discussed · ${n} error report${n===1?'':'s'}</span></div><div class="review-stage-actions">${su.map((u,i)=>`<button type="button" class="review-item-button ${A.answered(u,c.quizResponses[u.id],c.profile.seed)?'reported':''}" data-note="${u.id}" data-message="${u.messageId}" data-return="finish" title="${esc(u.title)}">${i+1}${A.answered(u,c.quizResponses[u.id],c.profile.seed)?' ⚑':''}</button>`).join('')}</div></div>`;}).join('');
 const intro='Report only the statements you believe are wrong. You do not need to answer questions for acceptable statements. There is no required number of error reports.';
 openDialog('Finish & score',`<p class="dialog-intro">${intro}</p><div class="review-summary"><div class="review-stat"><strong>${seen.size}/6</strong><small>analysis stages discussed</small></div><div class="review-stat"><strong>${done.length}</strong><small>error reports saved</small></div><div class="review-stat"><strong>${units.length-done.length}</strong><small>statements left unreported</small></div></div>${!full?'<div class="notice">Complete the remaining analysis stages before submitting. Existing reports and the error profile will be retained.</div><button class="button" id="complete-missing">Complete remaining analysis steps →</button>':''}${stageRows}<div class="notice submission-rule">On submission, every unreported statement is treated as accepted. A missed actual error or a false alarm on a sound statement earns zero for that statement. An actual error earns credit for a correct diagnosis and correction.</div><p class="small-print">Scoring: actual errors share 48 points; correctly retained sound statements share 48; transfer questions add 4. In a single-class reference profile, that class shares all 96 statement points. This balances missed errors and false alarms. Scores are rounded to one decimal.</p><form id="finish-form"><h3 class="transfer-heading">Transfer to a new situation</h3><p class="small-print">These two independent questions remain required. ${transferDone}/2 answers saved.</p>${transfers.map(q=>choiceHTML(q,q.id,c.transferChoices[q.id],`data-transfer="${q.id}"`)).join('')}<p class="form-foot">Submission locks this attempt and reveals your score and explanations.</p><div id="finish-error" role="alert"></div><div class="button-row"><button class="button" type="submit" id="submit-score" ${!full?'disabled':''}>Submit ${done.length} error report${done.length===1?'':'s'} & calculate score →</button><button class="button secondary" type="button" id="return-to-chat">Keep discussing</button></div></form>`);
}
function submitReview(){
 const c=active(),units=orderedUnits(c);
 if(units.length!==24){$('#finish-error').innerHTML='<p class="error-text">Complete all six analysis stages before submitting.</p>';return;}
 for(const q of A.transfer(c.profile.seed)){const selected=$(`#finish-form input[name="${q.id}"]:checked`);if(selected)c.transferChoices[q.id]=selected.value;}
 if(A.transfer(c.profile.seed).some(q=>!A.chosen(q,c.transferChoices[q.id]))){$('#finish-error').innerHTML='<p class="error-text">Answer both transfer questions before submitting. Reports are needed only for statements you believe are wrong.</p>';return;}
 try{c.review=A.score(units,c.quizResponses,c.transferChoices,c.profile.seed);}catch(error){$('#finish-error').innerHTML=`<p class="error-text">${esc(error.message)}</p>`;return;}
 save();renderMessages();debriefDialog();
}
const scoreText=n=>String(Math.round((n+Number.EPSILON)*10)/10);
function resultChoice(label,result,correct,maximum=2){return`<div class="result-choice"><strong>${esc(label)} <span class="${correct?'correct-label':'wrong-label'}">${correct?'✓':'↳'} ${correct?scoreText(maximum):0}/${scoreText(maximum)}</span></strong><p><b>Your answer:</b> ${result.selected?esc(result.selected):'No error report submitted.'}</p>${!correct&&result.answer?`<p><b>Correct answer:</b> ${esc(result.answer)}</p>`:''}</div>`;}
function debriefDialog(){
 const c=active(),r=c.review;if(!r||r.version!==A.VERSION)return finishDialog();
 const n=r.counts;
 const heading=`<div class="final-score" aria-label="Final score ${r.points} out of 100"><strong>${r.points}<span>/100</span></strong><div><h3>Your calculated score</h3><p>${n.reported} error report${n.reported===1?'':'s'} submitted · ${r.correctDecisions}/24 reporting decisions correct</p></div></div>`;
 const summary=`<div class="review-summary"><div class="review-stat"><strong>${n.caught}/${n.flawed}</strong><small>actual errors reported</small></div><div class="review-stat"><strong>${n.missed}</strong><small>missed errors</small></div><div class="review-stat"><strong>${n.falseAlarms}</strong><small>false alarms</small></div></div><p class="small-print">${n.retained}/${n.supported} sound statements correctly left unreported. For actual errors: ${r.diagnosisCorrect}/${n.flawed} diagnoses and ${r.actionCorrect}/${n.flawed} corrections correct. Reporting an actual error does not by itself earn diagnosis/correction points.</p>`;
 const components=[['Error diagnosis & correction',r.errorPoints,r.weights.flawed],['Correct retention of sound statements',r.retentionPoints,r.weights.supported],['Transfer questions',r.transferPoints,4]];
 const componentHTML='<h3 class="transfer-heading">Score components</h3>'+components.filter(x=>x[2]>0).map(([label,points,max])=>`<div class="score-stage"><span>${label}</span><div><i style="width:${100*points/max}%"></i></div><strong>${scoreText(points)}/${max}</strong></div>`).join('');
 const stages=`<h3 class="transfer-heading">Score by analysis stage</h3>${r.stageScores.map(s=>`<div class="score-stage"><span>${esc(stageName(s.stage))}</span><div><i style="width:${s.maximum?100*s.points/s.maximum:0}%"></i></div><strong>${scoreText(s.points)}/${scoreText(s.maximum)}</strong></div>`).join('')}<p class="small-print">Stage weights reflect the actual mix of flawed and sound statements; they need not be equal. Displayed subtotals are rounded; the final score uses unrounded components.</p>`;
 const labels={'correct-report':'Error correctly diagnosed and corrected','incorrect-report':'Error reported; diagnosis or correction incorrect','missed-error':'Missed error','false-alarm':'False alarm','correctly-unreported':'Correctly left unreported'};
 const details=r.judgments.map(j=>`<section class="feedback-row" data-result="${j.status}"><h3>${esc(stageName(j.stage))} · ${esc(j.title)} <span class="pill-score">${scoreText(j.points)}/${scoreText(j.maximum)}</span><span class="debrief-tag ${j.points===j.maximum?'':'error'}">${labels[j.status]}</span></h3><p class="note-quote">${esc(j.body)}</p>${j.status==='false-alarm'?'<p class="error-text">This statement was sound. Reporting it as wrong earns zero, regardless of the selected diagnosis or correction.</p>':''}${j.status==='missed-error'?'<p class="error-text">This statement contained an error but was left unreported. It earns zero.</p>':''}${j.truth!=='supported'?resultChoice('1. Diagnosis',j.diagnosis,j.diagnosisCorrect,j.maximum/2)+resultChoice('2. Correction',j.action,j.actionCorrect,j.maximum/2):j.flagged?`<p><b>Reported problem:</b> ${esc(j.diagnosis.selected)}</p><p><b>Proposed correction:</b> ${esc(j.action.selected)}</p>`:'<p>You left this sound statement unreported and earned full credit. No answers were required.</p>'}<p class="key-text"><strong>Statistical explanation:</strong> ${esc(j.questionExplanation)}<br><strong>Sound reference reasoning:</strong> ${esc(j.correct)}</p></section>`).join('');
 const transfer=r.transfers.map((t,i)=>`<section class="feedback-row"><h3>Transfer ${i+1} <span class="pill-score">${t.points}/2</span></h3><p>${esc(t.prompt)}</p>${resultChoice('Answer',t,t.correct)}<p class="key-text">${esc(t.explanation)}</p></section>`).join('');
 openDialog('Your score & explanations',heading+summary+`<div class="button-row"><button class="button" id="export-review">Download full report ↓</button><button class="button secondary" id="export-score-csv">Download score CSV ↓</button><button class="button secondary" id="print-review">Print report</button><button class="button secondary" id="new-after-review">New conversation</button></div>`+componentHTML+stages+'<h3 class="transfer-heading">Statement-by-statement feedback</h3>'+details+transfer);
}
function exportScoreCSV(){
 const c=active(),r=c?.review;if(!r||r.version!==A.VERSION)return;
 const cell=x=>{let s=String(x??'');if(typeof x==='string'&&/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const header=['attempt_id','title','submitted_at','score','maximum','actual_errors','reports','errors_reported','missed_errors','false_alarms','sound_statements_retained','diagnoses_correct','corrections_correct','transfer_correct','grading_version'];
 const n=r.counts,row=[c.id,c.title,r.time,r.points,100,n.flawed,n.reported,n.caught,n.missed,n.falseAlarms,n.retained,r.diagnosisCorrect,r.actionCorrect,r.transferCorrect,A.VERSION];
 download(`StatSense-Lab-score-${c.id.slice(0,8)}.csv`,header.map(cell).join(',')+'\r\n'+row.map(cell).join(',')+'\r\n','text/csv;charset=utf-8');
}

function download(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function exportChat(){
 const c=active();if(!c)return;
 const strip=r=>({...r,units:r.units.map(u=>({id:u.id,stage:u.stage,title:u.title,body:u.body}))});
 const out={tool:'StatSense Lab',assistant:'Agent',course:'PHEB 602 · Biostatistics I',version:3,assessmentVersion:A.VERSION,title:c.title,created:c.created,dataset:D.info,notes:c.notes,errorReports:c.quizResponses,transferAnswers:c.transferChoices,messages:c.messages.map(m=>{const {originalPresetText,...message}=m;return m.response?{...message,response:c.review?m.response:strip(m.response)}:message;}),review:c.review,finalGrade:c.review?.points??null,maximumGrade:100,previousReviews:c.previousReviews||[],previousAnswers:c.previousAnswers||[],note:'Selective error reporting with automatic balanced scoring. Unreported statements are accepted on submission. This is an editable browser-local report; nothing is submitted automatically.'};
 if(c.review)out.instructorProfile=c.profile;
 download(`StatSense-Lab-report-${c.id.slice(0,8)}.json`,JSON.stringify(out,null,2),'application/json');toast('Report exported locally. Nothing was sent.');
}
async function copyMessage(id){const m=active().messages.find(x=>x.id===id);if(!m)return;const r=m.response;const text=r?[r.intro,...r.tables.map(t=>t.title+'\n'+t.headers.join(' | ')+'\n'+t.rows.map(v=>v.join(' | ')).join('\n')),...r.units.map((u,i)=>`${i+1}. ${u.title}\n${u.body}`),r.closing,r.code].join('\n\n'):m.text;
 try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);else{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}toast(L('Response copied.','已复制回复。'));}catch{download('Agent-response.txt',text,'text/plain');toast(L('Saved response as text.','已将回复保存为文本。'));}}
function closeSidebar(){document.body.classList.remove('sidebar-open');}
$('#chat-form').addEventListener('submit',e=>{e.preventDefault();if(busy)stop();else send($('#prompt').value);});
$('#prompt').addEventListener('input',()=>{resizePrompt();updateSend();});
$('#prompt').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(!busy)send(e.target.value);}});
$('#new-chat').addEventListener('click',createChat);$('#home').addEventListener('click',e=>{e.preventDefault();createChat();});
$('#collapse-side').addEventListener('click',()=>{document.body.classList.add('sidebar-hidden');closeSidebar();});
$('#expand-side').addEventListener('click',()=>{document.body.classList.remove('sidebar-hidden');if(innerWidth<=760)document.body.classList.toggle('sidebar-open');});
$('#sidebar-shade').addEventListener('click',closeSidebar);
for(const id of ['open-data','preview-file','data-tool'])$('#'+id).addEventListener('click',()=>{dataDialog();closeSidebar();});
$('#open-workflow').addEventListener('click',()=>{workflowDialog();closeSidebar();});$('#open-teaching').addEventListener('click',()=>{teachingDialog();closeSidebar();});
$('#open-notes').addEventListener('click',notesDialog);$('#finish').addEventListener('click',finishDialog);$('#close-dialog').addEventListener('click',closeDialog);
$('#dialog').addEventListener('click',e=>{if(e.target.id==='dialog')closeDialog();});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();createChat();}});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.chat){if(busy)return toast(L('Stop the current response first.','请先停止当前回复。'));state.active=b.dataset.chat;save();render();closeSidebar();bottom();}
 if(b.dataset.prompt&&!busy)send(b.dataset.prompt);
 if(b.dataset.stage){closeDialog();send(L('Please discuss this step: '+stageName(b.dataset.stage),'请进行这一步分析：'+stageName(b.dataset.stage)));}
 if(b.id==='run-all'){closeDialog();send(L('Run the full workflow.','运行完整流程。'));}
 if(b.dataset.dataTab){dataTab=b.dataset.dataTab;dataDialog();}
 if(b.id==='data-prev'){dataPage=Math.max(0,dataPage-1);renderDataContent();}
 if(b.id==='data-next'){dataPage++;renderDataContent();}
 if(b.dataset.note)noteDialog(b.dataset.note,b.dataset.message,b.dataset.return||'chat');
 if(b.dataset.markMessage)messagePicker(b.dataset.markMessage);
 if(b.dataset.copy)copyMessage(b.dataset.copy);
 if(b.dataset.why&&!busy)send(L('Explain the assumptions for '+stageName(b.dataset.why)+'.','请解释'+stageName(b.dataset.why)+'所做的假设。'));
 if(b.id==='return-to-chat')closeDialog();
 if(['export-review','export-notes'].includes(b.id))exportChat();
 if(b.id==='print-review')window.print();
 if(b.id==='new-after-review'){closeDialog();createChat();}
 if(b.id==='remove-note'){const back=noteTarget.returnTo;delete active().quizResponses[noteTarget.id];save();closeDialog();render();if(back==='finish')finishDialog();else if(back==='notes')notesDialog();}
 if(b.id==='open-score-summary')finishDialog();
 if(b.id==='cancel-report'){const back=noteTarget?.returnTo;closeDialog();if(back==='finish')finishDialog();else if(back==='notes')notesDialog();}
 if(b.id==='complete-missing'){const seen=new Set(unitsFor(active()).map(u=>u.stage)),missing=E.STAGES.filter(s=>!seen.has(s.id)).map(s=>s.id);closeDialog();send('Complete the remaining analysis steps.',missing);}
 if(b.id==='export-score-csv')exportScoreCSV();
});
$('#dialog-body').addEventListener('submit',e=>{
 e.preventDefault();if(e.target.id==='finish-form')return submitReview();
 if(e.target.id==='note-form'){
  const c=active(),target=noteTarget,u=findUnit(target.id,target.messageId),q=A.questions(u,c.profile.seed);
  const r={version:A.VERSION,diagnosisChoice:$('#note-form input[name="diagnosisChoice"]:checked')?.value,actionChoice:$('#note-form input[name="actionChoice"]:checked')?.value};
  if(!A.answered(u,r,c.profile.seed)){$('#note-error').innerHTML='<p class="error-text">Select one answer for each question before saving.</p>';return;}
  c.quizResponses[u.id]={...r,unitId:u.id,messageId:target.messageId,diagnosisText:A.chosen(q.diagnosis,r.diagnosisChoice).text,actionText:A.chosen(q.action,r.actionChoice).text,time:new Date().toISOString()};
  save();closeDialog();render();
  if(target.returnTo==='finish')finishDialog();else if(target.returnTo==='notes')notesDialog();else toast('Error report saved. The key remains hidden until final submission.');
 }
});
$('#dialog-body').addEventListener('change',e=>{
 if(e.target.dataset.transfer&&!active()?.review){active().transferChoices[e.target.dataset.transfer]=e.target.value;save();}
});
$('#messages').addEventListener('click',e=>{const im=e.target.closest('[data-image]');if(im){const f=D.figures.find(x=>x.id===im.dataset.image);openDialog(f.title,`<img class="image-large" src="${f.path}" alt="${esc(f.alt)}"><p class="small-print">${esc(f.alt)}</p>`);}});
normalizeStoredConversations();
initializeAssessment();
render();
save();
})();
