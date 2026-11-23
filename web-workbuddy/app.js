/* ===== 百业战战术板 · 交互逻辑 ===== */
'use strict';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* ---------- 默认流派库（常驻；实际库存于 state.schools，可自定义）
   cat: official=游戏固定流派(11) / pvp=PVP邪修混搭打法 / custom=用户自定义
   来源：官方武学→流派对应 + 攻略交叉核对（详见 PRD 参考来源）。邪修为玩家俗称的跨流派混搭，非官方流派。 ---------- */
const DEFAULT_SCHOOLS = [
  // ===== 官方固定流派 11 个 =====
  { id:'qsy',   name:'牵丝·翊', short:'翊', weapon:'文动霓裳+杏游草野（舞绫鼓+扇）', role:'团队增伤', cat:'official', color:'#a375d1' },
  { id:'qsl',   name:'牵丝·霖', short:'霖', weapon:'明川药典+千香引魂蛊（扇+伞）', role:'治疗辅助', cat:'official', color:'#63c5a8' },
  { id:'qsy2',  name:'牵丝·玉', short:'玉', weapon:'青山执笔+九重春色（笔+伞）', role:'控制远程', cat:'official', color:'#709bcd' },
  { id:'mjhong',name:'鸣金·虹', short:'虹', weapon:'无名剑法+无名枪法（剑+枪）', role:'攻守兼备', cat:'official', color:'#d4b15e' },
  { id:'mjying',name:'鸣金·影', short:'影', weapon:'积矩九剑+九曲惊神枪（剑+枪）', role:'流血爆发', cat:'official', color:'#b873c9' },
  { id:'mjting',name:'鸣金·霆', short:'霆', weapon:'长枪系（新流派）',           role:'突进反击', cat:'official', color:'#d69d5c' },
  { id:'lswei', name:'裂石·威', short:'威', weapon:'嗟夫刀法+八方风雷枪（刀+枪）', role:'减伤承伤', cat:'official', color:'#ce8464' },
  { id:'lsjun', name:'裂石·钧', short:'钧', weapon:'斩雪刀法+十方破阵（唐刀+陌刀）', role:'连击控制', cat:'official', color:'#c3a065' },
  { id:'pzfeng',name:'破竹·风', short:'风', weapon:'泥犁三垢+栗子游尘（双刀+鞭绳）', role:'高速缠斗', cat:'official', color:'#d06858' },
  { id:'pzchen',name:'破竹·尘', short:'尘', weapon:'醉拳（拳甲）',               role:'近身续航', cat:'official', color:'#c5b163' },
  { id:'pzyuan',name:'破竹·鸢', short:'鸢', weapon:'天志垂象+千机索天（拳甲+鸢镖）', role:'闪避抓闪', cat:'official', color:'#73afc9' },
  { id:'pzzun', name:'破竹·樽', short:'樽', weapon:'悬身拳法+断水双诀（拳甲+双刀）', role:'酩酊爆发', cat:'official', color:'#6cc690' },
  // ===== PVP 邪修 / 混搭打法 6 个（玩家俗称，非官方流派）=====
  { id:'xs_sj',  name:'双剑(邪修)',   short:'双剑', weapon:'无名剑法+积矩九剑',       role:'拉扯爆发·轮椅', cat:'pvp', color:'#ce6499' },
  { id:'xs_srn', name:'绳镖奶(邪修)', short:'绳奶', weapon:'栗子游尘+扇（绳镖+奶）', role:'奶妈输出',     cat:'pvp', color:'#97c365' },
  { id:'xs_wjq', name:'无名九枪',     short:'九枪', weapon:'无名剑法+九曲惊神枪',     role:'远程剑气·连段', cat:'pvp', color:'#d49068' },
  { id:'xs_jtd', name:'手甲唐刀',     short:'唐刀', weapon:'拳甲+唐横刀',             role:'贴脸肉搏',     cat:'pvp', color:'#ce5a66' },
  { id:'xs_sq',  name:'双枪(邪修)',   short:'双枪', weapon:'九曲惊神枪+无名枪',       role:'蓄力爆发',     cat:'pvp', color:'#a95ec9' },
  { id:'xs_9j',  name:'九重九剑',     short:'九剑', weapon:'九重春色+积矩九剑',       role:'远近拉扯',     cat:'pvp', color:'#6380c5' },
];

/* 旧默认色 → 新亮色（v6 统一提亮；仅用于把仍停留在旧默认色的流派/队伍升级，不覆盖用户自选） */
const SCHOOL_COLOR_MIGRATION = {
  // 流派旧默认色
  '#7d5ba6':'#a375d1', '#5d9c86':'#63c5a8', '#5b86b0':'#709bcd', '#b08b3f':'#d4b15e',
  '#8f6ba0':'#b873c9', '#c08a3a':'#d69d5c', '#a8623c':'#ce8464', '#8a6b4a':'#c3a065',
  '#b5553f':'#d06858', '#9c6b3f':'#c5b163', '#6b8a9c':'#73afc9', '#a83b6a':'#ce6499',
  '#7a9c5a':'#97c365', '#b5733f':'#d49068', '#9c4a4a':'#ce5a66', '#8a5a9c':'#a95ec9',
  '#5a7a9c':'#6380c5',
  // 队伍旧默认色（含历次版本的建队色板）
  '#3f6b5c':'#5f9c88', '#a83b2f':'#d06858', '#5b7c96':'#709bcd',
  // 标点旧默认色
  '#b99a5b':'#d4b15e', '#7d8a3f':'#97c365',
};
const brightenColor = c => (c && SCHOOL_COLOR_MIGRATION[String(c).toLowerCase()]) || c;

const INTENTS = [
  { id:'stand',  label:'站位', icon:'立', color:'#5b7c96' },
  { id:'attack', label:'集火', icon:'⚔', color:'#a83b2f' },
  { id:'defend', label:'防守', icon:'盾', color:'#3f6b5c' },
  { id:'push',   label:'推进', icon:'➤', color:'#b99a5b' },
  { id:'steal',  label:'偷塔', icon:'袭', color:'#8f6ba0' },
  { id:'tree',   label:'搬树', icon:'树', color:'#7d8a3f' },
];

const PIN_TYPES = {
  text:   { label:'文字', icon:'文', color:'#d4b15e' },
  attack: { label:'集火', icon:'⚔', color:'#d06858' },
  defend: { label:'防守', icon:'盾', color:'#5f9c88' },
  route:  { label:'箭头', icon:'➤', color:'#d4b15e' },
  area:   { label:'区域', icon:'◯', color:'#709bcd' },
  monster:{ label:'野怪', icon:'怪', color:'#97c365' },
};

const SQUAD_COLORS = ['#5f9c88','#d06858','#709bcd','#d4b15e','#a375d1','#c3a065','#63c5a8','#ce6499','#8fb85f','#d49068','#73afc9','#b873c9'];
/* 队伍编辑弹窗可选的 10 种颜色 */
const SQUAD_PALETTE = SQUAD_COLORS.slice(0,10);

/* ---------- 状态 ---------- */
let state = null;
let currentStage = 'early';
let currentTool = 'select';
let selected = null;      // {kind:'fighter'|'pin', id} —— 选中对象（属性面板/高亮）
let selectedSquad = null; // 当前编队目标队伍 id（点流派库加人进此队）；null=默认第一队
let pendingPlace = null;  // 待布阵人物 id —— 点地图布阵一次后即清除，避免重复放置
let schoolFilter = 'official'; // 流派库分类筛选：official(PVE) / pvp(邪修)；自建流派归入 PVE 显示
let history = [], historyIdx = -1;
let builtinVisible = true;

/* 视图变换：地图坐标(0~1) → 屏幕像素。scale 缩放，ox/oy 屏幕平移像素 */
const view = { scale:1, ox:0, oy:0 };
const MIN_SCALE = 0.6, MAX_SCALE = 6;

/* ---------- 坐标换算 ---------- */
function applyView(){
  $('#mapWorld').style.transform = `translate(${view.ox}px,${view.oy}px) scale(${view.scale})`;
  $('#zoomVal').textContent = Math.round(view.scale*100)+'%';
  updateMinimapView();
}
// 地图归一化坐标 → 视口内像素
function mapToScreen(mx,my){
  const r=$('#mapViewport').getBoundingClientRect();
  return { x: mx*r.width*view.scale+view.ox, y: my*r.height*view.scale+view.oy };
}
// 视口内像素 → 地图归一化坐标
function screenToMap(sx,sy){
  const r=$('#mapViewport').getBoundingClientRect();
  return { x:(sx-view.ox)/(r.width*view.scale), y:(sy-view.oy)/(r.height*view.scale) };
}
// 以视口内某点(cx,cy)为中心缩放：缩放前后该点对应的地图坐标保持不变
function zoomAt(factor, cx, cy){
  const r=$('#mapViewport').getBoundingClientRect();
  const mx=(cx-view.ox)/(r.width*view.scale);   // 该点当前对应的地图坐标
  const my=(cy-view.oy)/(r.height*view.scale);
  const newScale=Math.max(MIN_SCALE,Math.min(MAX_SCALE,view.scale*factor));
  if(newScale===view.scale) return;
  view.scale=newScale;
  // 重新定位偏移，使 (mx,my) 仍落在 (cx,cy)
  view.ox=cx-mx*r.width*view.scale;
  view.oy=cy-my*r.height*view.scale;
  clampView(); applyView();
}
// 限制平移，避免地图被拖出视口太远
function clampView(){
  const w=$('#mapViewport').clientWidth, h=$('#mapViewport').clientHeight;
  const sw=w*view.scale, sh=h*view.scale;
  const margin=80;
  view.ox=Math.min(margin, Math.max(w-sw-margin, view.ox));
  view.oy=Math.min(margin, Math.max(h-sh-margin, view.oy));
}
function fitView(){
  view.scale=1; view.ox=0; view.oy=0; applyView();
}

/* 阶段：5 段（key 顺序即时间轴顺序）。early/mid/late 保持原名，老数据语义不变 */
const STAGE_ORDER = ['open','early','mid','late','final'];
const STAGES = { open:'开局', early:'前期', mid:'中期', late:'后期', final:'终局' };
/* 生成空 marks / 空 pins 结构 */
const emptyMarks = () => STAGE_ORDER.reduce((o,k)=>(o[k]=null,o),{});
const emptyPins  = () => STAGE_ORDER.reduce((o,k)=>(o[k]=[],o),{});

/* ---------- 初始数据（种子战术） ---------- */
function seedState(){
  const f = (id,name,schoolId,squadId,placed) => ({id, customName:name, schoolId, squadId,
    marks:{ ...emptyMarks(), early: placed }, note:''});
  return {
    version: 4,
    schools: DEFAULT_SCHOOLS.map(s=>({...s})),   // 流派库副本（可增删改）
    hiddenSchools: [],                          // 用户主动删除的常驻流派 id（防止版本更新又被补回）
    map: null,                                   // 自定义底图 {name,dataUrl}；null=默认原图
    side: 'red',                                 // 我方阵营颜色 'red'|'blue'（每局随机，可切换）
    schemes: [{
      id:'sch1', name:'防守反击 · 守野区', updatedAt: Date.now(),
      squads:[
        {id:'sq1', name:'防守队', color:'#5f9c88', collapsed:false},
        {id:'sq2', name:'机动队', color:'#d06858', collapsed:false},
        {id:'sq3', name:'指挥组', color:'#d4b15e', collapsed:false},
      ],
      fighters:[
        // 防守队（sq1，守我方一侧：左侧复活点起，守上半场/围场/下半场与野区）
        f('f1','翊翊1号','qsy','sq1',{x:0.34,y:0.50,intent:'defend'}),   // 围场中部
        f('f2','翊翊2号','qsy','sq1',{x:0.34,y:0.36,intent:'defend'}),   // 上半场
        f('f3','明川1号','qsl','sq1',{x:0.32,y:0.66,intent:'stand'}),    // 我方下野区
        f('f4','双剑1号','pzfeng','sq2',{x:0.72,y:0.68,intent:'steal'}), // 敌下半场（偷塔）
        f('f5','双剑2号','pzfeng','sq2',null),
        f('f6','八方1号','lswei','sq1',{x:0.34,y:0.64,intent:'defend'}), // 下半场
        f('f7','总指挥','mjhong','sq3',{x:0.16,y:0.51,intent:'stand'}),  // 我方复活点(左 0.166)
      ],
      pins:{
        open:[],
        early:[
          {id:'p1',type:'area',label:'我方围场防守圈',x:0.36,y:0.50,note:'两人游走互补，勿压上线'},
          {id:'p2',type:'defend',label:'守中路关隘',x:0.42,y:0.46,note:''},
        ],
        mid:[
          {id:'p3',type:'attack',label:'集火上半场',x:0.70,y:0.36,note:'等首领刷新后开'},
          {id:'p4',type:'route',label:'偷塔路线',x:0.52,y:0.70,note:'双刀绕下路野区',angle:118},
          {id:'p7',type:'monster',label:'野区怪·上',x:0.43,y:0.44,note:'上半场野怪/首领点，留意刷新'},
          {id:'p8',type:'monster',label:'野区怪·下',x:0.43,y:0.62,note:'下半场野怪/首领点，留意刷新'},
        ],
        late:[
          {id:'p5',type:'attack',label:'集火敌方鹅',x:0.809,y:0.51,note:'首领BUFF后强开(敌方复活点)'},
          {id:'p6',type:'route',label:'搬树回城',x:0.50,y:0.50,note:'过中场，双人护送',angle:198},
        ],
        final:[],
      }
    }],
    currentSchemeId:'sch1'
  };
}

/* ---------- 标准阵容模板（新建方案时自动带入的「固定三队 + 固定人」） ---------- */
const STD_SQUADS = [
  { name:'防守队', color:'#5f9c88' },   // 守自家野区与塔
  { name:'进攻队', color:'#d06858' },   // 绕后偷塔、推进
  { name:'指挥组', color:'#d4b15e' },   // 指挥位（战场货币）
];
/* sq: 索引对应 STD_SQUADS；mark: 开局阶段的预置站位（null = 待布阵） */
const STD_FIGHTERS = [
  { name:'翊翊1号',  school:'qsy',    sq:0, mark:{x:0.34,y:0.50,intent:'defend'} },  // 围场中部
  { name:'翊翊2号',  school:'qsy',    sq:0, mark:{x:0.34,y:0.36,intent:'defend'} },  // 上半场
  { name:'明川1号',  school:'qsl',    sq:0, mark:{x:0.32,y:0.66,intent:'stand'}  },  // 我方下野区
  { name:'八方1号',  school:'lswei',  sq:0, mark:{x:0.34,y:0.64,intent:'defend'} },  // 下半场
  { name:'双剑1号',  school:'pzfeng', sq:1, mark:{x:0.72,y:0.68,intent:'steal'}  },  // 敌下半场（偷塔）
  { name:'双剑2号',  school:'pzfeng', sq:1, mark:null },                             // 待布阵
  { name:'总指挥',   school:'mjhong', sq:2, mark:{x:0.16,y:0.51,intent:'stand'}  },  // 我方复活点
];

/* 生成一套全新的标准阵容（每次都是新的 id，互不干扰） */
function buildStandardOrg(){
  const squads = STD_SQUADS.map(s=>({id:uid('sq'), name:s.name, color:s.color, collapsed:false}));
  const has = new Set(state.schools.map(s=>s.id));
  const fighters = STD_FIGHTERS.filter(t=>has.has(t.school)).map(t=>({
    id:uid('f'),
    customName:t.name,
    schoolId:t.school,
    squadId:squads[t.sq].id,
    marks:{ ...emptyMarks(), early: t.mark?{...t.mark}:null },
    note:'',
  }));
  return { squads, fighters };
}

/* ---------- 存取（localStorage；结构兼容 IndexedDB 迁移） ---------- */
const STORE_KEY = 'byz_tactics_v5';
function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){ const d = JSON.parse(raw); if(d && d.schemes && d.schemes.length){
      if(!Array.isArray(d.schools)||!d.schools.length) d.schools=DEFAULT_SCHOOLS.map(s=>({...s}));
      // 增量补充常驻流派（版本更新新增的），但跳过用户主动删除的
      if(!Array.isArray(d.hiddenSchools)) d.hiddenSchools=[];
      const have=new Set(d.schools.map(s=>s.id));
      DEFAULT_SCHOOLS.forEach(s=>{
        if(!have.has(s.id) && !d.hiddenSchools.includes(s.id)) d.schools.push({...s});
      });
      if(!('map' in d)) d.map=null;
      if(!d.side) d.side='red';
      // 颜色提亮迁移：仍停留在旧默认色的流派/队伍/标点升级为新亮色（用户自选的颜色不动）
      d.schools.forEach(s=>{ s.color = brightenColor(s.color); });
      (d.schemes||[]).forEach(sc=>{
        (sc.squads||[]).forEach(sq=>{ sq.color = brightenColor(sq.color); });
        // 阶段扩容迁移：补齐缺失的阶段（老存档只有 early/mid/late），已有数据不动
        if(!sc.pins) sc.pins = emptyPins();
        STAGE_ORDER.forEach(st=>{ if(!Array.isArray(sc.pins[st])) sc.pins[st]=[]; });
        (sc.fighters||[]).forEach(f=>{
          if(!f.marks) f.marks = emptyMarks();
          STAGE_ORDER.forEach(st=>{ if(!(st in f.marks)) f.marks[st]=null; });
        });
        STAGE_ORDER.forEach(st=>{
          (sc.pins[st]||[]).forEach(p=>{ if(p.color) p.color = brightenColor(p.color); });
        });
      });
      return d;
    } }
  }catch(e){ console.warn('读取本地数据失败',e); }
  return seedState();
}
function save(silent){
  try{
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    setSaveState(false);
    if(!silent) toast('已保存到本地');
  }catch(e){ setSaveState(true,true); toast('保存失败：存储空间不足','error'); }
}
function setSaveState(saving, fail){
  const el = $('#saveState');
  if(fail){ el.textContent='● 保存失败'; el.style.color='var(--cinnabar)'; }
  else if(saving){ el.textContent='● 保存中…'; el.style.color='var(--gold)'; }
  else{ el.textContent='● 已保存'; el.style.color='var(--jade)'; }
}

/* ---------- 撤销 / 重做 ---------- */
function snapshot(){
  const snap = JSON.stringify(state);
  if(history[historyIdx] === snap) return;
  history = history.slice(0, historyIdx+1);
  history.push(snap);
  if(history.length>60) history.shift();
  historyIdx = history.length-1;
}
function undo(){
  if(historyIdx<=0){ toast('没有可撤销的操作'); return; }
  historyIdx--; state = JSON.parse(history[historyIdx]);
  renderAll(); save(true); toast('已撤销');
}
function redo(){
  if(historyIdx>=history.length-1){ toast('没有可重做的操作'); return; }
  historyIdx++; state = JSON.parse(history[historyIdx]);
  renderAll(); save(true); toast('已重做');
}

/* ---------- 派生 ---------- */
const scheme = () => state.schemes.find(s=>s.id===state.currentSchemeId) || state.schemes[0];
const allSchools = () => (state && Array.isArray(state.schools) && state.schools.length) ? state.schools : DEFAULT_SCHOOLS;
const schoolById = id => allSchools().find(s=>s.id===id) || allSchools()[0];
const intentById = id => INTENTS.find(i=>i.id===id) || INTENTS[0];
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

/* ---------- 渲染 ---------- */
function renderAll(){
  renderSchemeSelect();
  renderStageTabs();
  renderSide();
  refreshMapImage();
  renderSchools();
  renderSquads();
  renderMarks();
  renderProps();
  renderStatus();
}
/* 阶段切换条：按 STAGE_ORDER 动态生成，增删阶段只改数据 */
function renderStageTabs(){
  const box=$('#stageTabs'); if(!box) return;
  box.innerHTML = STAGE_ORDER.map((k,i)=>{
    const label=STAGES[k];
    return `<button class="stage-tab ${currentStage===k?'active':''}" data-stage="${k}"
      title="第 ${i+1} 阶段 · ${label}">${label.slice(0,1)}<span>${label.slice(1)}</span></button>`;
  }).join('');
}

function renderSchemeSelect(){
  const sel = $('#schemeSelect');
  sel.innerHTML = state.schemes.map(s=>`<option value="${s.id}" ${s.id===state.currentSchemeId?'selected':''}>${esc(s.name)}</option>`).join('');
}

const SCHOOL_CATS = [
  {id:'official', label:'PVE'},   // 游戏固定流派（含用户自建，自建归入此类）
  {id:'pvp',      label:'邪修'},  // PVP 混搭打法
];
// 流派归入哪个筛选类：custom 归入 PVE；其余按 cat
const catOf = s => s.cat==='pvp' ? 'pvp' : 'official';
function renderSchools(){
  const all=allSchools();
  // 筛选标签（两类实际数量）
  const counts={ official:all.filter(s=>catOf(s)==='official').length, pvp:all.filter(s=>catOf(s)==='pvp').length };
  const bar=$('#schoolFilterBar');
  if(bar) bar.innerHTML=SCHOOL_CATS.map(c=>
    `<button class="sch-filter ${schoolFilter===c.id?'active':''}" data-filter="${c.id}">${c.label}<i>${counts[c.id]}</i></button>`
  ).join('');
  // 列表：官方→自建→邪修 排序，再按筛选过滤
  const order={official:0,custom:1,pvp:2};
  const list=all.slice().sort((a,b)=>(order[a.cat||'custom']-order[b.cat||'custom']));
  const shown=list.filter(s=>catOf(s)===schoolFilter);
  $('#schoolGrid').innerHTML = shown.map(s=>{
    const cat=s.cat||'custom';
    const badge=cat==='pvp'?'<span class="school-cat pvp">邪修</span>':(cat==='custom'?'<span class="school-cat custom">自建</span>':'');
    return `<div class="school-item" data-school="${s.id}" title="${esc(s.name)} · ${esc(s.weapon||'')} · ${esc(s.role||'')}（点击添加，点 ✎ 编辑）">
      <span class="school-glyph" style="background:${s.color}">${esc(s.short)}</span>
      <span class="school-meta"><b>${esc(s.name)}</b><small>${badge}${esc(s.role||'自定义流派')}</small></span>
      <span class="school-edit" data-edit="${s.id}" title="编辑流派">✎</span>
    </div>`;
  }).join('') + `<div class="school-add" id="schoolAdd" data-cat="${schoolFilter==='pvp'?'pvp':'custom'}"
    title="${schoolFilter==='pvp'?'新增自定义邪修/PVP 流派':'新增自定义流派'}">＋ 自定义${schoolFilter==='pvp'?'邪修':''}</div>`;
}

function renderSquads(){
  const sc = scheme();
  $('#squads').innerHTML = sc.squads.map(sq=>{
    const members = sc.fighters.filter(f=>f.squadId===sq.id);
    const isTarget=selectedSquad===sq.id;
    return `<div class="squad ${sq.collapsed?'collapsed':''} ${isTarget?'target':''} ${sq.hidden?'is-hidden':''}" data-squad="${sq.id}" style="--sq-c:${sq.color}">
      <div class="squad-head" data-select-squad="${sq.id}" title="点击选中此队伍（设为编队目标，新加的人进此队）">
        <span class="squad-radio ${isTarget?'on':''}" aria-hidden="true">${isTarget?'◉':'◎'}</span>
        <span class="squad-color" style="background:${sq.color}"></span>
        <span class="squad-name">${esc(sq.name)}</span>
        ${isTarget?'<span class="target-badge">目标</span>':''}
        ${sq.hidden?'<span class="hidden-tag">已隐藏</span>':''}
        <span class="squad-count">${members.length} 人</span>
        <span class="squad-tools">
          <button class="hide-btn ${sq.hidden?'on':''}" data-toggle-hide="${sq.id}"
                  title="${sq.hidden?'点击在地图上显示该队标点':'隐藏该队在地图上的标点'}">${sq.hidden?'显':'隐'}</button>
          <button data-rename-squad="${sq.id}" title="改名">✎</button>
          <button data-del-squad="${sq.id}" title="删队">✕</button>
          <button class="fold-btn" data-toggle="${sq.id}" title="${sq.collapsed?'展开队伍':'折叠队伍'}">${sq.collapsed?'▸':'▾'}</button>
        </span>
      </div>
      <div class="squad-body">
        ${members.length ? members.map(f=>{
          const sch = schoolById(f.schoolId);
          const placed = f.marks[currentStage];
          const curSq = sc.squads.find(s=>s.id===f.squadId);
          return `<div class="fighter ${selected&&selected.kind==='fighter'&&selected.id===f.id?'selected':''} ${pendingPlace===f.id?'pending':''} ${placed?'placed':''}"
                      draggable="true" data-fighter="${f.id}">
            <span class="fighter-avatar" style="background:${sch.color}">${sch.short}${placed?'<i class="placed-dot" title="本阶段已布阵"></i>':''}</span>
            <span class="fighter-info"><b>${esc(f.customName)}</b><small>${sch.name} · ${sch.role}</small></span>
            ${pendingPlace===f.id?'<span class="pending-tag">待放</span>':''}
            <span class="place-tag ${placed?'on':''}" title="${placed?'本阶段已布阵到地图':'本阶段未布阵'}">${placed?'阵':'—'}</span>
            <span class="fighter-btns">
              <button class="fighter-squad-btn" data-squad-switch="${f.id}" title="切换队伍（当前：${esc(curSq?curSq.name:'未编队')}）"
                      style="color:${curSq?curSq.color:'var(--paper-faint)'}">⇄</button>
              <button class="fighter-del-btn" data-del-fighter="${f.id}" title="删除此人物">✕</button>
            </span>
          </div>`;
        }).join('') : '<div class="empty-squad">设为目标后点流派库加人</div>'}
      </div>
    </div>`;
  }).join('');
}

/* 布阵前：若该人物所属队伍被隐藏，自动恢复显示，避免"放下了却看不见" */
function autoShowSquadOf(f){
  const sq=scheme().squads.find(s=>s.id===f.squadId);
  if(sq && sq.hidden){ sq.hidden=false; return sq.name; }
  return null;
}

function renderMarks(){
  const sc = scheme(), layer = $('#markLayer');
  let html = '';
  // 人物标点（颜色统一取流派色，与左侧人物卡头像一致）
  sc.fighters.forEach(f=>{
    const m = f.marks[currentStage];
    if(!m) return;
    const sch = schoolById(f.schoolId), it = intentById(m.intent);
    const sq = sc.squads.find(s=>s.id===f.squadId);
    if(sq && sq.hidden) return;   // 该队被隐藏 → 地图不显示其标点
    const isSel = selected&&selected.kind==='fighter'&&selected.id===f.id;
    // 属于左侧当前选中的队伍 → 加队伍色光圈
    const onTeam = !!(sq && selectedSquad===sq.id);
    html += `<div class="mark mark-fighter ${isSel?'sel':''} ${onTeam?'on-team':''}" data-kind="fighter" data-id="${f.id}"
                  style="left:${(m.x*100).toFixed(2)}%;top:${(m.y*100).toFixed(2)}%${onTeam?`;--ring:${sq.color};--ring-soft:${sq.color}59`:''}">
      <div class="marker-halo"></div>
      ${onTeam?'<div class="team-ring"></div>':''}
      <div class="marker-token ${isSel?'sel':''}"
           style="background:${sch.color}">${sch.short}</div>
      <div class="marker-label">${esc(f.customName)} · ${it.label}</div>
    </div>`;
  });
  // 自定义标点
  (sc.pins[currentStage]||[]).forEach(p=>{
    const t = PIN_TYPES[p.type]||PIN_TYPES.text;
    // 颜色优先取标点自身 color（属性面板可改），回退到类型默认色
    const c = p.color || t.color;
    const isSel = !!(selected&&selected.kind==='pin'&&selected.id===p.id);
    // 箭头标点：可任意方向（angle 为角度，0°=向右，顺时针为正）
    const ang = Number(p.angle)||0;
    const shape = p.type==='area'
      ? `<div class="pin-icon pin-area ${isSel?'sel':''}" style="background:transparent;border:2px dashed ${c};color:${c};width:64px;height:64px;font-size:0"></div>`
      : p.type==='route'
      ? `<div class="pin-arrow-box ${isSel?'sel':''}">
           <div class="pin-arrow ${isSel?'sel':''}" style="--pc:${c};transform:rotate(${ang}deg)" data-angle="${ang}">
             <span class="arrow-shaft"></span><span class="arrow-head"></span>
             <span class="rot-handle" data-rot="${p.id}" title="拖动旋转箭头方向（按住 Shift 吸附 15°）"></span>
           </div>
         </div>`
      : `<div class="pin-icon ${isSel?'sel':''}" style="background:${c}">${t.icon}</div>`;
    html += `<div class="mark mark-pin" data-kind="pin" data-id="${p.id}"
                style="left:${(p.x*100).toFixed(2)}%;top:${(p.y*100).toFixed(2)}%">
      ${shape}
      ${p.label?`<div class="marker-label">${esc(p.label)}</div>`:''}
    </div>`;
  });
  layer.innerHTML = html;
  // 只在真正需要时改透明度，避免每次渲染都触发整层重绘
  const opacity = builtinVisible ? '1' : '0.25';
  const canvasEl = $('#mapCanvas');
  if(canvasEl.style.opacity !== opacity) canvasEl.style.opacity = opacity;
}

function renderProps(){
  const box = $('#propContent');
  if(!selected){ box.innerHTML = `<div class="prop-empty"><span class="glyph">⌖</span>选择人物或标点以编辑属性<br>拖动人物到地图即可布阵</div>`; return; }
  const sc = scheme();

  if(selected.kind==='fighter'){
    const f = sc.fighters.find(x=>x.id===selected.id);
    if(!f){ selected=null; return renderProps(); }
    const sch = schoolById(f.schoolId), m = f.marks[currentStage];
    box.innerHTML = `
      <div class="prop-title">人物属性<span class="prop-badge" style="background:${sch.color}">${sch.name}</span></div>
      <div class="field"><label>自定义名称</label><input id="pName" value="${esc(f.customName)}" placeholder="如：翊翊1号"></div>
      <div class="field"><label>流派（可随意搭配）</label>
        <select id="pSchool">${allSchools().map(s=>`<option value="${s.id}" ${s.id===f.schoolId?'selected':''}>${esc(s.name)} · ${esc(s.role||'')}</option>`).join('')}</select>
      </div>
      <div class="field"><label>所属队伍</label>
        <select id="pSquad">${sc.squads.map(s=>`<option value="${s.id}" ${s.id===f.squadId?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
      </div>
      <div class="field"><label>本阶段意图</label>
        <div class="intent-grid">${INTENTS.map(i=>`<button class="intent-btn ${m&&m.intent===i.id?'sel':''}" data-intent="${i.id}">${i.icon} ${i.label}</button>`).join('')}</div>
      </div>
      <div class="field"><label>备注</label><textarea id="pNote" placeholder="职责、注意事项…">${esc(f.note||'')}</textarea></div>
      <div class="prop-actions">
        <button class="btn" id="btnUnplace">撤下地图</button>
        <button class="btn btn-primary" id="btnDelFighter">删除人物</button>
      </div>`;
    bindFighterProps(f);
  } else {
    const p = (sc.pins[currentStage]||[]).find(x=>x.id===selected.id);
    if(!p){ selected=null; return renderProps(); }
    const t = PIN_TYPES[p.type]||PIN_TYPES.text;
    const curColor = p.color || t.color;
    const isRoute = p.type==='route';
    const ang = ((Math.round(Number(p.angle)||0)%360)+360)%360;
    box.innerHTML = `
      <div class="prop-title">标点属性<span class="prop-badge" style="background:${curColor}">${t.label}</span></div>
      <div class="field"><label>标注名称</label><input id="pLabel" value="${esc(p.label)}" placeholder="如：集火上路塔"></div>
      ${isRoute?`
      <div class="field">
        <label>箭头方向 <b id="pAngleVal">${ang}°</b></label>
        <div class="angle-presets" id="pAnglePresets">
          ${[['↖',225],['↑',270],['↗',315],['←',180],['•',null],['→',0],['↙',135],['↓',90],['↘',45]].map(([g,a])=>
            a===null?`<span class="angle-center" title="当前方向">${ang}°</span>`
            :`<button data-ang="${a}" class="${ang===a?'on':''}" title="${a}°">${g}</button>`).join('')}
        </div>
        <input type="range" id="pAngle" class="angle-range" min="0" max="359" step="1" value="${ang}">
        <div class="angle-hint">也可直接在地图上选中箭头，拖动末端金色圆点<b>任意旋转</b>（按住 Shift 吸附 15°）；键盘 ← → 可 5° 微调。</div>
      </div>`:''}
      <div class="field"><label>备注</label><textarea id="pNote" placeholder="战术说明…">${esc(p.note||'')}</textarea></div>
      <div class="field"><label>标记颜色（${SCHOOL_COLORS.length} 色可选）</label>
        <div class="color-row">${SCHOOL_COLORS.map(c=>
          `<span class="color-opt ${String(curColor).toLowerCase()===c?'sel':''}" data-color="${c}" style="background:${c}" title="${c}"></span>`).join('')}</div>
      </div>
      <div class="prop-actions"><button class="btn btn-primary" id="btnDelPin">删除标点</button></div>`;
    bindPinProps(p);
  }
}

/* 图例：我方阵营颜色可切换（游戏每局随机分配红/蓝） */
const SIDE_COLOR={ red:'#a83232', blue:'#2f6b9f' };
function renderSide(){
  const my=state.side==='blue'?'blue':'red';
  const foe=my==='red'?'blue':'red';
  $('#legendMy').textContent='我方('+(my==='red'?'红':'蓝')+')';
  $('#legendFoe').textContent='敌方('+(foe==='red'?'红':'蓝')+')';
  $('#sideToggle .dot.my').style.background=SIDE_COLOR[my];
  $('#sideToggle .dot.foe').style.background=SIDE_COLOR[foe];
}

function renderStatus(){
  const sc = scheme();
  const pinCount = Object.values(sc.pins).reduce((a,b)=>a+b.length,0);
  $('#stScheme').textContent = '方案：'+sc.name;
  $('#stStage').textContent = '阶段：'+STAGES[currentStage];
  $('#stCount').textContent = `人物 ${sc.fighters.length} · 标点 ${pinCount}`;
}

/* ---------- 属性面板事件 ---------- */
function bindFighterProps(f){
  $('#pName').oninput = e=>{ f.customName=e.target.value; commitSoft(); };
  $('#pSchool').onchange = e=>{ f.schoolId=e.target.value; commit(); };
  $('#pSquad').onchange = e=>{ f.squadId=e.target.value; commit(); };
  $('#pNote').oninput = e=>{ f.note=e.target.value; commitSoft(); };
  $$('.intent-btn').forEach(b=>b.onclick=()=>{
    const m=f.marks[currentStage]||{x:0.5,y:0.5};
    m.intent=b.dataset.intent; f.marks[currentStage]=m;
    commit(); toast('已设为「'+intentById(m.intent).label+'」');
  });
  $('#btnUnplace').onclick = ()=>{ f.marks[currentStage]=null; commit(); };
  $('#btnDelFighter').onclick = ()=>{
    confirmModal('删除人物','确定删除「'+f.customName+'」？其所有阶段标点将一并移除。',()=>{
      const i=scheme().fighters.indexOf(f); scheme().fighters.splice(i,1);
      selected=null; if(pendingPlace===f.id) pendingPlace=null; commit(); toast('已删除人物');
    });
  };
}
function bindPinProps(p){
  $('#pLabel').oninput = e=>{ p.label=e.target.value; commitSoft(); };
  $('#pNote').oninput = e=>{ p.note=e.target.value; commitSoft(); };
  // 箭头方向：滑杆即时预览，八向快捷
  const angIn=$('#pAngle');
  if(angIn){
    const norm=a=>((Math.round(a)%360)+360)%360;
    const apply=a=>{
      p.angle=norm(a);
      $('#pAngleVal').textContent=p.angle+'°';
      const center=document.querySelector('#pAnglePresets .angle-center');
      if(center) center.textContent=p.angle+'°';
      $$('#pAnglePresets button').forEach(b=>b.classList.toggle('on',Number(b.dataset.ang)===p.angle));
      if(angIn.value!==String(p.angle)) angIn.value=p.angle;
      renderMarks();
    };
    angIn.oninput = ()=>apply(Number(angIn.value));
    angIn.onchange = ()=>{ apply(Number(angIn.value)); commit(); };
    $$('#pAnglePresets button').forEach(b=>b.onclick=()=>{ apply(Number(b.dataset.ang)); commit(); toast('箭头方向 '+p.angle+'°'); });
  }
  // 限定在属性面板内，避免与流派编辑弹窗的色块串绑
  $$('#propContent .color-opt').forEach(o=>o.onclick=()=>{ p.color=o.dataset.color; commit(); });
  $('#btnDelPin').onclick = ()=>{
    const arr=scheme().pins[currentStage]; arr.splice(arr.indexOf(p),1);
    selected=null; commit(); toast('已删除标点');
  };
}
function commit(){ snapshot(); renderAll(); save(true); }
function commitSoft(){ renderMarks(); renderSquads(); renderStatus(); debounceSave(); }
let saveTimer=null;
function debounceSave(){ setSaveState(true); clearTimeout(saveTimer); saveTimer=setTimeout(()=>save(true),500); }

/* ---------- 地图标点 / 视图交互 ---------- */
function setupMap(){
  const vp = $('#mapViewport');
  const screenPos = e=>{ const r=vp.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; };

  // 状态栏坐标（换算回地图坐标）
  vp.addEventListener('mousemove', e=>{
    const p=screenPos(e), m=screenToMap(p.x,p.y);
    $('#stCoord').textContent=`坐标：${m.x.toFixed(2)}, ${m.y.toFixed(2)}`;
  });

  // 滚轮缩放（以光标为中心）
  vp.addEventListener('wheel', e=>{
    e.preventDefault();
    const p=screenPos(e);
    zoomAt(e.deltaY<0?1.12:1/1.12, p.x, p.y);
  }, {passive:false});

  // 地图点击：select 工具 + 左侧选中人物 → 直接布阵；否则放置标点
  vp.addEventListener('click', e=>{
    if(['select','pan','zoom'].includes(currentTool)){
      // 仅 select 工具、且有「待布阵」人物时，点击空白处布阵（放一次即退出待布阵）
      if(currentTool!=='select'||!pendingPlace) return;
      if(e.target.closest('.mark')||e.target.closest('.minimap')) return;
      const p=screenPos(e), m=screenToMap(p.x,p.y);
      if(m.x<0||m.x>1||m.y<0||m.y>1) return;
      const f=scheme().fighters.find(x=>x.id===pendingPlace); if(!f) return;
      const x=Math.max(0,Math.min(1,m.x)), y=Math.max(0,Math.min(1,m.y));
      f.marks[currentStage]={x,y,intent:f.marks[currentStage]?.intent||'stand'};
      const unhid=autoShowSquadOf(f);
      pendingPlace=null;                       // 放完即退出待布阵，避免重复放置
      selected={kind:'fighter',id:f.id};       // 保留选中，方便继续改属性
      commit(); refreshHint(); renderSquads();
      toast(`${f.customName} 已布阵${unhid?` · 已自动显示「${unhid}」`:''} · 再点人物可重新布置`);
      return;
    }
    if(e.target.closest('.mark')||e.target.closest('.minimap')) return;
    const p=screenPos(e), m=screenToMap(p.x,p.y);
    if(m.x<0||m.x>1||m.y<0||m.y>1) return;
    const sc=scheme();
    sc.pins[currentStage]=sc.pins[currentStage]||[];
    const t=PIN_TYPES[currentTool];
    const pin={id:uid('p'),type:currentTool,label:t.label,x:m.x,y:m.y,note:'',color:t.color};
    if(currentTool==='route') pin.angle=0;   // 箭头默认向右，选中后拖手柄可任意方向
    sc.pins[currentStage].push(pin);
    selected={kind:'pin',id:pin.id};
    commit(); toast('已放置「'+t.label+'」标点');
  });

  let dragMark=null, panning=null, selecting=null, rotDrag=null;
  vp.addEventListener('mousedown', e=>{
    const p=screenPos(e);
    // 小地图不处理
    if(e.target.closest('.minimap')) return;
    // 箭头旋转手柄（必须在标点拖动之前判断）
    const rotEl=e.target.closest('[data-rot]');
    if(rotEl){
      const mark=rotEl.closest('.mark');
      const arrow=mark&&mark.querySelector('.pin-arrow');
      if(arrow){
        selected={kind:'pin',id:rotEl.dataset.rot};
        renderSquads(); renderProps();
        rotDrag={mark,arrow,id:rotEl.dataset.rot,angle:Number(arrow.dataset.angle)||0,moved:false};
        arrow.classList.add('rotating');
        arrow.parentElement?.classList.add('rotating');
      }
      e.preventDefault(); e.stopPropagation(); return;
    }
    // 标点拖动（任何工具下都可拖动已有标点）
    const el=e.target.closest('.mark');
    if(el){
      selected={kind:el.dataset.kind,id:el.dataset.id};
      dragMark=el;
      $$('.mark').forEach(n=>n.classList.remove('sel'));
      $$('.marker-token,.pin-icon,.pin-arrow').forEach(n=>n.classList.remove('sel'));
      $$('.pin-arrow-box').forEach(n=>n.classList.remove('sel'));
      el.classList.add('sel');
      const inner=el.querySelector('.marker-token,.pin-icon,.pin-arrow');
      if(inner){
        inner.classList.add('sel');
        // 箭头：外层容器也标 sel，保证旋转手柄压住下方文字标签
        if(inner.classList.contains('pin-arrow')&&inner.parentElement) inner.parentElement.classList.add('sel');
      }
      renderProps(); renderSquads();
      e.preventDefault(); return;
    }
    // 框选局部放大
    if(currentTool==='zoom' && e.button===0){
      selecting={x1:p.x,y1:p.y};
      const rect=$('#selectRect'); rect.hidden=false;
      Object.assign(rect.style,{left:p.x+'px',top:p.y+'px',width:'0',height:'0'});
      e.preventDefault(); return;
    }
    // 平移（pan 工具，或中键）
    if(currentTool==='pan'||e.button===1){
      panning={x:e.clientX,y:e.clientY,ox:view.ox,oy:view.oy};
      vp.classList.add('panning'); e.preventDefault();
    }
  });

  window.addEventListener('mousemove', e=>{
    // 拖动手柄旋转箭头
    if(rotDrag){
      const r=rotDrag.arrow.getBoundingClientRect();
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      let a=Math.atan2(e.clientY-cy, e.clientX-cx)*180/Math.PI;
      if(e.shiftKey) a=Math.round(a/15)*15;
      a=Math.round(a);
      rotDrag.angle=a;
      rotDrag.moved=true;
      rotDrag.arrow.style.transform=`rotate(${a}deg)`;
      rotDrag.arrow.dataset.angle=a;
      $('#stCoord').textContent=`箭头方向：${((a%360)+360)%360}°`;
      return;
    }
    // 拖动标点
    if(dragMark){
      const p=screenPos(e), m=screenToMap(p.x,p.y);
      const mx=Math.max(0,Math.min(1,m.x)), my=Math.max(0,Math.min(1,m.y));
      dragMark.style.left=(mx*100)+'%'; dragMark.style.top=(my*100)+'%';
    }
    // 平移
    if(panning){
      view.ox=panning.ox+(e.clientX-panning.x);
      view.oy=panning.oy+(e.clientY-panning.y);
      clampView(); applyView();
    }
    // 框选
    if(selecting){
      const p=screenPos(e);
      const rect=$('#selectRect');
      const x=Math.min(selecting.x1,p.x), y=Math.min(selecting.y1,p.y);
      const w=Math.abs(p.x-selecting.x1), h=Math.abs(p.y-selecting.y1);
      Object.assign(rect.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
    }
  });

  window.addEventListener('mouseup', e=>{
    // 结束箭头旋转
    if(rotDrag){
      const arrow=rotDrag.arrow, id=rotDrag.id, ang=rotDrag.angle, moved=rotDrag.moved;
      arrow.classList.remove('rotating');
      arrow.parentElement?.classList.remove('rotating');
      rotDrag=null;
      if(!moved){ renderMarks(); return; }        // 只点了一下手柄，不产生历史记录
      const sc=scheme();
      const pin=(sc.pins[currentStage]||[]).find(x=>x.id===id);
      if(pin) pin.angle=((Math.round(ang)%360)+360)%360;
      commit();
      return;
    }
    // 完成标点拖动
    if(dragMark){
      const {kind,id}=dragMark.dataset;
      const mx=parseFloat(dragMark.style.left)/100, my=parseFloat(dragMark.style.top)/100;
      const sc=scheme();
      if(kind==='fighter'){ const f=sc.fighters.find(x=>x.id===id); const m=f.marks[currentStage]||{intent:'stand'}; m.x=mx;m.y=my;f.marks[currentStage]=m; }
      else { const p=(sc.pins[currentStage]||[]).find(x=>x.id===id); p.x=mx;p.y=my; }
      dragMark=null; snapshot(); save(true);
    }
    // 结束平移
    if(panning){ panning=null; vp.classList.remove('panning'); }
    // 完成框选放大
    if(selecting){
      const p=screenPos(e);
      const w=Math.abs(p.x-selecting.x1), h=Math.abs(p.y-selecting.y1);
      const r=vp.getBoundingClientRect();
      if(w>24&&h>24){
        // 目标：把选区(x1,y1,w,h)放大到铺满视口
        const sx=r.width/w, sy=r.height/h;
        const ns=Math.max(MIN_SCALE,Math.min(MAX_SCALE,Math.min(sx,sy)));
        view.scale=ns;
        const x1=Math.min(selecting.x1,p.x), y1=Math.min(selecting.y1,p.y);
        view.ox=-x1*ns; view.oy=-y1*ns;
        clampView(); applyView(); toast('已放大局部，可精细部署');
      }
      selecting=null; $('#selectRect').hidden=true;
    }
  });

  // 双击标点：取消（pin 删除；人物标点=撤下地图）
  vp.addEventListener('dblclick', e=>{
    const el=e.target.closest('.mark'); if(!el) return;
    e.preventDefault(); e.stopPropagation();
    const {kind,id}=el.dataset, sc=scheme();
    if(kind==='fighter'){
      const f=sc.fighters.find(x=>x.id===id);
      if(f&&f.marks[currentStage]){ f.marks[currentStage]=null; if(pendingPlace===id) pendingPlace=null; commit(); toast(`已撤下 ${f.customName} 的本阶段布阵`); }
    }else{
      const pins=sc.pins[currentStage]||[];
      const idx=pins.findIndex(x=>x.id===id);
      if(idx>=0){ pins.splice(idx,1); if(selected&&selected.id===id) selected=null; commit(); toast('已取消标点'); }
    }
  });
}

/* ---------- 小地图 ---------- */
function initMinimap(){
  const mm=$('#minimap');
  // 小地图跟随主图底图（默认原图 / 用户自定义），天然对齐
  const msrc=(state.map&&state.map.dataUrl)?state.map.dataUrl:DEFAULT_MAP_SRC;
  mm.innerHTML=`<span class="minimap-label">全局</span><img class="minimap-img" src="${msrc}" alt="全局地图">`;
  const rect=$('#minimapView');
  function jump(e){
    const r=mm.getBoundingClientRect();
    const mx=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
    const my=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));
    view.ox=$('#mapViewport').clientWidth/2-mx*$('#mapViewport').clientWidth*view.scale;
    view.oy=$('#mapViewport').clientHeight/2-my*$('#mapViewport').clientHeight*view.scale;
    clampView(); applyView();
  }
  mm.addEventListener('mousedown', e=>{ jump(e);
    const move=ev=>jump(ev);
    const up=()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); };
    window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
  });
}
function updateMinimapView(){
  const mm=$('#minimap'), rect=$('#minimapView');
  if(!mm||!rect) return;
  const vw=$('#mapViewport').clientWidth, vh=$('#mapViewport').clientHeight;
  const mw=mm.clientWidth, mh=mm.clientHeight;
  // 当前视口对应的地图范围
  const mx1=-view.ox/(vw*view.scale), my1=-view.oy/(vh*view.scale);
  const mx2=(vw-view.ox)/(vw*view.scale), my2=(vh-view.oy)/(vh*view.scale);
  rect.style.left=(Math.max(0,mx1)*mw)+'px';
  rect.style.top=(Math.max(0,my1)*mh)+'px';
  rect.style.width=Math.min(1,Math.max(0,mx2-mx1))*mw+'px';
  rect.style.height=Math.min(1,Math.max(0,my2-my1))*mh+'px';
}

/* ---------- 地图底图自定义 ---------- */
function setupMapCustom(){
  $('#btnMapImage').onclick=()=>{
    const custom=!!(state.map&&state.map.dataUrl);
    $('#modal').innerHTML=`<h3>更换地图底图</h3>
      <p style="color:var(--paper-dim);font-size:12px;line-height:1.7;text-align:center;margin-bottom:16px">
        当前：${custom?esc(state.map.name||'自定义底图'):'游戏内实机原图（默认）'}<br>
        上传游戏截图或自制地图作为底图；标点坐标按百分比定位，换图后已布置的点仍在原位。</p>
      <div class="modal-actions" style="justify-content:center">
        <button class="btn btn-primary" id="miUpload">⇧ 上传图片</button>
        ${custom?`<button class="btn" id="miReset">恢复默认原图</button>`:''}
        <button class="btn" id="miCancel">取消</button>
      </div>`;
    $('#modalMask').hidden=false;
    $('#miCancel').onclick=closeModal;
    $('#miUpload').onclick=()=>{ closeModal(); $('#mapFileInput').click(); };
    if(custom) $('#miReset').onclick=()=>{
      state.map=null; closeModal(); refreshMapImage(); commit(); toast('已恢复默认原图');
    };
  };
  $('#mapFileInput').onchange=e=>{
    const file=e.target.files[0]; if(!file) return;
    if(!file.type.startsWith('image/')){ toast('请选择图片文件','error'); e.target.value=''; return; }
    const reader=new FileReader();
    reader.onload=()=>{
      // 压缩：最长边限制 2400px，JPEG 0.85，控制 localStorage 占用
      const img=new Image();
      img.onload=()=>{
        const MAX=2400; let {width:w,height:h}=img;
        if(Math.max(w,h)>MAX){ const r=MAX/Math.max(w,h); w=Math.round(w*r); h=Math.round(h*r); }
        const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
        cv.getContext('2d').drawImage(img,0,0,w,h);
        const dataUrl=cv.toDataURL('image/jpeg',0.85);
        state.map={ name:file.name, dataUrl };
        refreshMapImage(); commit(); toast('底图已更换：'+file.name);
      };
      img.onerror=()=>toast('图片解析失败','error');
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value='';
  };
  // 图例点击切换我方阵营颜色
  $('#sideToggle').onclick=()=>{
    state.side=state.side==='red'?'blue':'red';
    renderSide(); commit();
    toast('我方阵营已切换为'+(state.side==='red'?'红':'蓝')+'方');
  };
}
/* 换图后刷新主图 + 小地图（不重置视图） */
function refreshMapImage(){
  renderMapImage();
  const msrc=(state.map&&state.map.dataUrl)?state.map.dataUrl:DEFAULT_MAP_SRC;
  const mmImg=$('#minimap .minimap-img');
  // 同一个源就不要重复赋值，避免小地图跟着重新解码/重绘
  if(mmImg && mmImg.dataset.src!==msrc){
    mmImg.dataset.src=msrc;
    mmImg.src=msrc;
  }
}

/* ---------- 左侧：添加人物 + 流派库自定义 ---------- */
function setupSchools(){
  // 分类筛选
  $('#schoolFilterBar').addEventListener('click', e=>{
    const b=e.target.closest('[data-filter]'); if(!b) return;
    schoolFilter=b.dataset.filter;
    renderSchools();
  });
  $('#schoolGrid').addEventListener('click', e=>{
    // 编辑流派
    const editBtn=e.target.closest('[data-edit]');
    if(editBtn){
      e.stopPropagation();
      const s=state.schools.find(x=>x.id===editBtn.dataset.edit);
      if(s) schoolEditor(s);
      return;
    }
    // 新增流派（按当前筛选 tab 决定默认分类）
    const addBtn=e.target.closest('#schoolAdd');
    if(addBtn){ schoolEditor(null, addBtn.dataset.cat==='pvp'?'pvp':'custom'); return; }
    // 点击流派 → 添加人物（编入当前选中的目标队伍）
    const item=e.target.closest('.school-item'); if(!item) return;
    const sc=scheme(), sid=item.dataset.school, sch=schoolById(sid);
    const n=sc.fighters.filter(f=>f.schoolId===sid).length+1;
    // 目标队伍有效性校验：若目标已被删，回退到第一队
    const targetId = (selectedSquad && sc.squads.some(s=>s.id===selectedSquad)) ? selectedSquad : (sc.squads[0]?.id||null);
    const targetSq = sc.squads.find(s=>s.id===targetId);
    const f={id:uid('f'),customName:`${sch.short}${sch.short}${n}号`,schoolId:sid,
      squadId:targetId, marks:emptyMarks(),note:''};
    sc.fighters.push(f);
    selected={kind:'fighter',id:f.id}; pendingPlace=f.id;
    if(currentTool!=='select'){ currentTool='select'; $$('.tool[data-tool]').forEach(x=>x.classList.toggle('active',x.dataset.tool==='select')); $('#mapViewport').classList.remove('tool-pan','tool-zoom'); }
    commit(); refreshHint(); toast(`已添加 ${sch.name} → ${targetSq?targetSq.name:'未编队'} · 点地图放下`);
  });
}

/* 流派编辑弹窗：s=null 为新增 */
/* 标识颜色候选：20 色，色相均匀分布、明度统一抬高（56-64），保证深色地图上清晰可辨 */
const SCHOOL_COLORS=[
  '#a375d1','#63c5a8','#709bcd','#d4b15e','#b873c9',
  '#d69d5c','#ce8464','#c3a065','#d06858','#c5b163',
  '#73afc9','#ce6499','#97c365','#d49068','#ce5a66',
  '#a95ec9','#6380c5','#6cc690','#6abfc8','#cb72c2',
];
function schoolEditor(s, defaultCat){
  const isNew=!s;
  // 新增时默认挑一个尚未被占用的颜色，减少同色撞车
  const freeColor = SCHOOL_COLORS.find(c=>!state.schools.some(x=>String(x.color).toLowerCase()===c)) || SCHOOL_COLORS[0];
  const cur=s||{name:'',short:'',role:'',weapon:'',color:freeColor,cat:(defaultCat==='pvp'?'pvp':'custom')};
  const isOfficial=cur.cat==='official';
  let pickedCat = cur.cat==='pvp' ? 'pvp' : 'custom';
  $('#modal').innerHTML=`<h3>${isNew?'新增':'编辑'}流派</h3>
    <div class="field"><label>流派名称</label><input id="sName" value="${esc(cur.name)}" placeholder="如：牵丝·翊 / 太白剑派"></div>
    <div class="field-grid2">
      <div class="field"><label>简称（头像字，1-2字）</label><input id="sShort" value="${esc(cur.short)}" maxlength="2" placeholder="如：翊"></div>
      <div class="field"><label>定位</label><input id="sRole" value="${esc(cur.role||'')}" placeholder="如：团队增伤"></div>
    </div>
    <div class="field"><label>武器 / 备注</label><input id="sWeapon" value="${esc(cur.weapon||'')}" placeholder="如：舞绫鼓+扇"></div>
    ${isOfficial
      ? `<div class="field"><label>分类</label><div class="cat-static">官方常驻流派</div></div>`
      : `<div class="field"><label>分类（决定归入哪个筛选页）</label>
          <div class="school-filter-bar" id="sCatBar">
            <button class="sch-filter ${pickedCat==='custom'?'active':''}" data-scat="custom">PVE 流派</button>
            <button class="sch-filter ${pickedCat==='pvp'?'active':''}" data-scat="pvp">邪修 / PVP</button>
          </div>
        </div>`}
    <div class="field"><label>标识颜色</label>
      <div class="color-row" id="sColorRow">${SCHOOL_COLORS.map(c=>`<span class="color-opt ${c===cur.color?'sel':''}" data-color="${c}" style="background:${c}"></span>`).join('')}</div>
    </div>
    <div class="modal-actions">
      ${isNew?'':`<button class="btn danger-text" id="sDelete">删除</button>`}
      <span class="grow"></span>
      <button class="btn" id="sCancel">取消</button>
      <button class="btn btn-primary" id="sSave">${isNew?'新增':'保存'}</button>
    </div>`;
  $('#modalMask').hidden=false;
  let pickedColor=cur.color;
  $$('#sColorRow .color-opt').forEach(o=>o.onclick=()=>{
    $$('#sColorRow .color-opt').forEach(x=>x.classList.remove('sel'));
    o.classList.add('sel'); pickedColor=o.dataset.color;
  });
  if($('#sCatBar')) $('#sCatBar').onclick=e=>{
    const b=e.target.closest('[data-scat]'); if(!b) return;
    $$('#sCatBar .sch-filter').forEach(x=>x.classList.toggle('active',x===b));
    pickedCat=b.dataset.scat;
  };
  $('#sCancel').onclick=closeModal;
  if(!isNew) $('#sDelete').onclick=()=>deleteSchool(s);
  $('#sSave').onclick=()=>{
    const name=$('#sName').value.trim(), short=$('#sShort').value.trim();
    if(!name){ toast('流派名称不能为空','error'); return; }
    const data={name, short:short||name.slice(0,1), role:$('#sRole').value.trim(), weapon:$('#sWeapon').value.trim(), color:pickedColor};
    if(isNew){
      state.schools.push({id:uid('s'),cat:pickedCat,...data});
      // 保存后切到对应筛选页，确保能立刻看到新增项
      schoolFilter = pickedCat==='pvp' ? 'pvp' : 'official';
      toast(`已新增${pickedCat==='pvp'?'邪修':'PVE'}流派：`+name);
    }else{
      Object.assign(s,data);
      if(!isOfficial){
        s.cat=pickedCat;
        schoolFilter = pickedCat==='pvp' ? 'pvp' : 'official';
      }
      toast('已保存流派：'+name);
    }
    closeModal(); commit();
  };
  $('#sName').focus();
}

/* 删除流派：先用其人物的流派改指到第一个其它流派，避免悬空引用 */
function deleteSchool(s){
  const users=state.schemes.reduce((a,sc)=>a+sc.fighters.filter(f=>f.schoolId===s.id).length,0);
  const fallback=state.schools.find(x=>x.id!==s.id);
  const msg=users
    ? `确定删除「${s.name}」？有 ${users} 名人物使用该流派，将改归「${fallback?fallback.name:'默认'}」。`
    : `确定删除流派「${s.name}」？`;
  confirmModal('删除流派',msg,()=>{
    if(state.schools.length<=1){ toast('至少保留一个流派','error'); return; }
    state.schools=state.schools.filter(x=>x.id!==s.id);
    // 常驻流派被删 → 记入隐藏，避免版本更新又被补回
    if(DEFAULT_SCHOOLS.some(d=>d.id===s.id)){
      if(!Array.isArray(state.hiddenSchools)) state.hiddenSchools=[];
      if(!state.hiddenSchools.includes(s.id)) state.hiddenSchools.push(s.id);
    }
    if(fallback) state.schemes.forEach(sc=>sc.fighters.forEach(f=>{ if(f.schoolId===s.id) f.schoolId=fallback.id; }));
    commit(); toast('已删除流派：'+s.name);
  });
}

/* ---------- 队伍编队交互 ---------- */
/* 换队伍：弹出队伍列表点选（替代原来的拖动换队） */
/* 队伍编辑弹窗：改名 + 选色（sq=null 为新建） */
function squadEditor(sq){
  const isNew=!sq;
  const sc=scheme();
  const freeColor = SQUAD_PALETTE.find(c=>!sc.squads.some(s=>String(s.color).toLowerCase()===c)) || SQUAD_PALETTE[0];
  const cur = sq || {name:'', color:freeColor};
  const curColor = String(cur.color||'').toLowerCase();
  const inPalette = SQUAD_PALETTE.includes(curColor);
  $('#modal').innerHTML=`<h3>${isNew?'新建队伍':'编辑队伍'}</h3>
    <div class="field"><label>队伍名称</label><input id="sqName" value="${esc(cur.name)}" placeholder="如：机动队 / 偷塔组"></div>
    <div class="field"><label>队伍颜色（${SQUAD_PALETTE.length} 色可选）</label>
      <div class="color-row" id="sqColorRow">${SQUAD_PALETTE.map(c=>
        `<span class="color-opt ${curColor===c?'sel':''}" data-color="${c}" style="background:${c}" title="${c}"></span>`).join('')}</div>
      ${inPalette?'':`<div class="field-hint">当前颜色 ${esc(cur.color||'—')} 不在预设里，选一个新颜色即可替换</div>`}
    </div>
    <div class="modal-actions">
      <span class="grow"></span>
      <button class="btn" id="sqCancel">取消</button>
      <button class="btn btn-primary" id="sqSave">${isNew?'创建':'保存'}</button>
    </div>`;
  $('#modalMask').hidden=false;
  let picked = inPalette ? curColor : SQUAD_PALETTE[0];
  $$('#sqColorRow .color-opt').forEach(o=>o.onclick=()=>{
    $$('#sqColorRow .color-opt').forEach(x=>x.classList.remove('sel'));
    o.classList.add('sel'); picked=o.dataset.color;
  });
  $('#sqCancel').onclick=closeModal;
  $('#sqSave').onclick=()=>{
    const name=$('#sqName').value.trim();
    if(!name){ toast('队伍名称不能为空','error'); return; }
    if(isNew){
      sc.squads.push({id:uid('sq'), name, color:picked, collapsed:false});
      toast(`已建队「${name}」`);
    }else{
      sq.name=name; sq.color=picked;
      toast(`已保存「${name}」`);
    }
    closeModal(); commit();
  };
  $('#sqName').focus();
}

function squadSwitcher(f){
  const sc=scheme();
  $('#modal').innerHTML=`<h3>${esc(f.customName)} · 编入队伍</h3>
    <div class="squad-pick-list">
      ${sc.squads.map(sq=>`<button class="squad-pick ${f.squadId===sq.id?'sel':''}" data-pick="${sq.id}">
        <span class="squad-color" style="background:${sq.color}"></span>
        <b>${esc(sq.name)}</b><small>${sc.fighters.filter(x=>x.squadId===sq.id).length} 人</small>
        ${f.squadId===sq.id?'<span class="pick-check">✓</span>':''}
      </button>`).join('')}
    </div>
    <div class="modal-actions"><button class="btn" id="spCancel">取消</button></div>`;
  $('#modalMask').hidden=false;
  $('#spCancel').onclick=closeModal;
  $$('.squad-pick').forEach(btn=>btn.onclick=()=>{
    f.squadId=btn.dataset.pick; closeModal(); commit();
    toast(`${f.customName} 已编入「${sc.squads.find(s=>s.id===f.squadId).name}」`);
  });
}

function setupSquads(){
  const box=$('#squads');
  box.addEventListener('click', e=>{
    const sc=scheme();

    // 人物卡「✕」快捷删除（须在人物选中之前判断）
    const dF=e.target.closest('[data-del-fighter]');
    if(dF){
      e.stopPropagation();
      const f=sc.fighters.find(x=>x.id===dF.dataset.delFighter);
      if(f) confirmModal('删除人物',`确定删除「${f.customName}」？此操作可撤销。`,()=>{
        const i=sc.fighters.indexOf(f); if(i>=0) sc.fighters.splice(i,1);
        if(selected&&selected.id===f.id) selected=null;
        if(pendingPlace===f.id) pendingPlace=null;
        commit(); toast('已删除人物：'+f.customName);
      });
      return;
    }
    // 队伍头 ✎ 改名 / ✕ 删队（须在折叠之前判断）
    const rSq=e.target.closest('[data-rename-squad]');
    if(rSq){ e.stopPropagation(); const sq=sc.squads.find(s=>s.id===rSq.dataset.renameSquad);
      if(sq) squadEditor(sq); return; }
    const dSq=e.target.closest('[data-del-squad]');
    if(dSq){ e.stopPropagation(); const sq=sc.squads.find(s=>s.id===dSq.dataset.delSquad);
      const memberCount=sc.fighters.filter(f=>f.squadId===sq.id).length;
      confirmModal('删除队伍',`删除「${sq.name}」？队内 ${memberCount} 名人物将一并删除（可撤销）。`,()=>{
        // 删除队内所有人物（含地图标点一并移除）
        const delIds=sc.fighters.filter(f=>f.squadId===sq.id).map(f=>f.id);
        sc.fighters=sc.fighters.filter(f=>f.squadId!==sq.id);
        if(selected&&selected.kind==='fighter'&&delIds.includes(selected.id)) selected=null;
        if(pendingPlace&&delIds.includes(pendingPlace)) pendingPlace=null;
        sc.squads.splice(sc.squads.indexOf(sq),1);
        if(selectedSquad===sq.id) selectedSquad=sc.squads[0]?.id||null;
        commit(); toast(`已删除队伍「${sq.name}」及队内 ${memberCount} 人`); }); return; }
    // 队伍头「隐/显」→ 隐藏/显示该队在地图上的标点
    const hSq=e.target.closest('[data-toggle-hide]');
    if(hSq){
      e.stopPropagation();
      const sq=sc.squads.find(s=>s.id===hSq.dataset.toggleHide);
      if(sq){
        sq.hidden=!sq.hidden;
        commit();
        toast(sq.hidden?`已隐藏「${sq.name}」的地图标点`:`已显示「${sq.name}」的地图标点`);
      }
      return;
    }
    // 点 ▾/▸ 箭头按钮 → 只做展开/折叠
    const toggle=e.target.closest('[data-toggle]');
    if(toggle){
      e.stopPropagation();
      const sq=sc.squads.find(s=>s.id===toggle.dataset.toggle);
      if(sq){ sq.collapsed=!sq.collapsed; commitSoft(); renderSquads(); }
      return;
    }
    // 点队伍标头（名称/圆圈/空白）→ 选中该队伍为编队目标，并展开它
    const selSq=e.target.closest('[data-select-squad]');
    if(selSq){
      e.stopPropagation();
      selectedSquad=selSq.dataset.selectSquad;
      selected=null;
      const sq=sc.squads.find(s=>s.id===selectedSquad);
      if(sq && sq.collapsed){ sq.collapsed=false; commitSoft(); }
      renderSquads(); renderProps(); renderMarks(); refreshHint();
      toast(`已选中队伍：${sq?sq.name:'—'}（新加的人进此队）`); return;
    }
    // 点击 ⇄ 按钮 → 弹队伍选择菜单（换队伍）
    const sw=e.target.closest('[data-squad-switch]');
    if(sw){
      e.stopPropagation();
      const f=sc.fighters.find(x=>x.id===sw.dataset.squadSwitch);
      if(f) squadSwitcher(f);
      return;
    }
    const fEl=e.target.closest('[data-fighter]');
    if(fEl){
      const fid=fEl.dataset.fighter;
      // 再次点击同一待布阵人物 → 取消待布阵；否则进入待布阵
      pendingPlace = (pendingPlace===fid) ? null : fid;
      selected={kind:'fighter',id:fid};
      if(currentTool!=='select'){ currentTool='select'; $$('.tool[data-tool]').forEach(x=>x.classList.toggle('active',x.dataset.tool==='select')); $('#mapViewport').classList.remove('tool-pan','tool-zoom'); }
      renderProps(); renderSquads(); renderMarks(); refreshHint();
      if(pendingPlace) toast(`已选 ${scheme().fighters.find(f=>f.id===fid).customName} · 点地图放下`);
      return;
    }
  });
  // 人物拖拽：仅用于拖到地图布阵（换队伍改用右侧「所属队伍」下拉）
  box.addEventListener('dragstart', e=>{
    const f=e.target.closest('[data-fighter]'); if(!f) return;
    e.dataTransfer.setData('text/plain', f.dataset.fighter);
    e.dataTransfer.effectAllowed='move';
  });
  // 拖到地图布阵
  $('#mapViewport').addEventListener('dragover', e=>e.preventDefault());
  $('#mapViewport').addEventListener('drop', e=>{
    e.preventDefault(); const fid=e.dataTransfer.getData('text/plain'); if(!fid) return;
    const f=scheme().fighters.find(x=>x.id===fid); if(!f) return;
    const r=$('#mapViewport').getBoundingClientRect();
    const m=screenToMap(e.clientX-r.left, e.clientY-r.top);
    const x=Math.max(0,Math.min(1,m.x)), y=Math.max(0,Math.min(1,m.y));
    f.marks[currentStage]={x,y,intent:f.marks[currentStage]?.intent||'stand'};
    const unhid=autoShowSquadOf(f);
    selected={kind:'fighter',id:f.id}; pendingPlace=null;
    commit(); refreshHint(); renderSquads(); toast(`${f.customName} 已布阵${unhid?` · 已自动显示「${unhid}」`:''}`);
  });
}

/* ---------- 地图提示文案 ---------- */
function hintFor(tool){
  if(tool==='select'){
    if(pendingPlace){
      const f=scheme().fighters.find(x=>x.id===pendingPlace);
      return `待布阵「${f?f.customName:'人物'}」· 点击地图放下（放一次即结束）· 再点该人物可重新布置 · Esc 取消`;
    }
    return '滚轮缩放 · 拖动画布平移 · ⊞框选局部放大 · 点左侧人物后点地图布阵';
  }
  if(tool==='pan') return '按住拖动平移视图 · 滚轮缩放 · Esc 返回';
  if(tool==='zoom') return '在地图上框选一个区域，自动放大到该区域精细部署 · Esc 返回';
  return `已选「${PIN_TYPES[tool].label}」工具 · 在地图点击放置，Esc 取消`;
}
function refreshHint(){ const el=$('#mapHint'); if(el) el.textContent=hintFor(currentTool); }

/* ---------- 工具栏 / 方案 / 阶段 ---------- */
function setupTop(){
  $('#stageTabs').addEventListener('click', e=>{
    const tab=e.target.closest('.stage-tab'); if(!tab) return;
    currentStage=tab.dataset.stage; selected=null; pendingPlace=null;
    $$('.stage-tab').forEach(t=>t.classList.toggle('active',t===tab));
    renderMarks(); renderProps(); renderSquads(); renderStatus(); refreshHint();
  });
  $('.map-toolbar').addEventListener('click', e=>{
    const t=e.target.closest('.tool[data-tool]'); if(!t) return;
    currentTool=t.dataset.tool;
    $$('.tool[data-tool]').forEach(x=>x.classList.toggle('active',x===t));
    $('#mapViewport').classList.toggle('tool-pan',currentTool==='pan');
    $('#mapViewport').classList.toggle('tool-zoom',currentTool==='zoom');
    $('#mapHint').textContent=hintFor(currentTool);
  });
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
      // 已在选择工具且有选中对象 → 先取消选中；否则退回选择工具
      if(currentTool==='select'&&(selected||pendingPlace)){ selected=null; pendingPlace=null; renderProps(); renderSquads(); renderMarks(); refreshHint(); }
      else{
        currentTool='select'; $$('.tool[data-tool]').forEach(x=>x.classList.toggle('active',x.dataset.tool==='select'));
        $('#mapViewport').classList.remove('tool-pan','tool-zoom'); refreshHint();
      }
    }
    if((e.ctrlKey||e.metaKey)&&e.key==='z'){ e.preventDefault(); undo(); }
    if((e.ctrlKey||e.metaKey)&&e.key==='y'){ e.preventDefault(); redo(); }
    // +/- 快捷缩放（以视口中心）
    if(e.key==='+'||e.key==='='){ zoomAt(1.2, $('#mapViewport').clientWidth/2, $('#mapViewport').clientHeight/2); }
    if(e.key==='-'){ zoomAt(1/1.2, $('#mapViewport').clientWidth/2, $('#mapViewport').clientHeight/2); }
    // 选中箭头标点时，←/→ 微调方向（Shift 加速到 15°）
    if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&selected&&selected.kind==='pin'
       && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){
      const pin=(scheme().pins[currentStage]||[]).find(x=>x.id===selected.id);
      if(pin&&pin.type==='route'){
        e.preventDefault();
        const step=(e.shiftKey?15:5)*(e.key==='ArrowRight'?1:-1);
        pin.angle=((Math.round(Number(pin.angle)||0)+step)%360+360)%360;
        commit(); toast('箭头方向 '+pin.angle+'°');
      }
    }
  });

  // 切换/新建/复制/删除方案后，重置所有指向旧方案的选中状态（否则目标队选中会错乱）
  const resetSelection=()=>{ selected=null; pendingPlace=null; selectedSquad=scheme().squads[0]?.id||null; };
  $('#schemeSelect').onchange=e=>{ state.currentSchemeId=e.target.value; resetSelection(); commit(); };
  $('#btnNewScheme').onclick=()=>promptModal('新建战术方案','输入方案名称','新建战术方案',v=>{
    const id=uid('sch');
    const org=buildStandardOrg();          // 自动带入标准三队 + 固定7人
    state.schemes.push({id,name:v,updatedAt:Date.now(),
      squads:org.squads, fighters:org.fighters, pins:emptyPins() });
    state.currentSchemeId=id; resetSelection(); commit();
    toast(`已新建方案 · 预置 ${org.squads.length} 队 / ${org.fighters.length} 人`);
  });  $('#btnCopyScheme').onclick=()=>{
    const src=scheme(), copy=JSON.parse(JSON.stringify(src));
    copy.id=uid('sch'); copy.name=src.name+' · 副本'; copy.updatedAt=Date.now();
    state.schemes.push(copy); state.currentSchemeId=copy.id; resetSelection(); commit(); toast('已复制方案');
  };
  $('#btnDelScheme').onclick=()=>{
    if(state.schemes.length<=1){ toast('至少保留一个方案','error'); return; }
    confirmModal('删除方案',`确定删除「${scheme().name}」？此操作不可撤销。`,()=>{
      state.schemes.splice(state.schemes.indexOf(scheme()),1);
      state.currentSchemeId=state.schemes[0].id; resetSelection(); commit(); toast('已删除方案');
    });
  };
  $('#btnAddSquad').onclick=()=>squadEditor(null);
  $('#btnUndo').onclick=undo; $('#btnRedo').onclick=redo;

  // 内置地标显隐 / 清空标点
  $('#btnToggleBuiltin').onclick=()=>{ builtinVisible=!builtinVisible; renderMarks(); toast(builtinVisible?'显示内置地标':'隐藏内置地标'); };
  $('#btnClearMarks').onclick=()=>{
    const n=(scheme().pins[currentStage]||[]).length;
    if(!n){ toast('当前阶段没有标点'); return; }
    confirmModal('清空标点',`清空「${STAGES[currentStage]}」的全部 ${n} 个自定义标点？人物标点保留。`,()=>{
      scheme().pins[currentStage]=[]; selected=null; commit(); toast('已清空');
    });
  };

  // 缩放 / 复位 / 适应全图（以视口中心）
  const centerZoom=f=>zoomAt(f, $('#mapViewport').clientWidth/2, $('#mapViewport').clientHeight/2);
  $('#zoomIn').onclick=()=>centerZoom(1.2);
  $('#zoomOut').onclick=()=>centerZoom(1/1.2);
  $('#zoomReset').onclick=()=>{ fitView(); toast('视图已复位'); };
  $('#btnFit').onclick=()=>{ fitView(); toast('已适应全图'); };

  setupImportExport();
}

/* ---------- 导入 / 导出 JSON ---------- */
function setupImportExport(){
  $('#btnExport').onclick=()=>{
    // 打包：方案 + 流派库（自定义流派随分享一起带走）
    const payload={ format:'byz-tactics', version:2, scheme:scheme(), schools:state.schools, map:state.map||null, side:state.side };
    const data=JSON.stringify(payload,null,2);
    const blob=new Blob([data],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=`${scheme().name}_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast('已导出战术方案 + 流派库 JSON');
  };
  $('#btnImport').onclick=()=>$('#fileInput').click();
  $('#fileInput').onchange=e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const raw=JSON.parse(reader.result);
        // 兼容：新格式(带scheme) 与 旧格式(纯scheme)
        const d=raw.scheme||raw;
        if(!d.squads||!d.fighters||!d.pins) throw new Error('结构不符');
        // 版本兼容：补齐字段（含阶段扩容，缺哪个补哪个，不覆盖已有）
        if(!d.pins) d.pins=emptyPins();
        STAGE_ORDER.forEach(st=>{ if(!Array.isArray(d.pins[st])) d.pins[st]=[]; });
        d.fighters.forEach(f=>{
          if(!f.marks) f.marks=emptyMarks();
          STAGE_ORDER.forEach(st=>{ if(!(st in f.marks)) f.marks[st]=null; });
        });
        // 合并流派库：按 id 覆盖/追加，保留本地未冲突项
        if(Array.isArray(raw.schools)&&raw.schools.length){
          const map=new Map(state.schools.map(s=>[s.id,s]));
          raw.schools.forEach(s=>{ if(s&&s.id) map.set(s.id,s); });
          state.schools=Array.from(map.values());
        }
        if(raw.side==='red'||raw.side==='blue') state.side=raw.side;
        if(raw.map&&raw.map.dataUrl) state.map=raw.map;
        d.id=uid('sch'); d.name=(d.name||'导入方案')+'（导入）'; d.updatedAt=Date.now();
        state.schemes.push(d); state.currentSchemeId=d.id; selected=null;
        commit(); toast('导入成功：'+d.name);
      }catch(err){ toast('导入失败：文件结构不兼容','error'); }
      e.target.value='';
    };
    reader.readAsText(file);
  };
}

/* ---------- 使用说明侧边抽屉 ---------- */
function setupHelp(){
  const open=()=>{ $('#helpMask').hidden=false; $('#helpDrawer').classList.add('open'); };
  const close=()=>{ $('#helpDrawer').classList.remove('open'); setTimeout(()=>{ $('#helpMask').hidden=true; },280); };
  $('#btnHelp').onclick=open;
  $('#helpClose').onclick=close;
  $('#helpMask').onclick=close;
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!$('#helpMask').hidden) close(); });
}

/* ---------- 顶部全屏提示条 ---------- */
function setupFullscreenTip(){
  const tip=$('#fullscreenTip'), KEY='byz_fstip_dismissed';
  if(localStorage.getItem(KEY)==='1') tip.hidden=true;
  $('#fsTipClose').onclick=()=>{ tip.hidden=true; localStorage.setItem(KEY,'1'); };
  $('#btnFullscreen').onclick=()=>{
    const el=document.documentElement;
    if(!document.fullscreenElement){
      (el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen)?.call(el)
        .then(()=>{ $('#btnFullscreen').textContent='退出全屏'; }).catch(()=>toast('浏览器未允许全屏，可按 F11','error'));
    }else{
      (document.exitFullscreen||document.webkitExitFullscreen)?.call(document)
        .then(()=>{ $('#btnFullscreen').textContent='全屏显示'; });
    }
  };
  document.addEventListener('fullscreenchange',()=>{
    $('#btnFullscreen').textContent=document.fullscreenElement?'退出全屏':'全屏显示';
  });
}

/* ---------- 弹窗 ---------- */
function closeModal(){ $('#modalMask').hidden=true; }
function confirmModal(title,msg,onOk){
  $('#modal').innerHTML=`<h3>${title}</h3><p style="color:var(--paper-dim);font-size:13px;line-height:1.7;text-align:center">${esc(msg)}</p>
    <div class="modal-actions"><button class="btn" id="mCancel">取消</button><button class="btn btn-primary" id="mOk">确定</button></div>`;
  $('#modalMask').hidden=false;
  $('#mCancel').onclick=closeModal; $('#mOk').onclick=()=>{closeModal();onOk();};
}
function promptModal(title,label,def,onOk){
  $('#modal').innerHTML=`<h3>${title}</h3>
    <div class="field"><label>${label}</label><input id="mInput" value="${esc(def||'')}"></div>
    <div class="modal-actions"><button class="btn" id="mCancel">取消</button><button class="btn btn-primary" id="mOk">确定</button></div>`;
  $('#modalMask').hidden=false;
  $('#mInput').focus(); $('#mInput').select();
  $('#mCancel').onclick=closeModal;
  const ok=()=>{const v=$('#mInput').value.trim(); if(!v){toast('名称不能为空','error');return;} closeModal();onOk(v);};
  $('#mOk').onclick=ok; $('#mInput').onkeydown=e=>{if(e.key==='Enter')ok();};
}
$('#modalMask').addEventListener('click',e=>{if(e.target===$('#modalMask'))closeModal();});

/* ---------- 工具函数 ---------- */
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
let toastTimer=null;
function toast(msg,type){
  const el=$('#toast'); el.textContent=msg; el.className='toast show'+(type?' '+type:'');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.className='toast',2000);
}

/* ---------- 启动 ---------- */
function init(){
  state=load();
  if(!state.schemes[0].pins) state.schemes[0].pins=emptyPins();
  selectedSquad=scheme().squads[0]?.id||null;   // 默认编队目标=第一队
  snapshot();
  setupMap(); setupSchools(); setupSquads(); setupTop();
  setupMapCustom(); setupHelp(); setupFullscreenTip();
  initMinimap();
  applyView();
  renderAll();
}
init();
