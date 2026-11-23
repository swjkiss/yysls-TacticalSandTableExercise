'use strict';

/* ============================================================
   百业沙盘 · 燕云十六声百业战战术沙盘
   P0：模板库 + 编辑器 + 可替换底图 + 本地保存 + 导入导出
   ============================================================ */

const APP_VERSION = '0.1.0';
const SCHEMA_VERSION = 1;
const DATA_KEY = 'yysls-baizhan-sandbox-v1';
const MAPS_KEY = 'yysls-baizhan-maps-v1';
const DEFAULT_MAP_ID = 'baizhan_official_v1';

const LIMITS = {
  totalObjects: 200,
  characters: 60,
  name: 40,
  description: 200,
  tags: 5,
  tagLen: 10,
  charName: 12,
  abbr: 2,
  charNote: 50,
  markerLabel: 20,
  markerNote: 100,
  routeLabel: 20,
  routeNote: 100,
  textLen: 30,
  undo: 30
};

const DEFAULT_CATEGORIES = ['开局布防', '进攻偷塔', '资源争夺', '中场演出', '终局搬树', '赛后复盘', '未分类'];

const DEFAULT_MAP = {
  id: DEFAULT_MAP_ID,
  name: '百业战 · 官方战场图',
  src: 'assets/baizhan-map-official.jpg',
  width: 1410,
  height: 1191,
  builtin: true
};

const MARKER_TYPES = [
  { key: 'gather',  name: '集合/集火', abbr: '集', color: '#2F6F6A', states: [] },
  { key: 'attack',  name: '进攻',      abbr: '攻', color: '#B23A2E', states: [] },
  { key: 'defend',  name: '防守',      abbr: '守', color: '#2F6F6A', states: [] },
  { key: 'scout',   name: '侦察/视野', abbr: '眼', color: '#4E7C8A', states: [] },
  { key: 'danger',  name: '危险/撤退', abbr: '危', color: '#B7791F', states: [] },
  { key: 'wall',    name: '人墙',      abbr: '墙', color: '#7C8178', states: ['完好', '受损', '已摧毁'] },
  { key: 'goose',   name: '大鹅',      abbr: '鹅', color: '#B08A45', states: ['存活', '已击杀'] },
  { key: 'tree',    name: '发财树',    abbr: '树', color: '#3F7D58', states: ['未出现', '可搬运', '搬运中', '已送达'] },
  { key: 'beast',   name: '中立首领',  abbr: '兽', color: '#8A5B4E', states: ['未刷新', '争夺中', '已击杀'] },
  { key: 'tower',   name: '玄元教据点', abbr: '据', color: '#6D727D', states: ['中立', '我方', '敌方'] },
  { key: 'show',    name: '中场演出',  abbr: '演', color: '#8A6E9A', states: ['未开始', '进行中', '已结束'] },
  { key: 'revive',  name: '复活点',    abbr: '复', color: '#3F7D58', states: [] },
  { key: 'order',   name: '指挥技能',  abbr: '令', color: '#B08A45', states: [] },
  { key: 'custom',  name: '自定义',    abbr: '点', color: '#7C8178', states: [] }
];

const SCHOOLS = [
  { name: '牵丝·翊', abbr: '翊翊', color: '#A9803F', role: '输出', weapon: '扇 + 舞绫鼓' },
  { name: '牵丝·霖', abbr: '霖', color: '#3F7D58', role: '治疗', weapon: '药典 + 引魂蛊' },
  { name: '牵丝·玉', abbr: '玉', color: '#5E7E93', role: '输出', weapon: '执笔 + 九重春色' },
  { name: '破竹·风', abbr: '风', color: '#6D727D', role: '侦察', weapon: '双刀 + 绳镖' },
  { name: '破竹·鸢', abbr: '鸢', color: '#A86250', role: '输出', weapon: '手甲 + 绳镖' },
  { name: '破竹·樽', abbr: '樽', color: '#8C6A46', role: '输出', weapon: '手甲 + 双刀' },
  { name: '破竹·尘', abbr: '尘', color: '#8A7A4F', role: '输出', weapon: '醉梦游春' },
  { name: '裂石·钧', abbr: '钧', color: '#5D707D', role: '前排', weapon: '唐横刀 + 陌刀' },
  { name: '裂石·威', abbr: '威', color: '#7D4F43', role: '前排', weapon: '刀法 + 风雷枪' },
  { name: '鸣金·虹', abbr: '虹', color: '#B0764A', role: '输出', weapon: '无名剑 + 无名枪' },
  { name: '鸣金·影', abbr: '影', color: '#565B6B', role: '输出', weapon: '九剑 + 惊魂枪' },
  { name: '鸣金·霆', abbr: '霆', color: '#5F7463', role: '输出', weapon: '双枪' },
  { name: '双剑',    abbr: '双剑', color: '#7B7F8C', role: '输出', weapon: '双剑组合' },
  { name: '自定义',  abbr: '自定', color: '#7C8178', role: '自由人', weapon: '用户自定义' }
];

const CAMPS = {
  ally: { name: '我方', color: '#2F6F6A' },
  enemy: { name: '敌方', color: '#B23A2E' },
  neutral: { name: '中立', color: '#7C8178' }
};
const TEAMS = ['一队', '二队', '三队', '自由人'];
const ROLES = ['输出', '治疗', '前排', '侦察', '指挥', '自由人'];
const SCHOOL_COLORS = ['#A9803F', '#3F7D58', '#5E7E93', '#6D727D', '#A86250', '#8C6A46', '#B0764A', '#565B6B', '#5F7463', '#7C8178'];
const ROUTE_STYLES = {
  attack:  { name: '进攻', color: '#B23A2E', dash: '', arrow: true },
  defend:  { name: '防守', color: '#2F6F6A', dash: '8 6', arrow: true },
  retreat: { name: '撤退', color: '#7C8178', dash: '4 6', arrow: true },
  custom:  { name: '自定义', color: '#B08A45', dash: '10 4 2 4', arrow: true }
};

/* ============================================================
   工具函数
   ============================================================ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const NS = 'http://www.w3.org/2000/svg';

function h(tag, attrs, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'html') node.innerHTML = value;
      else if (key === 'style') {
        if (typeof value === 'string') node.style.cssText = value;
        else Object.assign(node.style, value);
      } else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key.startsWith('on') && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key in node && key !== 'list' && typeof value !== 'object') {
        try { node[key] = value; } catch (_) { node.setAttribute(key, value); }
      } else {
        node.setAttribute(key, value);
      }
    }
  }
  for (const child of children.flat(3)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function svg(tag, attrs, ...children) {
  const node = document.createElementNS(NS, tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      node.setAttribute(key, value);
    }
  }
  for (const child of children.flat(3)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function icon(name) {
  const el = svg('svg', { class: 'ico' });
  const use = svg('use', { href: '#i-' + name });
  el.append(use);
  return el;
}

const clone = (obj) => JSON.parse(JSON.stringify(obj));
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const round4 = (n) => Math.round(n * 10000) / 10000;
const uid = (prefix = 'o') => prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nowIso = () => new Date().toISOString();
const escapeReg = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function dateFmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function timeFmt(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(date.getHours())}:${p(date.getMinutes())}`;
}
function stampFmt(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`;
}
function cloneId(obj, prefix) {
  const copy = clone(obj);
  copy.id = uid(prefix);
  return copy;
}

function typeDef(key) {
  return MARKER_TYPES.find((t) => t.key === key) || MARKER_TYPES[0];
}
function schoolDef(name) {
  return SCHOOLS.find((s) => s.name === name) || SCHOOLS[SCHOOLS.length - 1];
}
function stateTone(marker) {
  const state = marker.state || '';
  if (!state) return '#9AA091';
  if (/已击杀|已摧毁|已结束|已送达|敌方/.test(state)) return '#B23A2E';
  if (/受损|争夺中|搬运中|进行中|可搬运/.test(state)) return '#B7791F';
  if (/存活|完好|我方|中立|未开始|未刷新|未出现/.test(state)) return '#3F7D58';
  return '#9AA091';
}
function toast(message, tone = 'ok') {
  const root = $('#toast-root');
  const el = h('div', { class: 'toast ' + tone, text: message });
  root.append(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 220);
  }, 2800);
}
function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}
function isReadonly() {
  return window.innerWidth < 1024;
}
function guardEdit() {
  if (isReadonly()) {
    toast('窗口宽度低于 1024px，当前只能查看，请在桌面端编辑', 'warn');
    return true;
  }
  return false;
}

/* ============================================================
   数据：地图注册表 / 工作区
   ============================================================ */
function normalizeMap(map) {
  if (!map || typeof map !== 'object') return null;
  if (typeof map.id !== 'string' || typeof map.src !== 'string') return null;
  return {
    id: map.id,
    name: typeof map.name === 'string' ? map.name : '未命名底图',
    src: map.src,
    width: Number(map.width) > 0 ? Number(map.width) : 1410,
    height: Number(map.height) > 0 ? Number(map.height) : 1191,
    builtin: !!map.builtin
  };
}
function loadMaps() {
  try {
    const raw = localStorage.getItem(MAPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeMap).filter(Boolean);
  } catch (_) {
    return [];
  }
}
function saveMaps() {
  try {
    localStorage.setItem(MAPS_KEY, JSON.stringify(maps));
    return true;
  } catch (_) {
    return false;
  }
}
function allMaps() {
  return [DEFAULT_MAP].concat(maps.filter((m) => m.id !== DEFAULT_MAP.id));
}
function resolveMap(mapId) {
  return allMaps().find((m) => m.id === mapId) || DEFAULT_MAP;
}

let db = null;
let maps = [];
let loadFailed = false;
let initialized = false;

function normalizeObject(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = raw.type;
  const x = Number(raw.x);
  const y = Number(raw.y);
  if (!['marker', 'character', 'route', 'text'].includes(type)) return null;
  if (type !== 'route' && (!Number.isFinite(x) || !Number.isFinite(y))) return null;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : uid(type.slice(0, 2));

  if (type === 'marker') {
    const def = MARKER_TYPES.find((t) => t.key === raw.markerType) || MARKER_TYPES[0];
    return {
      id, type, markerType: def.key,
      x: round4(clamp(x, 0, 1)), y: round4(clamp(y, 0, 1)),
      label: String(raw.label || '').slice(0, LIMITS.markerLabel),
      state: def.states.includes(raw.state) ? raw.state : (def.states[0] || ''),
      color: /^#[0-9a-f]{6}$/i.test(raw.color || '') ? raw.color : def.color,
      size: ['s', 'm', 'l'].includes(raw.size) ? raw.size : 'm',
      note: String(raw.note || '').slice(0, LIMITS.markerNote),
      visible: raw.visible !== false
    };
  }
  if (type === 'character') {
    const school = schoolDef(raw.school);
    return {
      id, type,
      name: String(raw.name || '未命名').slice(0, LIMITS.charName).trim() || '未命名',
      school: school.name,
      abbr: String(raw.abbr || school.abbr).slice(0, LIMITS.abbr) || school.abbr,
      camp: ['ally', 'enemy', 'neutral'].includes(raw.camp) ? raw.camp : 'ally',
      group: TEAMS.includes(raw.group) ? raw.group : '自由人',
      role: ROLES.includes(raw.role) ? raw.role : school.role,
      x: round4(clamp(x, 0, 1)), y: round4(clamp(y, 0, 1)),
      color: /^#[0-9a-f]{6}$/i.test(raw.color || '') ? raw.color : school.color,
      note: String(raw.note || '').slice(0, LIMITS.charNote),
      visible: raw.visible !== false
    };
  }
  if (type === 'route') {
    const points = Array.isArray(raw.points) ? raw.points.map((p) => ({
      x: round4(clamp(Number(p && p.x), 0, 1)),
      y: round4(clamp(Number(p && p.y), 0, 1))
    })).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)) : [];
    if (points.length < 2) return null;
    const style = ROUTE_STYLES[raw.style] ? raw.style : 'attack';
    return {
      id, type,
      label: String(raw.label || '').slice(0, LIMITS.routeLabel),
      points,
      style,
      color: /^#[0-9a-f]{6}$/i.test(raw.color || '') ? raw.color : ROUTE_STYLES[style].color,
      width: [1.5, 2.5, 3.5].includes(Number(raw.width)) ? Number(raw.width) : 2.5,
      arrow: raw.arrow !== false,
      note: String(raw.note || '').slice(0, LIMITS.routeNote),
      visible: raw.visible !== false
    };
  }
  return {
    id, type: 'text',
    x: round4(clamp(x, 0, 1)), y: round4(clamp(y, 0, 1)),
    content: String(raw.content || '文字').slice(0, LIMITS.textLen),
    fontSize: [12, 16, 20].includes(Number(raw.fontSize)) ? Number(raw.fontSize) : 16,
    color: /^#[0-9a-f]{6}$/i.test(raw.color || '') ? raw.color : '#1F2420',
    visible: raw.visible !== false
  };
}

function normalizeTemplate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const objects = Array.isArray(raw.objects)
    ? raw.objects.map(normalizeObject).filter(Boolean).slice(0, LIMITS.totalObjects)
    : [];
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid('tpl'),
    name: String(raw.name || '未命名模板').slice(0, LIMITS.name).trim() || '未命名模板',
    category: typeof raw.category === 'string' && raw.category ? raw.category : '未分类',
    mapId: typeof raw.mapId === 'string' && raw.mapId ? raw.mapId : DEFAULT_MAP_ID,
    description: String(raw.description || '').slice(0, LIMITS.description),
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((t) => String(t).slice(0, LIMITS.tagLen)).filter(Boolean).slice(0, LIMITS.tags)
      : [],
    createdAt: raw.createdAt || nowIso(),
    updatedAt: raw.updatedAt || raw.createdAt || nowIso(),
    layers: {
      markers: !raw.layers || raw.layers.markers !== false,
      characters: !raw.layers || raw.layers.characters !== false,
      annotations: !raw.layers || raw.layers.annotations !== false
    },
    objects
  };
}

function seedTemplates() {
  const now = Date.now();
  const at = (m) => new Date(now - m * 60000).toISOString();
  const ch = (name, schoolName, camp, x, y, group, role, abbr, color) => {
    const s = schoolDef(schoolName);
    return {
      id: uid('ch'), type: 'character', name, school: s.name, abbr: abbr || s.abbr,
      camp, group, role: role || s.role, x, y, color: color || s.color, note: '', visible: true
    };
  };
  const mk = (type, x, y, label, state, color, size, note) => {
    const def = typeDef(type);
    return {
      id: uid('mk'), type: 'marker', markerType: type, x, y, label: label || '',
      state: state || def.states[0] || '', color: color || def.color,
      size: size || 'm', note: note || '', visible: true
    };
  };
  const route = (label, style, points, color) => ({
    id: uid('rt'), type: 'route', label, points,
    style, color: color || ROUTE_STYLES[style].color, width: 2.5, arrow: true, note: '', visible: true
  });
  const text = (content, x, y, fontSize, color) => ({
    id: uid('tx'), type: 'text', x, y, content, fontSize: fontSize || 16, color: color || '#1F2420', visible: true
  });

  return [
    {
      id: uid('tpl'), name: '开局 · 三路布防', category: '开局布防', mapId: DEFAULT_MAP_ID,
      description: '开局 90 秒的默认站位：三路各留人墙看守，双剑与风位机动，翊与霖站中路后排。',
      tags: ['开局', '三路', '默认'],
      createdAt: at(180), updatedAt: at(26),
      layers: { markers: true, characters: true, annotations: true },
      objects: [
        ch('翊翊1号', '牵丝·翊', 'ally', 0.38, 0.22, '一队', '输出'),
        ch('翊翊2号', '牵丝·翊', 'ally', 0.38, 0.78, '一队', '输出'),
        ch('双剑1号', '双剑', 'ally', 0.33, 0.50, '二队', '输出'),
        ch('钧1号', '裂石·钧', 'ally', 0.42, 0.20, '一队', '前排'),
        ch('威1号', '裂石·威', 'ally', 0.42, 0.80, '一队', '前排'),
        ch('霖1号', '牵丝·霖', 'ally', 0.30, 0.40, '二队', '治疗'),
        ch('风1号', '破竹·风', 'ally', 0.44, 0.53, '二队', '侦察'),
        ch('影1号', '鸣金·影', 'enemy', 0.66, 0.52, '一队', '输出'),
        ch('霆1号', '鸣金·霆', 'enemy', 0.68, 0.22, '一队', '输出'),
        ch('玉1号', '牵丝·玉', 'enemy', 0.68, 0.78, '一队', '输出'),
        mk('gather', 0.30, 0.50, '开局集合', '', '#2F6F6A'),
        mk('defend', 0.36, 0.22, '上路人墙', '完好', '#2F6F6A'),
        mk('defend', 0.36, 0.78, '下路人墙', '完好', '#2F6F6A'),
        mk('scout', 0.46, 0.36, '上野视野', '', '#4E7C8A'),
        mk('goose', 0.22, 0.50, '我方大鹅', '存活', '#B08A45'),
        mk('tree', 0.52, 0.62, '发财树', '未出现', '#3F7D58'),
        mk('tower', 0.30, 0.17, '玄元教 · 上路', '中立', '#6D727D'),
        mk('tower', 0.30, 0.83, '玄元教 · 下路', '中立', '#6D727D')
      ]
    },
    {
      id: uid('tpl'), name: '双剑偷下塔', category: '进攻偷塔', mapId: DEFAULT_MAP_ID,
      description: '利用敌方下路回防空档，双剑与风位从下野区绕后，30 秒内拆掉下塔后立刻回撤。',
      tags: ['偷塔', '下路', '机动'],
      createdAt: at(320), updatedAt: at(61),
      layers: { markers: true, characters: true, annotations: true },
      objects: [
        ch('双剑1号', '双剑', 'ally', 0.60, 0.80, '二队', '输出'),
        ch('双剑2号', '双剑', 'ally', 0.55, 0.86, '二队', '输出'),
        ch('风1号', '破竹·风', 'ally', 0.52, 0.83, '二队', '侦察'),
        ch('威1号', '裂石·威', 'ally', 0.47, 0.78, '一队', '前排'),
        ch('影1号', '鸣金·影', 'enemy', 0.77, 0.72, '一队', '输出'),
        ch('钧1号', '裂石·钧', 'enemy', 0.80, 0.84, '二队', '前排'),
        route('下路偷塔路线', 'attack', [
          { x: 0.44, y: 0.86 }, { x: 0.56, y: 0.84 }, { x: 0.70, y: 0.78 }, { x: 0.82, y: 0.72 }
        ], '#B23A2E'),
        mk('attack', 0.82, 0.70, '集火下塔', '', '#B23A2E'),
        mk('defend', 0.75, 0.76, '敌方回防', '', '#B23A2E'),
        mk('danger', 0.60, 0.90, '撤退口', '', '#B7791F'),
        mk('goose', 0.22, 0.50, '我方大鹅', '存活', '#B08A45'),
        text('30 秒内拆完，听到回防立刻走', 0.63, 0.92, 16, '#B23A2E')
      ]
    },
    {
      id: uid('tpl'), name: '上野区资源压制', category: '资源争夺', mapId: DEFAULT_MAP_ID,
      description: '围绕中立首领刷新做视野与包夹，先占上野口，再由中路支援，避免在狭窄路口被反打。',
      tags: ['野区', '首领', '视野'],
      createdAt: at(460), updatedAt: at(124),
      layers: { markers: true, characters: true, annotations: true },
      objects: [
        ch('翊1号', '牵丝·翊', 'ally', 0.43, 0.31, '一队', '输出'),
        ch('钧1号', '裂石·钧', 'ally', 0.48, 0.36, '一队', '前排'),
        ch('霖1号', '牵丝·霖', 'ally', 0.41, 0.40, '一队', '治疗'),
        ch('风1号', '破竹·风', 'ally', 0.50, 0.27, '二队', '侦察'),
        ch('鸢1号', '破竹·鸢', 'enemy', 0.58, 0.36, '一队', '输出'),
        ch('威1号', '裂石·威', 'enemy', 0.60, 0.42, '一队', '前排'),
        route('上路支援', 'defend', [
          { x: 0.38, y: 0.28 }, { x: 0.46, y: 0.34 }, { x: 0.53, y: 0.37 }
        ], '#2F6F6A'),
        mk('beast', 0.52, 0.48, '首领刷新点', '争夺中', '#8A5B4E'),
        mk('scout', 0.45, 0.24, '上野入口视野', '', '#4E7C8A'),
        mk('scout', 0.58, 0.28, '敌方侧视野', '', '#4E7C8A'),
        mk('danger', 0.56, 0.40, '狭窄路口', '', '#B7791F'),
        mk('goose', 0.22, 0.50, '我方大鹅', '存活', '#B08A45')
      ]
    },
    {
      id: uid('tpl'), name: '中场演出 · 终局搬树', category: '中场演出', mapId: DEFAULT_MAP_ID,
      description: '演出开始后放弃边路纠缠，提前占住树点与回撤路线；搬树时前排开路，治疗贴身。',
      tags: ['中场', '搬树', '终局'],
      createdAt: at(600), updatedAt: at(203),
      layers: { markers: true, characters: true, annotations: true },
      objects: [
        ch('翊1号', '牵丝·翊', 'ally', 0.49, 0.56, '一队', '输出'),
        ch('钧1号', '裂石·钧', 'ally', 0.56, 0.63, '一队', '前排'),
        ch('霖1号', '牵丝·霖', 'ally', 0.54, 0.70, '一队', '治疗'),
        ch('双剑1号', '双剑', 'ally', 0.62, 0.67, '二队', '输出'),
        ch('风1号', '破竹·风', 'ally', 0.44, 0.62, '二队', '侦察'),
        ch('威2号', '裂石·威', 'ally', 0.36, 0.56, '二队', '前排'),
        ch('影1号', '鸣金·影', 'enemy', 0.64, 0.58, '一队', '输出'),
        route('搬树回撤', 'custom', [
          { x: 0.62, y: 0.70 }, { x: 0.50, y: 0.60 }, { x: 0.36, y: 0.53 }, { x: 0.24, y: 0.50 }
        ], '#B08A45'),
        mk('show', 0.58, 0.58, '中场演出', '进行中', '#8A6E9A', 'l'),
        mk('tree', 0.61, 0.71, '发财树', '搬运中', '#3F7D58', 'l'),
        mk('revive', 0.31, 0.50, '复活点', '', '#3F7D58'),
        mk('order', 0.40, 0.56, '指挥技能', '', '#B08A45'),
        mk('defend', 0.50, 0.64, '接应点', '', '#2F6F6A'),
        text('演出结束 20 秒内抢树', 0.60, 0.79, 16, '#8A6E3A')
      ]
    },
    {
      id: uid('tpl'), name: '逆风翻盘 · 赛后复盘', category: '赛后复盘', mapId: DEFAULT_MAP_ID,
      description: '复盘局：上路视野连续丢失导致人墙被拆，记录三个关键失误点，供下次开局前对照。',
      tags: ['复盘', '视野', '人墙'],
      createdAt: at(760), updatedAt: at(320),
      layers: { markers: true, characters: true, annotations: true },
      objects: [
        ch('翊1号', '牵丝·翊', 'ally', 0.40, 0.24, '一队', '输出'),
        ch('钧1号', '裂石·钧', 'ally', 0.43, 0.20, '一队', '前排'),
        ch('影1号', '鸣金·影', 'enemy', 0.61, 0.26, '一队', '输出'),
        ch('霆1号', '鸣金·霆', 'enemy', 0.64, 0.20, '一队', '输出'),
        route('敌方推进路线', 'attack', [
          { x: 0.62, y: 0.26 }, { x: 0.54, y: 0.24 }, { x: 0.46, y: 0.22 }, { x: 0.40, y: 0.22 }
        ], '#B23A2E'),
        mk('danger', 0.57, 0.31, '视野缺口', '', '#B7791F', 'l'),
        mk('wall', 0.65, 0.20, '上路人墙', '已摧毁', '#7C8178'),
        mk('wall', 0.65, 0.50, '中路二墙', '受损', '#7C8178'),
        mk('scout', 0.50, 0.31, '应补视野', '', '#4E7C8A'),
        text('复盘：上路连续 40 秒无视野', 0.51, 0.36, 16, '#B23A2E')
      ]
    }
  ];
}

function loadDb() {
  loadFailed = false;
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) {
      db = { templates: seedTemplates(), categories: DEFAULT_CATEGORIES.slice(), lastTemplateId: null, schemaVersion: SCHEMA_VERSION };
      initialized = false;
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.templates)) throw new Error('bad shape');
    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.map((c) => String(c)).filter(Boolean)
      : [];
    DEFAULT_CATEGORIES.forEach((c) => { if (!categories.includes(c)) categories.push(c); });
    db = {
      templates: parsed.templates.map(normalizeTemplate).filter(Boolean),
      categories,
      lastTemplateId: typeof parsed.lastTemplateId === 'string' ? parsed.lastTemplateId : null,
      schemaVersion: SCHEMA_VERSION
    };
    initialized = true;
  } catch (err) {
    loadFailed = true;
    db = { templates: [], categories: DEFAULT_CATEGORIES.slice(), lastTemplateId: null, schemaVersion: SCHEMA_VERSION };
    initialized = true;
  }
}

/* ============================================================
   会话状态 / 保存
   ============================================================ */
let ui = {
  view: 'library',
  category: 'all',
  search: '',
  sort: 'recent',
  tab: 'roster',
  rosterQuery: '',
  rosterCamp: 'all',
  tool: 'select',
  snap: 8,
  selection: null,
  leftOpen: true,
  rightOpen: true
};

let view = { panX: 0, panY: 0, zoom: 1, fit: 1, sector: null, label: '' };
let history = { stack: [], index: 0 };
let drawing = null;
let drag = null;
let panDrag = null;
let sectorDrag = null;
let pickerPoint = null;
let currentMapIdKey = null;
let mapMissing = false;
let mapError = false;
let lastSavedAt = null;
let saveStatus = 'saved';
let saveTimer = null;
let saveFailed = false;

function currentTemplate() {
  return db.templates.find((t) => t.id === db.lastTemplateId) || null;
}
function currentMap() {
  const t = currentTemplate();
  return resolveMap(t ? t.mapId : DEFAULT_MAP_ID);
}
function currentObject() {
  const t = currentTemplate();
  if (!t || !ui.selection) return null;
  return t.objects.find((o) => o.id === ui.selection.id && o.type === ui.selection.kind) || null;
}

function payload() {
  return {
    format: 'yysls-baizhan-workspace',
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    savedAt: nowIso(),
    templates: db.templates,
    categories: db.categories,
    lastTemplateId: db.lastTemplateId
  };
}

function scheduleSave() {
  saveStatus = 'saving';
  updateSaveUI();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 500);
}

function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(payload()));
    saveStatus = 'saved';
    saveFailed = false;
    lastSavedAt = new Date();
    hideSaveBanner();
  } catch (err) {
    saveStatus = 'error';
    saveFailed = true;
    showSaveBanner();
  }
  updateSaveUI();
}

function flushSave() {
  if (saveStatus === 'saving' || saveTimer) saveNow();
}

function updateSaveUI() {
  const head = $('#save-state');
  const foot = $('#st-save');
  if (!head || !foot) return;
  head.classList.toggle('saving', saveStatus === 'saving');
  head.classList.toggle('error', saveStatus === 'error');
  const label = saveStatus === 'saving'
    ? '保存中…'
    : saveStatus === 'error'
      ? '保存失败'
      : lastSavedAt ? '已保存 ' + timeFmt(lastSavedAt) : '已保存';
  head.querySelector('span').textContent = label;
  foot.textContent = label;
}
function showSaveBanner() {
  const banner = $('#save-banner');
  if (!banner) return;
  banner.hidden = false;
}
function hideSaveBanner() {
  const banner = $('#save-banner');
  if (banner) banner.hidden = true;
}

/* ============================================================
   弹窗
   ============================================================ */
let activeModal = null;

function openModal(opts) {
  closeModal();
  const backdrop = h('div', { class: 'modal-backdrop' });
  const modal = h('div', {
    class: 'modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': opts.title || '对话框',
    style: opts.width ? `--modal-w:${opts.width}px` : ''
  });
  const head = h('div', { class: 'modal-head' },
    h('div', { class: 'modal-head-text' },
      opts.eyebrow ? h('div', { class: 'eyebrow', text: opts.eyebrow }) : null,
      h('h2', { class: 'modal-title', text: opts.title || '' }),
      opts.subtitle ? h('p', { class: 'modal-sub', text: opts.subtitle }) : null
    ),
    h('button', {
      class: 'icon-btn modal-close',
      'aria-label': '关闭',
      onclick: () => { closeModal(); }
    }, icon('close'))
  );
  const body = h('div', { class: 'modal-body' });
  if (opts.body) {
    if (typeof opts.body === 'string') body.append(h('div', { html: opts.body }));
    else body.append(opts.body);
  }
  const foot = h('div', { class: 'modal-foot' });
  if (opts.footer) foot.append(opts.footer);
  if (opts.actions) {
    if (opts.footer) foot.append(h('div', { class: 'spacer' }));
    for (const action of opts.actions) {
      foot.append(h('button', {
        class: 'btn ' + (action.variant || ''),
        disabled: action.disabled,
        onclick: () => {
          let keep = false;
          if (action.onClick) keep = action.onClick();
          if (keep !== false) closeModal();
        }
      }, action.icon ? icon(action.icon) : null, action.label));
    }
  }
  modal.append(head, body);
  if (foot.childNodes.length) modal.append(foot);
  backdrop.append(modal);
  backdrop.addEventListener('pointerdown', (e) => {
    if (e.target === backdrop) closeModal();
  });
  $('#modal-root').append(backdrop);
  document.body.classList.add('modal-open');
  activeModal = { backdrop, modal, onClose: opts.onClose };
  const focusable = modal.querySelector('input:not([type=hidden]), textarea, select, button.btn.primary');
  if (focusable) setTimeout(() => focusable.focus(), 30);
  return modal;
}

function closeModal() {
  if (!activeModal) return;
  const current = activeModal;
  activeModal = null;
  current.backdrop.remove();
  if (!document.querySelector('.modal-backdrop')) document.body.classList.remove('modal-open');
  if (current.onClose) current.onClose();
}

function confirmDialog(opts) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    openModal({
      eyebrow: 'CONFIRM',
      title: opts.title || '请确认',
      subtitle: opts.subtitle || '',
      width: opts.width || 440,
      body: typeof opts.message === 'string'
        ? h('div', { class: 'danger-note' }, opts.message)
        : opts.message,
      actions: [
        { label: opts.cancelText || '取消', variant: 'ghost', onClick: () => finish(false) },
        { label: opts.confirmText || '确认', variant: opts.tone === 'plain' ? 'primary' : 'danger', onClick: () => finish(true) }
      ],
      onClose: () => finish(false)
    });
  });
}

/* ============================================================
   路由与视图
   ============================================================ */
function routeFromHash() {
  const match = location.hash.match(/^#\/editor(?:\/([^/?#]+))?/);
  if (match) {
    let id = match[1] ? decodeURIComponent(match[1]) : '';
    if (!id) {
      id = db.lastTemplateId && db.templates.some((t) => t.id === db.lastTemplateId)
        ? db.lastTemplateId
        : (db.templates[0] && db.templates[0].id) || '';
    }
    if (id && db.templates.some((t) => t.id === id)) {
      showEditor(id);
      return;
    }
    toast(id ? '模板不存在或已被删除' : '还没有模板，先新建一个', 'warn');
    location.hash = '#/library';
    return;
  }
  showLibrary();
}

function showLibrary() {
  ui.view = 'library';
  closeModal();
  document.body.classList.remove('editor-mode');
  $('#topbar').hidden = false;
  $('#view-library').hidden = false;
  $('#view-editor').hidden = true;
  closeDrawer();
  closePicker();
  drawing = null;
  renderLibrary();
  updateReadonlyUI();
}

function showEditor(id) {
  const t = db.templates.find((item) => item.id === id);
  if (!t) { showLibrary(); return; }
  closeModal();
  db.lastTemplateId = id;
  ui.view = 'editor';
  document.body.classList.add('editor-mode');
  $('#topbar').hidden = true;
  $('#view-library').hidden = true;
  $('#view-editor').hidden = false;
  ui.selection = null;
  ui.tab = 'roster';
  ui.tool = 'select';
  drawing = null;
  closePicker();
  closeDrawer();
  history = { stack: [clone(db.templates)], index: 0 };
  currentMapIdKey = t.mapId;
  mapMissing = !allMaps().some((m) => m.id === t.mapId);
  mapError = false;
  view = { panX: 0, panY: 0, zoom: 1, fit: 1, sector: null, label: '' };
  updateEditorChrome(t);
  renderEditorAll();
  updateReadonlyUI();
  requestAnimationFrame(() => {
    layoutStage(true);
    renderEditorAll();
  });
  scheduleSave();
}

function updateEditorChrome(t) {
  const body = $('#ed-body');
  body.classList.toggle('no-left', !ui.leftOpen);
  body.classList.toggle('no-right', !ui.rightOpen);
  $('#btn-toggle-left').classList.toggle('active', ui.leftOpen);
  $('#btn-toggle-right').classList.toggle('active', ui.rightOpen);
}

/* ============================================================
   模板库
   ============================================================ */
function categoryCounts() {
  const counts = { all: db.templates.length };
  db.categories.forEach((c) => { counts[c] = 0; });
  db.templates.forEach((t) => {
    counts[t.category] = (counts[t.category] || 0) + 1;
  });
  return counts;
}

function filteredTemplates() {
  let list = db.templates.slice();
  if (ui.category !== 'all') list = list.filter((t) => t.category === ui.category);
  const query = ui.search.trim().toLowerCase();
  if (query) {
    list = list.filter((t) => {
      if (t.name.toLowerCase().includes(query)) return true;
      if ((t.description || '').toLowerCase().includes(query)) return true;
      if ((t.tags || []).some((tag) => tag.toLowerCase().includes(query))) return true;
      if (t.objects.some((o) => o.type === 'character' && o.name.toLowerCase().includes(query))) return true;
      return false;
    });
  }
  if (ui.sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  } else if (ui.sort === 'created') {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }
  return list;
}

function renderLibrary() {
  renderCategoryRail();
  const counts = categoryCounts();
  const list = filteredTemplates();
  const totalChars = db.templates.reduce((sum, t) => sum + t.objects.filter((o) => o.type === 'character').length, 0);
  const mapCount = new Set(db.templates.map((t) => t.mapId)).size;

  $('#lib-title').textContent = ui.category === 'all' ? '战术模板库' : ui.category;
  $('#lib-lede').textContent = ui.category === 'all'
    ? '以一张可替换的战场底图为画布，标点、布阵、画路线，把“谁去哪里、什么时候去”讲清楚。'
    : `当前分类：${ui.category}。${counts[ui.category] || 0} 份模板，可按名称、标签或人物名继续筛选。`;

  const stats = $('#lib-stats');
  stats.replaceChildren(
    h('div', { class: 'stat' }, h('div', { class: 'v' }, String(db.templates.length).padStart(2, '0')), h('div', { class: 'k' }, 'TEMPLATES')),
    h('div', { class: 'stat' }, h('div', { class: 'v' }, String(totalChars)), h('div', { class: 'k' }, 'CHARACTERS')),
    h('div', { class: 'stat' }, h('div', { class: 'v' }, String(mapCount).padStart(2, '0')), h('div', { class: 'k' }, 'BASE MAPS'))
  );

  $('#lib-result-meta').textContent = list.length
    ? `${String(list.length).padStart(2, '0')} / ${String(db.templates.length).padStart(2, '0')} 已显示`
    : '没有匹配结果';

  $('#lib-error').hidden = !loadFailed;
  const grid = $('#card-grid');
  grid.replaceChildren();
  const empty = $('#lib-empty');
  if (!list.length) {
    grid.hidden = true;
    empty.hidden = false;
    const isFiltered = db.templates.length > 0;
    $('#empty-title').textContent = isFiltered ? '没有匹配的模板' : '还没有战术模板';
    $('#empty-desc').textContent = isFiltered
      ? '换一个关键词或切换分类；也可以直接新建一份模板。'
      : '新建一个模板，选择一张底图，从第一个集合点开始。';
    $('#btn-empty-new').hidden = false;
    $('#btn-empty-clear').hidden = !isFiltered;
    return;
  }
  grid.hidden = false;
  empty.hidden = true;
  const featured = !ui.search.trim() && list.length >= 3;
  list.forEach((t, index) => {
    grid.append(renderTemplateCard(t, featured && index === 0, index));
  });
}

function renderCategoryRail() {
  const counts = categoryCounts();
  const root = $('#cat-list');
  root.replaceChildren();
  const addItem = (key, label) => {
    const btn = h('button', {
      class: 'cat' + (ui.category === key ? ' active' : ''),
      role: 'tab',
      'aria-selected': ui.category === key ? 'true' : 'false',
      onclick: () => {
        ui.category = key;
        renderLibrary();
      }
    },
      h('i', { class: 'mark' }),
      h('span', { text: label }),
      h('span', { class: 'n', text: String(counts[key] || 0).padStart(2, '0') })
    );
    root.append(btn);
  };
  addItem('all', '全部模板');
  db.categories.forEach((c) => addItem(c, c));
}

function applyMapBackground(el, map) {
  if (!el) return;
  el.style.backgroundImage = `url("${map.src}")`;
  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = 'center';
}

function renderTemplateCard(t, featured, index) {
  const map = resolveMap(t.mapId);
  const chars = t.objects.filter((o) => o.type === 'character');
  const markers = t.objects.filter((o) => o.type === 'marker');
  const thumb = h('div', { class: 'thumb' },
    h('img', { src: map.src, alt: map.name, loading: 'lazy', draggable: false }),
    h('span', { class: 'cat-flag', text: t.category }),
    h('span', { class: 'map-flag', text: map.name }),
    h('span', { class: 'tpl-idx', text: 'T-' + String(index + 1).padStart(2, '0') })
  );
  const dots = t.objects.filter((o) => o.type === 'character' || o.type === 'marker').slice(0, featured ? 18 : 11);
  dots.forEach((o) => {
    const color = o.type === 'character' ? (CAMPS[o.camp] || CAMPS.neutral).color : (o.color || '#2F6F6A');
    thumb.append(h('i', {
      class: 'tdot' + (featured ? ' big' : ''),
      style: { left: (o.x * 100) + '%', top: (o.y * 100) + '%', background: color }
    }));
  });

  const tags = h('div', { class: 'tpl-tags' },
    (t.tags || []).slice(0, featured ? 4 : 2).map((tag) => h('span', { class: 'tag', text: tag }))
  );

  const card = h('article', {
    class: 'tpl' + (featured ? ' featured' : ''),
    tabindex: 0,
    style: { animationDelay: Math.min(index, 6) * 45 + 'ms' },
    dataset: { id: t.id },
    onclick: (e) => {
      if (e.target.closest('.card-mini')) return;
      location.hash = '#/editor/' + encodeURIComponent(t.id);
    },
    onkeydown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        location.hash = '#/editor/' + encodeURIComponent(t.id);
      }
    }
  },
    thumb,
    h('div', { class: 'tpl-body' },
      h('h3', { text: t.name }),
      h('p', { class: 'desc', text: t.description || '暂无描述，点击进入编辑器补充战术目标。' }),
      tags,
      h('div', { class: 'tpl-meta' },
        h('span', { text: (chars.length || 0) + ' 人' }),
        h('span', { class: 'sep' }),
        h('span', { text: (markers.length || 0) + ' 标点' }),
        h('span', { class: 'sep' }),
        h('span', { text: map.name, title: map.name }),
        h('span', { class: 'st', text: '更新 ' + dateFmt(t.updatedAt) })
      ),
      h('div', { class: 'tpl-actions' },
        h('span', { class: 'tpl-open' }, '打开编辑', icon('arrow-right')),
        h('span', { class: 'spacer' }),
        h('button', {
          class: 'card-mini',
          title: '复制模板',
          onclick: (e) => { e.stopPropagation(); copyTemplate(t.id); }
        }, icon('copy'), '复制'),
        h('button', {
          class: 'card-mini danger',
          title: '删除模板',
          onclick: (e) => { e.stopPropagation(); deleteTemplatePrompt(t.id); }
        }, icon('trash'), '删除')
      )
    )
  );
  return card;
}

function copyTemplate(id) {
  const index = db.templates.findIndex((t) => t.id === id);
  if (index < 0) return;
  const src = db.templates[index];
  const copy = clone(src);
  copy.id = uid('tpl');
  copy.objects = copy.objects.map((o) => {
    const next = clone(o);
    next.id = uid(o.type.slice(0, 2));
    return next;
  });
  copy.createdAt = nowIso();
  copy.updatedAt = nowIso();
  const base = src.name.replace(/\s*副本(?:\s*\d+)?$/, '').slice(0, 34);
  let candidate = base + ' 副本';
  let n = 2;
  while (db.templates.some((t) => t.name === candidate)) {
    candidate = base + ' 副本 ' + n;
    n += 1;
  }
  copy.name = candidate.slice(0, LIMITS.name);
  db.templates.splice(index + 1, 0, copy);
  saveNow();
  renderLibrary();
  toast('已复制为「' + copy.name + '」', 'ok');
}

async function deleteTemplatePrompt(id) {
  const t = db.templates.find((item) => item.id === id);
  if (!t) return;
  const chars = t.objects.filter((o) => o.type === 'character').length;
  const markers = t.objects.filter((o) => o.type === 'marker').length;
  const ok = await confirmDialog({
    eyebrow: 'DELETE TEMPLATE',
    title: '删除战术模板',
    subtitle: '删除后无法从模板库恢复，但可用撤销或备份找回。',
    message: h('div', {},
      h('p', { style: 'margin:0 0 6px' }, '即将删除：'),
      h('p', { style: 'margin:0 0 6px;font-family:var(--serif);font-size:15px;color:#3D2A26' },
        h('b', { text: t.name })),
      h('p', { style: 'margin:0;font-size:10px;color:#7A4A43' },
        `包含 ${chars} 位人物、${markers} 个标点。删除前建议先导出 JSON 备份。`)
    ),
    confirmText: '确认删除'
  });
  if (!ok) return;
  db.templates = db.templates.filter((item) => item.id !== id);
  if (db.lastTemplateId === id) db.lastTemplateId = null;
  saveNow();
  if (ui.view === 'editor') location.hash = '#/library';
  else renderLibrary();
  toast('模板已删除', 'warn');
}

/* ============================================================
   新建模板 / 新建分类
   ============================================================ */
function openNewTemplateModal() {
  if (guardEdit()) return;
  const draft = {
    name: '',
    category: ui.category !== 'all' ? ui.category : '未分类',
    mapId: DEFAULT_MAP_ID,
    description: '',
    tags: []
  };

  const nameInput = h('input', {
    type: 'text', maxlength: LIMITS.name, placeholder: '例如：开局 · 三路布防',
    autocomplete: 'off'
  });
  const categorySelect = h('select', {},
    db.categories.map((c) => h('option', { value: c, selected: c === draft.category }, c))
  );
  const mapSelect = h('select', {},
    allMaps().map((m) => h('option', { value: m.id, selected: m.id === draft.mapId }, m.name))
  );
  const descInput = h('textarea', { maxlength: LIMITS.description, rows: 3, placeholder: '这场战术的目标、分工或注意点（可选）' });
  const tagInput = h('input', { type: 'text', maxlength: 70, placeholder: '用逗号分隔，例如：开局, 三路, 默认' });
  const counter = h('span', { class: 'hint' }, h('span', { text: '0 / 200' }));
  const errorBox = h('div', { class: 'form-error', hidden: true });

  const body = h('div', {},
    errorBox,
    h('div', { class: 'form-field' },
      h('label', {}, '模板名称 ', h('span', { class: 'req', text: '*' })),
      nameInput,
      h('div', { class: 'hint' }, h('span', { text: '1–40 个字符，稍后可在编辑器内改名' }))
    ),
    h('div', { class: 'form-row' },
      h('div', { class: 'form-field' }, h('label', { text: '分类' }), categorySelect),
      h('div', { class: 'form-field' }, h('label', { text: '底图' }), mapSelect)
    ),
    h('div', { class: 'form-field' },
      h('label', { text: '描述' }), descInput, counter
    ),
    h('div', { class: 'form-field' },
      h('label', { text: '标签' }), tagInput,
      h('div', { class: 'hint' }, h('span', { text: '最多 5 个，每个 1–10 个字符' }))
    ),
    h('div', { class: 'form-field' },
      h('div', { class: 'preview-box' },
        '创建后将进入编辑器。底图可随时更换，所有对象使用归一化坐标，不会因换图而丢失。')
    )
  );

  const nameHint = body.querySelector('.form-field .hint span');
  nameInput.addEventListener('input', () => {
    if (nameHint) nameHint.textContent = `${nameInput.value.trim().length} / 40 · 稍后可在编辑器内改名`;
  });
  descInput.addEventListener('input', () => {
    counter.firstChild.textContent = `${descInput.value.length} / 200`;
  });

  const createBtn = h('button', { class: 'btn primary', disabled: true }, '创建并编辑');
  const updateDisabled = () => {
    createBtn.disabled = nameInput.value.trim().length === 0;
  };
  nameInput.addEventListener('input', updateDisabled);

  const submit = () => {
    const name = nameInput.value.trim();
    if (!name) {
      errorBox.hidden = false;
      errorBox.textContent = '请填写模板名称。';
      nameInput.focus();
      return false;
    }
    if (name.length > LIMITS.name) {
      errorBox.hidden = false;
      errorBox.textContent = '模板名称不能超过 40 个字符。';
      return false;
    }
    const tags = tagInput.value.split(/[,，、]/).map((t) => t.trim()).filter(Boolean);
    if (tags.length > LIMITS.tags) {
      errorBox.hidden = false;
      errorBox.textContent = '标签最多 5 个。';
      return false;
    }
    if (tags.some((t) => t.length > LIMITS.tagLen)) {
      errorBox.hidden = false;
      errorBox.textContent = '每个标签不能超过 10 个字符。';
      return false;
    }
    const template = normalizeTemplate({
      id: uid('tpl'),
      name,
      category: categorySelect.value,
      mapId: mapSelect.value,
      description: descInput.value.trim(),
      tags,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      layers: { markers: true, characters: true, annotations: true },
      objects: []
    });
    db.templates.unshift(template);
    db.lastTemplateId = template.id;
    saveNow();
    location.hash = '#/editor/' + encodeURIComponent(template.id);
    toast('模板已创建，先放一个集合点吧', 'ok');
    return true;
  };

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (submit()) closeModal();
    }
  });

  openModal({
    eyebrow: 'NEW TEMPLATE',
    title: '新建战术模板',
    subtitle: '先定型，再布阵。地图与分类之后都可以修改。',
    width: 560,
    body,
    actions: [
      { label: '取消', variant: 'ghost' },
      { label: '创建并编辑', variant: 'primary', onClick: submit }
    ]
  });
  setTimeout(() => nameInput.focus(), 40);
}

function openCategoryModal() {
  const input = h('input', { type: 'text', maxlength: 12, placeholder: '例如：开局偷鹅' });
  const errorBox = h('div', { class: 'form-error', hidden: true });
  const submit = () => {
    const name = input.value.trim();
    if (!name) {
      errorBox.hidden = false;
      errorBox.textContent = '请输入分类名称。';
      return false;
    }
    if (db.categories.includes(name)) {
      errorBox.hidden = false;
      errorBox.textContent = '这个分类已经存在。';
      return false;
    }
    db.categories.push(name);
    ui.category = name;
    saveNow();
    renderLibrary();
    toast('已新建分类「' + name + '」', 'ok');
    return true;
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (submit()) closeModal();
    }
  });
  openModal({
    eyebrow: 'NEW CATEGORY',
    title: '新建分类',
    subtitle: '分类用于归档模板，不会改变已有模板的内容。',
    width: 400,
    body: h('div', {}, errorBox,
      h('div', { class: 'form-field' }, h('label', { text: '分类名称' }), input,
        h('div', { class: 'hint' }, h('span', { text: '最多 12 个字符' })))
    ),
    actions: [
      { label: '取消', variant: 'ghost' },
      { label: '新建分类', variant: 'primary', onClick: submit }
    ]
  });
}

/* ============================================================
   编辑器：面板 / 地图 / 对象渲染
   ============================================================ */
function renderEditorAll() {
  const t = currentTemplate();
  if (!t) { showLibrary(); return; }
  updateEditorChrome(t);
  renderEditorHeader(t);
  renderTemplateInfo(t);
  renderLayers(t);
  renderMapNote(t);
  renderStage(t);
  renderRoster(t);
  renderSideTabs();
  renderProps(t);
  if (!$('#pane-legend').childElementCount) renderLegend(t);
  renderStatus(t);
  updateToolsUI();
  updateHint();
}

function renderEditorHeader(t) {
  const title = $('#ed-title');
  if (title.hidden) return;
  title.textContent = t.name;
  $('#ed-category').textContent = t.category;
  const map = resolveMap(t.mapId);
  $('#ed-map-badge').textContent = map.name.replace('百业战 · ', '');
  updateUndoButtons();
}

function updateUndoButtons() {
  const undoBtn = $('#btn-undo');
  const redoBtn = $('#btn-redo');
  if (undoBtn) undoBtn.disabled = history.index <= 0;
  if (redoBtn) redoBtn.disabled = history.index >= history.stack.length - 1;
}

function renderTemplateInfo(t) {
  const catSelect = $('#ti-category');
  if (document.activeElement !== catSelect) {
    catSelect.replaceChildren(...db.categories.map((c) =>
      h('option', { value: c, selected: c === t.category }, c)
    ));
    if (!db.categories.includes(t.category)) {
      catSelect.append(h('option', { value: t.category, selected: true }, t.category));
    }
  }
  $('#ti-count').textContent = t.objects.filter((o) => o.type === 'character').length + ' 人';
  $('#ti-map').textContent = resolveMap(t.mapId).name;
  $('#ti-map').title = resolveMap(t.mapId).name;

  const desc = $('#ti-desc');
  if (document.activeElement !== desc) desc.value = t.description || '';
  $('#ti-desc-count').textContent = (t.description || '').length + ' / 200';

  const tagRoot = $('#ti-tags');
  tagRoot.replaceChildren();
  if (!t.tags.length) {
    tagRoot.append(h('span', { style: 'font-size:9px;color:#A39A87', text: '暂无标签' }));
  } else {
    t.tags.forEach((tag) => {
      tagRoot.append(h('span', { class: 'tag' }, tag,
        h('button', {
          title: '移除标签',
          'aria-label': '移除标签 ' + tag,
          onclick: () => removeTag(tag)
        }, '×')
      ));
    });
  }
}

function renderLayers(t) {
  const root = $('#layer-list');
  const markerCount = t.objects.filter((o) => o.type === 'marker').length;
  const charCount = t.objects.filter((o) => o.type === 'character').length;
  const noteCount = t.objects.filter((o) => o.type === 'route' || o.type === 'text').length;
  root.replaceChildren();

  root.append(h('div', { class: 'layer locked' },
    icon('map'),
    h('span', { text: '地图底图' }),
    h('span', { class: 'lock', text: '锁定' })
  ));

  const row = (key, label, count, iconName) => {
    const on = t.layers[key] !== false;
    const btn = h('button', {
      class: 'layer ' + (on ? 'on' : 'off'),
      title: '显示/隐藏' + label,
      onclick: () => toggleLayer(key)
    },
      icon(iconName),
      h('span', { text: label }),
      h('span', { class: 'n', text: String(count) }),
      h('span', { class: 'sw' })
    );
    root.append(btn);
  };
  row('markers', '标点', markerCount, 'pin');
  row('characters', '人物', charCount, 'users');
  row('annotations', '文字与路线', noteCount, 'route');
}

function renderMapNote(t) {
  const map = resolveMap(t.mapId);
  $('#map-note-name').textContent = map.name;
  $('#map-note-name').title = map.name;
  $('#map-note-size').textContent = `${map.width} × ${map.height}${map.builtin ? ' · 内置' : ' · 自定义'}`;
  const oldWarn = $('#map-note-warn');
  if (oldWarn) oldWarn.remove();
  if (mapMissing) {
    $('#map-note-size').after(h('div', { id: 'map-note-warn', class: 'map-warn' },
      '模板引用的底图「' + t.mapId + '」在本浏览器不存在，已自动回退到默认底图。'
    ));
  }
  $('#btn-reset-map').disabled = t.mapId === DEFAULT_MAP_ID;
}

function renderStage(t) {
  const map = resolveMap(t.mapId);
  const key = map.id + '|' + map.width + 'x' + map.height;
  const world = $('#map-world');
  const img = $('#map-img');
  if (key !== currentMapIdKey) {
    currentMapIdKey = key;
    world.style.width = map.width + 'px';
    world.style.height = map.height + 'px';
    const routeSvg = $('#route-svg');
    routeSvg.setAttribute('viewBox', `0 0 ${map.width} ${map.height}`);
    img.onload = () => {
      mapError = false;
      $('#map-error').hidden = true;
      applyTransform();
    };
    img.onerror = () => {
      mapError = true;
      $('#map-error').hidden = false;
    };
    img.src = map.src;
  } else if (mapError) {
    $('#map-error').hidden = false;
  }
  renderObjects(t);
  if (!view.fit) layoutStage(true);
  applyTransform();
}

function renderObjects(t) {
  const map = currentMap();
  const objLayer = $('#obj-layer');
  const routeSvg = $('#route-svg');
  objLayer.replaceChildren();
  routeSvg.replaceChildren();

  if (t.layers.annotations) {
    renderRoutes(t, map, routeSvg);
  }
  if (t.layers.markers) {
    t.objects.filter((o) => o.type === 'marker' && o.visible !== false).forEach((o) => {
      objLayer.append(markerElement(o, map));
    });
  }
  if (t.layers.characters) {
    t.objects.filter((o) => o.type === 'character' && o.visible !== false).forEach((o) => {
      objLayer.append(characterElement(o, map));
    });
  }
  if (t.layers.annotations) {
    t.objects.filter((o) => o.type === 'text' && o.visible !== false).forEach((o) => {
      objLayer.append(textElement(o, map));
    });
    t.objects.filter((o) => o.type === 'route' && o.visible !== false && o.label).forEach((o) => {
      objLayer.append(routeTagElement(o, map));
    });
  }
  if (drawing) renderRoutePreview(map);
}

function characterElement(o, map) {
  const el = h('div', {
    class: 'ob' + (o.camp === 'enemy' ? ' camp-enemy' : ''),
    dataset: { id: o.id, kind: 'character' },
    style: `left:${o.x * 100}%;top:${o.y * 100}%;z-index:40;--school:${o.color};--camp:${CAMPS[o.camp].color}`
  });
  el.append(
    h('div', { class: 'ch-dot' + (o.abbr.length > 1 ? ' two' : '') }, o.abbr || schoolDef(o.school).abbr),
    h('div', { class: 'ch-name', text: o.name })
  );
  el.addEventListener('pointerdown', (e) => onObjectPointerDown(e, o));
  return el;
}

function markerElement(o, map) {
  const def = typeDef(o.markerType);
  const size = { s: 24, m: 32, l: 40 }[o.size] || 32;
  const el = h('div', {
    class: 'ob',
    dataset: { id: o.id, kind: 'marker' },
    style: `left:${o.x * 100}%;top:${o.y * 100}%;z-index:20;--sz:${size}px;--pin:${o.color};--state:${stateTone(o)}`
  });
  const pin = h('div', { class: 'mk-pin' },
    h('div', { class: 'pin-shape' }),
    h('span', { class: 'pin-abbr', text: def.abbr }),
    o.state ? h('span', { class: 'state-dot', title: o.state }) : null
  );
  el.append(pin);
  if (o.label) el.append(h('div', { class: 'mk-label', text: o.label }));
  el.addEventListener('pointerdown', (e) => onObjectPointerDown(e, o));
  return el;
}

function textElement(o, map) {
  const el = h('div', {
    class: 'ob',
    dataset: { id: o.id, kind: 'text' },
    style: `left:${o.x * 100}%;top:${o.y * 100}%;z-index:60;`
  });
  el.append(h('div', {
    class: 'map-text',
    text: o.content,
    style: `font-size:${o.fontSize}px;--txt:${o.color}`
  }));
  el.addEventListener('pointerdown', (e) => onObjectPointerDown(e, o));
  return el;
}

function routeTagElement(o, map) {
  const mid = routeMidpoint(o);
  const el = h('div', {
    class: 'ob',
    dataset: { id: o.id, kind: 'route' },
    style: `left:${mid.x * 100}%;top:${mid.y * 100}%;z-index:12;`
  });
  el.append(h('div', { class: 'route-tag', text: o.label }));
  el.addEventListener('pointerdown', (e) => onObjectPointerDown(e, o));
  return el;
}

function routeMidpoint(route) {
  const pts = route.points;
  if (!pts.length) return { x: 0.5, y: 0.5 };
  if (pts.length === 1) return pts[0];
  const total = [];
  let length = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = (pts[i].x - pts[i - 1].x);
    const dy = (pts[i].y - pts[i - 1].y);
    const seg = Math.hypot(dx, dy);
    total.push({ from: pts[i - 1], to: pts[i], seg });
    length += seg;
  }
  let half = length / 2;
  for (const item of total) {
    if (half <= item.seg) {
      const r = item.seg ? half / item.seg : 0;
      return {
        x: item.from.x + (item.to.x - item.from.x) * r,
        y: item.from.y + (item.to.y - item.from.y) * r
      };
    }
    half -= item.seg;
  }
  return pts[pts.length - 1];
}

function renderRoutes(t, map, root) {
  const defs = svg('defs');
  root.append(defs);
  const routes = t.objects.filter((o) => o.type === 'route' && o.visible !== false);
  routes.forEach((route) => {
    const points = route.points.map((p) => `${(p.x * map.width).toFixed(1)},${(p.y * map.height).toFixed(1)}`).join(' ');
    const style = ROUTE_STYLES[route.style] || ROUTE_STYLES.attack;
    const markerId = 'arr_' + route.id.replace(/[^a-zA-Z0-9_-]/g, '');
    const selected = ui.selection && ui.selection.kind === 'route' && ui.selection.id === route.id;
    defs.append(svg('marker', {
      id: markerId, markerUnits: 'strokeWidth', markerWidth: 7, markerHeight: 7,
      refX: 6, refY: 3.5, orient: 'auto'
    }, svg('path', { d: 'M0,0 L7,3.5 L0,7 L1.8,3.5 Z', fill: route.color })));

    const g = svg('g', { class: 'route-g' + (selected ? ' sel' : ''), 'data-id': route.id });
    const hit = svg('polyline', { points, class: 'route-hit' });
    hit.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (drawing) return;
      selectObject('route', route.id);
    });
    const line = svg('polyline', {
      points, class: 'route-line',
      stroke: route.color,
      'stroke-width': route.width,
      'stroke-dasharray': style.dash || null,
      'marker-end': route.arrow ? `url(#${markerId})` : null
    });
    g.append(hit, line);
    if (selected) {
      route.points.forEach((p) => {
        g.append(svg('circle', {
          cx: p.x * map.width, cy: p.y * map.height, r: 4.5,
          class: 'route-node sel', stroke: route.color
        }));
      });
    }
    root.append(g);
  });
}

function renderRoutePreview(map) {
  if (!drawing) return;
  const root = $('#route-svg');
  let g = root.querySelector('.route-draw');
  if (g) g.remove();
  g = svg('g', { class: 'route-draw' });
  const pts = drawing.points.slice();
  if (drawing.cursor) pts.push(drawing.cursor);
  if (pts.length >= 2) {
    g.append(svg('polyline', {
      points: pts.map((p) => `${(p.x * map.width).toFixed(1)},${(p.y * map.height).toFixed(1)}`).join(' '),
      class: 'route-preview'
    }));
  }
  drawing.points.forEach((p) => {
    g.append(svg('circle', {
      cx: p.x * map.width, cy: p.y * map.height, r: 4,
      class: 'route-node sel', stroke: '#B08A45'
    }));
  });
  if (drawing.cursor) {
    g.append(svg('circle', {
      cx: drawing.cursor.x * map.width, cy: drawing.cursor.y * map.height, r: 3,
      class: 'route-node', stroke: '#B08A45'
    }));
  }
  root.append(g);
}

/* ============================================================
   地图视图：布局 / 缩放 / 平移 / 局部部署
   ============================================================ */
function centerMap() {
  const stage = $('#stage');
  const map = currentMap();
  const sw = stage.clientWidth;
  const sh = stage.clientHeight;
  const k = view.fit * view.zoom;
  view.panX = (sw - map.width * k) / 2;
  view.panY = (sh - map.height * k) / 2;
}

function layoutStage(reset = false) {
  const stage = $('#stage');
  const map = currentMap();
  const sw = stage.clientWidth;
  const sh = stage.clientHeight;
  if (!sw || !sh) return;
  const oldFit = view.fit || 1;
  const nextFit = Math.min(sw / map.width, sh / map.height) * 0.965;
  if (reset || !view.fit) {
    view.fit = nextFit;
    view.zoom = 1;
    view.sector = null;
    view.label = '';
    centerMap();
  } else if (Math.abs(nextFit - oldFit) > 0.00001) {
    const cx = sw / 2;
    const cy = sh / 2;
    const k0 = oldFit * view.zoom;
    const k1 = nextFit * view.zoom;
    const wx = (cx - view.panX) / k0;
    const wy = (cy - view.panY) / k0;
    view.fit = nextFit;
    view.panX = cx - wx * k1;
    view.panY = cy - wy * k1;
  }
  clampPan();
  applyTransform();
}

function clampPan() {
  const stage = $('#stage');
  const map = currentMap();
  const sw = stage.clientWidth;
  const sh = stage.clientHeight;
  const k = view.fit * view.zoom;
  const w = map.width * k;
  const h = map.height * k;
  const margin = 90;
  view.panX = clamp(view.panX, -w + margin, sw - margin);
  view.panY = clamp(view.panY, -h + margin, sh - margin);
}

function applyTransform() {
  const stage = $('#stage');
  const world = $('#map-world');
  if (!stage || !world || !view.fit) return;
  const k = view.fit * view.zoom;
  world.style.transform = `translate(${view.panX}px, ${view.panY}px) scale(${k})`;
  stage.style.setProperty('--inv', String(1 / k));
  stage.classList.toggle('names-hidden', view.zoom < 0.7);
  updateSectorOverlay();
  updateCrumb();
  updateZoomUI();
}

function setZoom(target, anchor, opts = {}) {
  const stage = $('#stage');
  const next = clamp(target, 0.25, 4);
  if (Math.abs(next - view.zoom) < 0.0004) return;
  const k0 = view.fit * view.zoom;
  const k1 = view.fit * next;
  const ax = anchor ? anchor.px : stage.clientWidth / 2;
  const ay = anchor ? anchor.py : stage.clientHeight / 2;
  view.panX = ax - (ax - view.panX) * (k1 / k0);
  view.panY = ay - (ay - view.panY) * (k1 / k0);
  view.zoom = next;
  if (next <= 1.001 && !opts.keepSector) {
    view.sector = null;
    view.label = '';
  }
  clampPan();
  applyTransform();
  renderStatus();
}

function fitView() {
  view.zoom = 1;
  view.sector = null;
  view.label = '';
  const stage = $('#stage');
  const map = currentMap();
  view.fit = Math.min(stage.clientWidth / map.width, stage.clientHeight / map.height) * 0.965;
  centerMap();
  clampPan();
  applyTransform();
  renderStatus();
  closePicker();
}

function updateZoomUI() {
  const pct = Math.round(view.zoom * 100);
  const val = $('#zoom-val');
  if (val) val.textContent = pct + '%';
  const range = $('#zoom-range');
  if (range) range.value = String(pct);
  const out = $('#btn-zoom-out');
  const inc = $('#btn-zoom-in');
  if (out) out.disabled = pct <= 25;
  if (inc) inc.disabled = pct >= 400;
}

function updateCrumb() {
  const crumb = $('#view-crumb');
  if (!crumb || !view.sector) {
    if (crumb) crumb.hidden = true;
    return;
  }
  crumb.hidden = false;
  $('#crumb-txt').textContent = `局部视图 · ${view.label || '局部'} · ${Math.round(view.zoom * 100)}%`;
}

function updateSectorOverlay() {
  const rect = $('#sector-rect');
  if (!rect) return;
  if (!view.sector) { rect.hidden = true; return; }
  const map = currentMap();
  const k = view.fit * view.zoom;
  const left = view.panX + view.sector.x * map.width * k;
  const top = view.panY + view.sector.y * map.height * k;
  rect.hidden = false;
  rect.style.left = left + 'px';
  rect.style.top = top + 'px';
  rect.style.width = Math.max(2, view.sector.w * map.width * k) + 'px';
  rect.style.height = Math.max(2, view.sector.h * map.height * k) + 'px';
  $('#sector-tag').textContent = '局部部署' + (view.label ? ' · ' + view.label : '');
}

function regionLabel(y) {
  if (y < 0.38) return '上路';
  if (y > 0.62) return '下路';
  return '中路';
}

function stagePoint(e) {
  const r = $('#stage').getBoundingClientRect();
  return { px: e.clientX - r.left, py: e.clientY - r.top };
}

function screenToNorm(px, py, withSnap = false) {
  const map = currentMap();
  const k = view.fit * view.zoom;
  let x = (px - view.panX) / (map.width * k);
  let y = (py - view.panY) / (map.height * k);
  x = clamp(x, 0, 1);
  y = clamp(y, 0, 1);
  if (withSnap && ui.snap) {
    let sx = view.panX + x * map.width * k;
    let sy = view.panY + y * map.height * k;
    sx = Math.round(sx / ui.snap) * ui.snap;
    sy = Math.round(sy / ui.snap) * ui.snap;
    x = clamp((sx - view.panX) / (map.width * k), 0, 1);
    y = clamp((sy - view.panY) / (map.height * k), 0, 1);
  }
  return { x: round4(x), y: round4(y) };
}

/* ============================================================
   选择 / 历史 / 内容变更
   ============================================================ */
function selectObject(kind, id) {
  const t = currentTemplate();
  if (!t) return;
  if (!kind || !id) {
    ui.selection = null;
  } else {
    const obj = t.objects.find((o) => o.id === id && o.type === kind);
    if (!obj) { ui.selection = null; }
    else {
      ui.selection = { kind, id };
      ui.tab = 'props';
    }
  }
  renderObjects(t);
  applyTransform();
  renderSideTabs();
  renderRoster(t);
  renderProps(t);
}

function pushHistory() {
  history.stack = history.stack.slice(0, history.index + 1);
  history.stack.push(clone(db.templates));
  if (history.stack.length > LIMITS.undo + 1) history.stack.shift();
  history.index = history.stack.length - 1;
  updateUndoButtons();
}

function undo() {
  if (ui.view !== 'editor') return;
  if (history.index <= 0) { toast('没有可撤销的操作', 'warn'); return; }
  history.index -= 1;
  db.templates = clone(history.stack[history.index]);
  if (!currentTemplate()) {
    db.lastTemplateId = db.templates[0] ? db.templates[0].id : null;
  }
  ui.selection = null;
  scheduleSave();
  renderEditorAll();
  toast('已撤销', 'ok');
}

function redo() {
  if (ui.view !== 'editor') return;
  if (history.index >= history.stack.length - 1) { toast('没有可重做的操作', 'warn'); return; }
  history.index += 1;
  db.templates = clone(history.stack[history.index]);
  if (!currentTemplate()) {
    db.lastTemplateId = db.templates[0] ? db.templates[0].id : null;
  }
  ui.selection = null;
  scheduleSave();
  renderEditorAll();
  toast('已重做', 'ok');
}

function mutateCurrent(fn, opts = {}) {
  const t = currentTemplate();
  if (!t) return null;
  if (isReadonly()) return null;
  const result = fn(t);
  t.updatedAt = nowIso();
  if (opts.history !== false) pushHistory();
  scheduleSave();
  if (opts.rerender !== false) renderEditorAll();
  return result;
}

function toggleLayer(key) {
  if (guardEdit()) return;
  const t = currentTemplate();
  if (!t) return;
  t.layers[key] = t.layers[key] === false;
  t.updatedAt = nowIso();
  scheduleSave();
  renderLayers(t);
  renderStage(t);
  renderStatus(t);
}

function deleteSelected() {
  const t = currentTemplate();
  if (!t || !ui.selection) return;
  if (guardEdit()) return;
  const obj = currentObject();
  if (!obj) return;
  t.objects = t.objects.filter((o) => o.id !== obj.id);
  t.updatedAt = nowIso();
  pushHistory();
  scheduleSave();
  ui.selection = null;
  renderEditorAll();
  toast('已删除，可按 Ctrl+Z 撤销', 'warn');
}

function duplicateSelected() {
  const t = currentTemplate();
  if (!t || !ui.selection) return;
  if (guardEdit()) return;
  if (t.objects.length >= LIMITS.totalObjects) {
    toast('单模板对象上限 200 个，无法继续复制', 'warn');
    return;
  }
  const src = currentObject();
  if (!src) return;
  const map = currentMap();
  const k = view.fit * view.zoom;
  const dx = 16 / (map.width * k);
  const dy = 16 / (map.height * k);
  const copy = clone(src);
  copy.id = uid(src.type.slice(0, 2));
  if (src.type === 'route') {
    copy.points = src.points.map((p) => ({
      x: round4(clamp(p.x + dx, 0, 1)),
      y: round4(clamp(p.y + dy, 0, 1))
    }));
  } else {
    copy.x = round4(clamp(src.x + dx, 0, 1));
    copy.y = round4(clamp(src.y + dy, 0, 1));
    if (src.type === 'character' && src.camp === 'ally' && t.objects.filter((o) => o.type === 'character').length >= LIMITS.characters) {
      toast('单模板人物上限 60 人，无法继续复制人物', 'warn');
      return;
    }
    if (src.type === 'character') {
      let n = 2;
      let name = src.name.replace(/·副\d*$/, '').slice(0, 9) + '·副';
      while (t.objects.some((o) => o.type === 'character' && o.name === name)) {
        name = src.name.replace(/·副\d*$/, '').slice(0, 8) + '·副' + n;
        n += 1;
      }
      copy.name = name.slice(0, LIMITS.charName);
    }
  }
  t.objects.push(copy);
  t.updatedAt = nowIso();
  pushHistory();
  scheduleSave();
  ui.selection = { kind: copy.type, id: copy.id };
  ui.tab = 'props';
  renderEditorAll();
  toast('已复制并偏移 16px', 'ok');
}

function centerOnObject(obj) {
  if (!obj) return;
  const stage = $('#stage');
  const map = currentMap();
  if (view.zoom < 1) view.zoom = 1;
  const k = view.fit * view.zoom;
  view.panX = stage.clientWidth / 2 - obj.x * map.width * k;
  view.panY = stage.clientHeight / 2 - obj.y * map.height * k;
  clampPan();
  applyTransform();
  renderStatus();
}

function renderStatus(t = currentTemplate()) {
  if (!t) return;
  const chars = t.objects.filter((o) => o.type === 'character').length;
  const markers = t.objects.filter((o) => o.type === 'marker').length;
  const routes = t.objects.filter((o) => o.type === 'route').length;
  const texts = t.objects.filter((o) => o.type === 'text').length;
  $('#st-objects').textContent = String(t.objects.length);
  $('#st-chars').textContent = String(chars);
  $('#st-markers').textContent = String(markers);
  $('#st-map').textContent = '底图 ' + resolveMap(t.mapId).name;
  $('#st-map').title = `底图 ID：${resolveMap(t.mapId).id} · 标点 ${markers} · 路线 ${routes} · 文字 ${texts}`;
  updateSaveUI();
  updateZoomUI();
  updateUndoButtons();
}

/* ============================================================
   画布交互
   ============================================================ */
let spaceDown = false;

function onStagePointerDown(e) {
  if (ui.view !== 'editor') return;
  if (e.button !== 0 && e.button !== 1) return;
  if (e.target.closest('.stage-tools, .mk-picker, .view-crumb, .map-error, .readonly-banner')) return;

  if (e.button === 1 || (e.button === 0 && (ui.tool === 'pan' || spaceDown))) {
    e.preventDefault();
    panDrag = { sx: e.clientX, sy: e.clientY, px: view.panX, py: view.panY, id: e.pointerId };
    $('#stage').classList.add('panning');
    $('#stage').setPointerCapture(e.pointerId);
    return;
  }
  if (e.button !== 0) return;
  if (ui.tool === 'sector') {
    e.preventDefault();
    const p = stagePoint(e);
    sectorDrag = { sx: p.px, sy: p.py, cx: p.px, cy: p.py, id: e.pointerId };
    $('#stage').setPointerCapture(e.pointerId);
    updateSelectionRect();
    return;
  }
  if (ui.tool === 'marker') {
    if (guardEdit()) return;
    const p = stagePoint(e);
    openMarkerPicker(p, screenToNorm(p.px, p.py, true));
    return;
  }
  if (ui.tool === 'text') {
    if (guardEdit()) return;
    const p = stagePoint(e);
    placeText(screenToNorm(p.px, p.py, true));
    return;
  }
  if (ui.tool === 'route') {
    if (guardEdit()) return;
    const p = stagePoint(e);
    addRoutePoint(screenToNorm(p.px, p.py, true));
    return;
  }
  if (ui.tool === 'select') {
    closePicker();
    selectObject(null, null);
  }
}

function onStagePointerMove(e) {
  if (ui.view !== 'editor') return;
  const p = stagePoint(e);
  updateCoordReadout(p);
  if (panDrag) {
    view.panX = panDrag.px + (e.clientX - panDrag.sx);
    view.panY = panDrag.py + (e.clientY - panDrag.sy);
    clampPan();
    applyTransform();
    return;
  }
  if (sectorDrag) {
    sectorDrag.cx = p.px;
    sectorDrag.cy = p.py;
    updateSelectionRect();
    return;
  }
  if (drawing) {
    drawing.cursor = screenToNorm(p.px, p.py);
    renderRoutePreview(currentMap());
  }
}

function onStagePointerUp(e) {
  if (panDrag) {
    panDrag = null;
    $('#stage').classList.remove('panning');
    try { $('#stage').releasePointerCapture(e.pointerId); } catch (_) {}
    renderStatus();
    return;
  }
  if (sectorDrag) {
    const dragState = sectorDrag;
    sectorDrag = null;
    $('#selection-rect').hidden = true;
    try { $('#stage').releasePointerCapture(e.pointerId); } catch (_) {}
    finishSectorSelection(dragState);
  }
}

function updateCoordReadout(p) {
  const n = screenToNorm(p.px, p.py);
  const el = $('#st-coord');
  if (el) el.textContent = `X ${(n.x * 100).toFixed(1)}%   Y ${(n.y * 100).toFixed(1)}%`;
}

function updateSelectionRect() {
  const rect = $('#selection-rect');
  if (!sectorDrag) { rect.hidden = true; return; }
  const bounds = mapScreenBounds();
  const x1 = clamp(Math.min(sectorDrag.sx, sectorDrag.cx), bounds.x1, bounds.x2);
  const x2 = clamp(Math.max(sectorDrag.sx, sectorDrag.cx), bounds.x1, bounds.x2);
  const y1 = clamp(Math.min(sectorDrag.sy, sectorDrag.cy), bounds.y1, bounds.y2);
  const y2 = clamp(Math.max(sectorDrag.sy, sectorDrag.cy), bounds.y1, bounds.y2);
  rect.hidden = false;
  rect.style.left = x1 + 'px';
  rect.style.top = y1 + 'px';
  rect.style.width = Math.max(0, x2 - x1) + 'px';
  rect.style.height = Math.max(0, y2 - y1) + 'px';
}

function mapScreenBounds() {
  const map = currentMap();
  const k = view.fit * view.zoom;
  return {
    x1: view.panX,
    y1: view.panY,
    x2: view.panX + map.width * k,
    y2: view.panY + map.height * k
  };
}

function finishSectorSelection(dragState) {
  const stage = $('#stage');
  const map = currentMap();
  const bounds = mapScreenBounds();
  const x1 = Math.max(Math.min(dragState.sx, dragState.cx), bounds.x1, 0);
  const x2 = Math.min(Math.max(dragState.sx, dragState.cx), bounds.x2, stage.clientWidth);
  const y1 = Math.max(Math.min(dragState.sy, dragState.cy), bounds.y1, 0);
  const y2 = Math.min(Math.max(dragState.sy, dragState.cy), bounds.y2, stage.clientHeight);
  const w = x2 - x1;
  const h = y2 - y1;
  if (w < 24 || h < 24) {
    toast('选区太小，请重新框选', 'warn');
    return;
  }
  if (x2 <= bounds.x1 || y1 >= bounds.y2) {
    toast('选区不在底图范围内', 'warn');
    return;
  }
  const k0 = view.fit * view.zoom;
  const nx = (x1 - view.panX) / (map.width * k0);
  const ny = (y1 - view.panY) / (map.height * k0);
  const nw = w / (map.width * k0);
  const nh = h / (map.height * k0);
  const targetW = stage.clientWidth * 0.90;
  const targetH = stage.clientHeight * 0.90;
  let zoom = Math.min(
    targetW / (nw * map.width * view.fit),
    targetH / (nh * map.height * view.fit)
  );
  zoom = clamp(zoom, 0.25, 4);
  view.zoom = zoom;
  view.sector = { x: round4(nx), y: round4(ny), w: round4(nw), h: round4(nh) };
  view.label = regionLabel(ny + nh / 2);
  const k = view.fit * zoom;
  view.panX = stage.clientWidth / 2 - (nx + nw / 2) * map.width * k;
  view.panY = stage.clientHeight / 2 - (ny + nh / 2) * map.height * k;
  clampPan();
  setTool('select');
  applyTransform();
  renderStatus();
  toast(`已进入局部部署 · ${view.label}`, 'ok');
}

function returnToFullView() {
  fitView();
  toast('已返回全图', 'ok');
}

function zoomIn() {
  setZoom(view.zoom * 1.25);
}
function zoomOut() {
  setZoom(view.zoom / 1.25);
}

function onObjectPointerDown(e, obj) {
  if (ui.view !== 'editor') return;
  if (e.button !== 0) return;
  e.stopPropagation();
  e.preventDefault();
  if (drawing) {
    if (ui.tool === 'route') {
      addRoutePoint(screenToNorm(stagePoint(e).px, stagePoint(e).py, true));
    }
    return;
  }
  selectObject(obj.type, obj.id);
  if (isReadonly() || ui.tool !== 'select') return;
  const t = currentTemplate();
  if (!t) return;
  drag = {
    objId: obj.id,
    before: clone(db.templates),
    sx: e.clientX,
    sy: e.clientY,
    origX: obj.x,
    origY: obj.y,
    moved: false
  };
  const onMove = (ev) => {
    if (!drag) return;
    if (Math.abs(ev.clientX - drag.sx) > 2 || Math.abs(ev.clientY - drag.sy) > 2) drag.moved = true;
    const p = stagePoint(ev);
    const norm = screenToNorm(p.px, p.py, true);
    const target = t.objects.find((o) => o.id === drag.objId);
    if (!target) return;
    target.x = norm.x;
    target.y = norm.y;
    const el = $('#obj-layer').querySelector(`.ob[data-id="${drag.objId}"]`);
    if (el) {
      el.style.left = norm.x * 100 + '%';
      el.style.top = norm.y * 100 + '%';
    }
    const readout = $('#st-coord');
    if (readout) readout.textContent = `X ${(norm.x * 100).toFixed(1)}%   Y ${(norm.y * 100).toFixed(1)}%`;
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    if (!drag) return;
    if (drag.moved) {
      t.updatedAt = nowIso();
      pushHistory();
      scheduleSave();
      renderProps(t);
      renderStatus(t);
    }
    drag = null;
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp, { once: true });
}

/* ============================================================
   标点选择器 / 文字 / 路线
   ============================================================ */
function openMarkerPicker(point, norm) {
  pickerPoint = norm;
  const picker = $('#mk-picker');
  picker.replaceChildren(
    h('div', { class: 'mk-picker-head' },
      h('b', { text: '选择标点类型' }),
      h('button', { 'aria-label': '关闭', onclick: closePicker }, '×')
    ),
    h('div', { class: 'mk-picker-grid' },
      MARKER_TYPES.map((def) => h('button', {
        class: 'mk-pick',
        type: 'button',
        title: def.name,
        onclick: () => placeMarker(def.key)
      },
        h('i', { class: 'mini-pin', style: `--pin:${def.color}` }),
        h('span', { text: def.abbr })
      ))
    )
  );
  picker.hidden = false;
  const stage = $('#stage');
  const pw = picker.offsetWidth || 292;
  const ph = picker.offsetHeight || 210;
  picker.style.left = clamp(point.px + 10, 8, Math.max(8, stage.clientWidth - pw - 8)) + 'px';
  picker.style.top = clamp(point.py + 10, 8, Math.max(8, stage.clientHeight - ph - 8)) + 'px';
}

function closePicker() {
  const picker = $('#mk-picker');
  if (picker) picker.hidden = true;
  pickerPoint = null;
}

function placeMarker(typeKey) {
  const t = currentTemplate();
  if (!t || !pickerPoint) return;
  if (guardEdit()) return;
  if (t.layers.markers === false) {
    toast('标点图层已隐藏，请先在左侧图层面板开启', 'warn');
    closePicker();
    return;
  }
  if (t.objects.length >= LIMITS.totalObjects) {
    toast('单模板对象上限 200 个，无法继续添加', 'warn');
    closePicker();
    return;
  }
  const def = typeDef(typeKey);
  const marker = {
    id: uid('mk'), type: 'marker', markerType: def.key,
    x: pickerPoint.x, y: pickerPoint.y,
    label: '', state: def.states[0] || '', color: def.color,
    size: 'm', note: '', visible: true
  };
  t.objects.push(marker);
  t.updatedAt = nowIso();
  pushHistory();
  scheduleSave();
  closePicker();
  ui.selection = { kind: 'marker', id: marker.id };
  ui.tab = 'props';
  setTool('marker');
  renderEditorAll();
}

function placeText(norm) {
  const t = currentTemplate();
  if (!t) return;
  if (t.layers.annotations === false) {
    toast('文字与路线图层已隐藏，请先在左侧图层面板开启', 'warn');
    return;
  }
  if (t.objects.length >= LIMITS.totalObjects) {
    toast('单模板对象上限 200 个，无法继续添加', 'warn');
    return;
  }
  const textObj = {
    id: uid('tx'), type: 'text', x: norm.x, y: norm.y,
    content: '文字', fontSize: 16, color: '#1F2420', visible: true
  };
  t.objects.push(textObj);
  t.updatedAt = nowIso();
  pushHistory();
  scheduleSave();
  ui.selection = { kind: 'text', id: textObj.id };
  ui.tab = 'props';
  renderEditorAll();
  setTimeout(() => {
    const input = $('#prop-text-content');
    if (input) { input.focus(); input.select(); }
  }, 60);
}

function startRoute() {
  if (!drawing) {
    drawing = { points: [], style: 'attack', cursor: null };
    updateHint();
    renderRoutePreview(currentMap());
  }
}

function addRoutePoint(norm) {
  const t = currentTemplate();
  if (!t) return;
  if (t.layers.annotations === false) {
    toast('文字与路线图层已隐藏，请先在左侧图层面板开启', 'warn');
    return;
  }
  if (!drawing) drawing = { points: [], style: 'attack', cursor: null };
  const last = drawing.points[drawing.points.length - 1];
  if (last) {
    const dist = Math.hypot(last.x - norm.x, last.y - norm.y);
    if (dist < 0.003) return;
  }
  drawing.points.push(norm);
  renderRoutePreview(currentMap());
  updateHint();
}

function finishRoute() {
  const t = currentTemplate();
  if (!t || !drawing) return;
  if (drawing.points.length < 2) {
    toast('路线至少需要 2 个折点', 'warn');
    return;
  }
  if (t.objects.length >= LIMITS.totalObjects) {
    toast('单模板对象上限 200 个，无法继续添加', 'warn');
    return;
  }
  const route = {
    id: uid('rt'), type: 'route',
    label: ROUTE_STYLES[drawing.style].name + '路线',
    points: drawing.points.map((p) => ({ x: p.x, y: p.y })),
    style: drawing.style,
    color: ROUTE_STYLES[drawing.style].color,
    width: 2.5,
    arrow: true,
    note: '',
    visible: true
  };
  drawing = null;
  t.objects.push(route);
  t.updatedAt = nowIso();
  pushHistory();
  scheduleSave();
  ui.selection = { kind: 'route', id: route.id };
  ui.tab = 'props';
  renderEditorAll();
  toast('路线已添加，可在右侧属性中调整', 'ok');
}

function cancelRoute() {
  if (!drawing) return;
  drawing = null;
  const t = currentTemplate();
  if (t) renderObjects(t);
  updateHint();
  toast('已取消绘制路线', 'warn');
}

/* ============================================================
   工具状态
   ============================================================ */
function setTool(tool) {
  if (tool === 'character') {
    openCharacterModal();
    return;
  }
  if (ui.tool === 'route' && drawing && tool !== 'route') cancelRoute();
  ui.tool = tool;
  closePicker();
  updateToolsUI();
  updateHint();
  renderStatus();
}

function updateToolsUI() {
  $$('#stage-tools .tool').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tool === ui.tool);
    if (['marker', 'character', 'route', 'text', 'sector'].includes(btn.dataset.tool)) {
      btn.disabled = isReadonly();
    }
  });
  const stage = $('#stage');
  stage.classList.toggle('cursor-pan', ui.tool === 'pan');
  stage.classList.toggle('cursor-cross', ['marker', 'route', 'sector'].includes(ui.tool));
  stage.classList.toggle('cursor-text', ui.tool === 'text');
}

function updateHint() {
  const hint = $('#stage-hint');
  if (!hint) return;
  let text = '';
  if (drawing) {
    text = `<b>路线绘制</b> 点击添加折点 · 双击或 Enter 完成 · Esc 取消 · 已 ${drawing.points.length} 点`;
  } else {
    const map = {
      select: '拖拽对象调整位置 · 滚轮缩放 · 空格 + 拖拽平移',
      pan: '拖拽平移地图 · 滚轮缩放 · 按 0 适应窗口',
      marker: '点击地图选择标点类型 · 放置后工具保持激活 · Esc 退出',
      route: '点击添加折点 · 双击或 Enter 完成 · Esc 取消',
      text: '点击地图放置文字 · 在右侧属性中修改内容与字号',
      sector: '拖拽框选一块区域并放大 · 最小 24 × 24px · Esc 取消'
    };
    text = map[ui.tool] || map.select;
  }
  hint.innerHTML = text;
  renderStageTags();
}

function renderStageTags() {
  const root = $('#stage-tags');
  if (!root) return;
  const t = currentTemplate();
  if (!t) return;
  const map = resolveMap(t.mapId);
  const toolNames = { select: '选择', pan: '抓手', marker: '标点', route: '路线', text: '文字', sector: '局部部署' };
  const chips = [
    h('span', { class: 'stage-chip' }, h('i', { class: 'd' }), map.name),
    h('span', { class: 'stage-chip gold' }, h('i', { class: 'd' }), '工具 ' + (toolNames[ui.tool] || '选择') + ' · 吸附 ' + (ui.snap ? ui.snap + 'px' : '关'))
  ];
  if (view.sector) {
    chips.push(h('span', { class: 'stage-chip red' }, h('i', { class: 'd' }),
      '局部 ' + view.label + ' ' + Math.round(view.zoom * 100) + '%'));
  }
  root.replaceChildren(...chips);
}

/* ============================================================
   花名册 / 右侧页签
   ============================================================ */
function renderSideTabs() {
  $$('.stab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === ui.tab);
  });
  $('#pane-roster').hidden = ui.tab !== 'roster';
  $('#pane-props').hidden = ui.tab !== 'props';
  $('#pane-legend').hidden = ui.tab !== 'legend';
  const t = currentTemplate();
  if (t) {
    const chars = t.objects.filter((o) => o.type === 'character').length;
    $('#tab-roster-count').textContent = String(chars);
  }
}

function renderRoster(t) {
  if (!t) return;
  const chars = t.objects.filter((o) => o.type === 'character');
  const counts = { all: chars.length, ally: 0, enemy: 0, neutral: 0 };
  chars.forEach((c) => { counts[c.camp] = (counts[c.camp] || 0) + 1; });
  $('#rc-all').textContent = counts.all;
  $('#rc-ally').textContent = counts.ally;
  $('#rc-enemy').textContent = counts.enemy;
  $('#rc-neutral').textContent = counts.neutral;
  $('#tab-roster-count').textContent = counts.all;
  $$('.camp-tab').forEach((btn) => btn.classList.toggle('active', btn.dataset.camp === ui.rosterCamp));

  const query = ui.rosterQuery.trim().toLowerCase();
  let list = chars.filter((c) => ui.rosterCamp === 'all' || c.camp === ui.rosterCamp);
  if (query) {
    list = list.filter((c) =>
      c.name.toLowerCase().includes(query) ||
      c.school.toLowerCase().includes(query) ||
      c.abbr.toLowerCase().includes(query)
    );
  }
  const root = $('#roster-list');
  root.replaceChildren();
  if (!list.length) {
    root.append(h('div', { class: 'roster-empty' },
      chars.length ? '没有匹配的人物' : '还没有人物。点击右上角“添加人物”，按流派批量添加。'
    ));
    return;
  }
  list.forEach((c) => {
    const selected = ui.selection && ui.selection.kind === 'character' && ui.selection.id === c.id;
    const row = h('div', {
      class: 'rrow' + (selected ? ' sel' : '') + (c.visible === false ? ' hidden-char' : ''),
      role: 'button',
      tabindex: 0,
      onclick: () => {
        selectObject('character', c.id);
        centerOnObject(c);
      },
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectObject('character', c.id);
          centerOnObject(c);
        }
      }
    },
      h('div', {
        class: 'rdot' + (c.abbr.length > 1 ? ' two' : ''),
        style: `--school:${c.color};--camp:${CAMPS[c.camp].color}`,
        text: c.abbr
      }),
      h('div', { class: 'rmain' },
        h('span', { class: 'rname', text: c.name }),
        h('span', { class: 'rsub', text: `${c.school} · ${c.group} · ${c.role}` })
      ),
      h('button', {
        class: 'eye-btn',
        title: c.visible === false ? '在地图上显示' : '在地图上隐藏',
        'aria-label': c.visible === false ? '显示' : '隐藏',
        onclick: (e) => {
          e.stopPropagation();
          toggleCharacterVisible(c.id);
        }
      }, icon(c.visible === false ? 'eye-off' : 'eye'))
    );
    root.append(row);
  });
}

function toggleCharacterVisible(id) {
  if (guardEdit()) return;
  const t = currentTemplate();
  const char = t && t.objects.find((o) => o.id === id && o.type === 'character');
  if (!char) return;
  char.visible = char.visible === false;
  t.updatedAt = nowIso();
  pushHistory();
  scheduleSave();
  renderEditorAll();
}

/* ============================================================
   属性面板
   ============================================================ */
function propSection(title, ...children) {
  return h('div', { class: 'prop-section' },
    title ? h('h4', { class: 'prop-section-title', text: title }) : null,
    ...children
  );
}
function propField(label, control, extra) {
  return h('div', { class: 'prop-field' },
    h('span', { class: 'lb', text: label }),
    h('div', { class: 'control' }, control),
    extra || null
  );
}
function textControl(opts) {
  const input = h('input', {
    type: 'text',
    value: opts.value == null ? '' : opts.value,
    maxlength: opts.maxlength,
    placeholder: opts.placeholder || '',
    id: opts.id,
    readonly: !!opts.readonly
  });
  if (!opts.readonly && opts.onCommit) {
    input.addEventListener('change', () => opts.onCommit(input.value));
  }
  return input;
}
function textareaControl(opts) {
  const input = h('textarea', {
    maxlength: opts.maxlength,
    placeholder: opts.placeholder || '',
    rows: opts.rows || 3
  });
  input.value = opts.value == null ? '' : opts.value;
  if (opts.onCommit) input.addEventListener('change', () => opts.onCommit(input.value));
  return input;
}
function selectControl(value, options, onChange) {
  return h('select', { onchange: (e) => onChange(e.target.value) },
    options.map((opt) => {
      const item = typeof opt === 'string' ? { value: opt, label: opt } : opt;
      return h('option', { value: item.value, selected: item.value === value }, item.label);
    })
  );
}
function colorRow(current, palette, onChange) {
  return h('div', { class: 'color-row' },
    palette.map((color) => h('button', {
      class: 'color-swatch' + (color.toLowerCase() === String(current).toLowerCase() ? ' on' : ''),
      style: `background:${color}`,
      title: color,
      'aria-label': '颜色 ' + color,
      onclick: () => onChange(color)
    })),
    h('label', { class: 'color-pick', title: '自定义颜色' },
      h('input', {
        type: 'color', value: current,
        onchange: (e) => onChange(e.target.value)
      })
    )
  );
}
function readonlyCoord(obj) {
  return h('div', { class: 'coord-readout' },
    h('span', {}, 'X ', h('b', { text: (obj.x * 100).toFixed(2) + '%' })),
    h('span', {}, 'Y ', h('b', { text: (obj.y * 100).toFixed(2) + '%' }))
  );
}

function renderProps(t) {
  const pane = $('#pane-props');
  const obj = currentObject();
  if (!obj) {
    renderTemplateSummary(t);
    return;
  }
  pane.replaceChildren();
  if (obj.type === 'character') pane.append(renderCharacterProps(t, obj));
  else if (obj.type === 'marker') pane.append(renderMarkerProps(t, obj));
  else if (obj.type === 'route') pane.append(renderRouteProps(t, obj));
  else pane.append(renderTextProps(t, obj));
}

function propHeadEl(opts) {
  return h('div', { class: 'prop-head' },
    h('div', {
      class: 'pd' + (opts.shape === 'pin' ? ' pin' : ''),
      style: `--school:${opts.color};--camp:${opts.campColor || opts.color}`
    }, opts.shape === 'pin' ? h('span', { text: opts.abbr }) : opts.abbr),
    h('div', { class: 'pinfo' },
      h('h3', { text: opts.title }),
      h('span', { class: 'ptype', text: opts.type })
    ),
    opts.badge ? h('span', { class: 'badge ' + (opts.badgeClass || ''), text: opts.badge }) : null
  );
}

function renderCharacterProps(t, c) {
  const wrap = h('div', {});
  wrap.append(propHeadEl({
    title: c.name,
    type: 'CHARACTER · 流派人物',
    abbr: c.abbr,
    color: c.color,
    campColor: CAMPS[c.camp].color,
    badge: CAMPS[c.camp].name,
    badgeClass: c.camp
  }));

  const identity = propSection('身份',
    propField('名称', textControl({
      value: c.name, maxlength: LIMITS.charName,
      onCommit: (value) => {
        const name = value.trim();
        if (!name) { toast('人物名称不能为空', 'warn'); renderProps(t); return; }
        updateObjectProp(c.id, (o) => { o.name = name.slice(0, LIMITS.charName); });
      }
    })),
    propField('流派', selectControl(c.school, SCHOOLS.map((s) => s.name), (value) => {
      updateObjectProp(c.id, (o) => {
        const oldDef = schoolDef(o.school);
        const next = schoolDef(value);
        if (o.abbr === oldDef.abbr) o.abbr = next.abbr;
        if (o.color === oldDef.color) o.color = next.color;
        o.school = next.name;
        if (o.role === oldDef.role) o.role = next.role;
      });
    })),
    propField('简称', textControl({
      value: c.abbr, maxlength: LIMITS.abbr,
      onCommit: (value) => {
        const abbr = value.trim();
        if (!abbr) { toast('简称不能为空', 'warn'); renderProps(t); return; }
        updateObjectProp(c.id, (o) => { o.abbr = abbr.slice(0, LIMITS.abbr); });
      }
    })),
    propField('阵营', h('div', { class: 'seg-row' },
      ['ally', 'enemy', 'neutral'].map((camp) => h('button', {
        class: c.camp === camp ? 'on' : '',
        onclick: () => updateObjectProp(c.id, (o) => { o.camp = camp; })
      }, CAMPS[camp].name))
    )),
    propField('队伍', selectControl(c.group, TEAMS, (value) => {
      updateObjectProp(c.id, (o) => { o.group = value; });
    })),
    propField('定位', selectControl(c.role, ROLES, (value) => {
      updateObjectProp(c.id, (o) => { o.role = value; });
    }))
  );

  const look = propSection('外观与备注',
    propField('颜色', colorRow(c.color, SCHOOL_COLORS, (color) => {
      updateObjectProp(c.id, (o) => { o.color = color; });
    })),
    propField('备注', textareaControl({
      value: c.note, maxlength: LIMITS.charNote, rows: 2,
      placeholder: '例如：负责看上路大鹅',
      onCommit: (value) => updateObjectProp(c.id, (o) => { o.note = value.slice(0, LIMITS.charNote); })
    }))
  );

  wrap.append(identity, look,
    propSection('位置', readonlyCoord(c),
      h('div', { class: 'hint', style: 'font-size:8.5px;color:#A39A87;margin-top:4px' },
        '拖动地图上的人物可改变位置；坐标按 0–1 归一化保存。')
    )
  );
  wrap.append(propActions(c.id, c.type));
  return wrap;
}

function renderMarkerProps(t, m) {
  const def = typeDef(m.markerType);
  const wrap = h('div', {});
  wrap.append(propHeadEl({
    title: m.label || def.name,
    type: 'MARKER · ' + def.name,
    abbr: def.abbr,
    color: m.color,
    shape: 'pin',
    badge: m.state || '无状态',
    badgeClass: ''
  }));

  const markerColors = [def.color, '#2F6F6A', '#B23A2E', '#B08A45', '#3F7D58', '#4E7C8A', '#B7791F', '#7C8178'];
  wrap.append(propSection('标点',
    propField('类型', h('div', { style: 'font-size:10.5px;color:#5D655B;display:flex;align-items:center;gap:6px' },
      h('i', { class: 'lg-pin', style: `--pin:${def.color};width:11px;height:11px;display:inline-block` }),
      def.name,
      h('span', { style: 'font-size:8px;color:#A39A87;margin-left:auto', text: '类型只读' })
    )),
    propField('名称', textControl({
      value: m.label, maxlength: LIMITS.markerLabel, placeholder: '留空则不显示标签',
      onCommit: (value) => updateObjectProp(m.id, (o) => { o.label = value.trim().slice(0, LIMITS.markerLabel); })
    })),
    def.states.length ? propField('状态', selectControl(m.state, def.states, (value) => {
      updateObjectProp(m.id, (o) => { o.state = value; });
    })) : propField('状态', h('span', { style: 'font-size:10px;color:#9AA091', text: '此类型无状态' })),
    propField('颜色', colorRow(m.color, markerColors, (color) => {
      updateObjectProp(m.id, (o) => { o.color = color; });
    })),
    propField('大小', h('div', { class: 'size-row' },
      [['s', '小 24'], ['m', '中 32'], ['l', '大 40']].map(([key, label]) => h('button', {
        class: m.size === key ? 'on' : '',
        onclick: () => updateObjectProp(m.id, (o) => { o.size = key; })
      }, label))
    )),
    propField('备注', textareaControl({
      value: m.note, maxlength: LIMITS.markerNote, rows: 2,
      placeholder: '例如：3 分钟后刷新',
      onCommit: (value) => updateObjectProp(m.id, (o) => { o.note = value.slice(0, LIMITS.markerNote); })
    }))
  ));
  wrap.append(propSection('位置', readonlyCoord(m)));
  wrap.append(propActions(m.id, m.type));
  return wrap;
}

function renderRouteProps(t, r) {
  const wrap = h('div', {});
  wrap.append(h('div', { class: 'prop-head' },
    h('div', { class: 'pd', style: `--school:${r.color};--camp:${r.color}`, text: '线' }),
    h('div', { class: 'pinfo' },
      h('h3', { text: r.label || '未命名路线' }),
      h('span', { class: 'ptype', text: 'ROUTE · ' + (ROUTE_STYLES[r.style] || ROUTE_STYLES.attack).name + '路线' })
    ),
    h('span', { class: 'badge', text: r.points.length + ' 点' })
  ));

  wrap.append(propSection('路线',
    propField('名称', textControl({
      value: r.label, maxlength: LIMITS.routeLabel,
      onCommit: (value) => updateObjectProp(r.id, (o) => { o.label = value.trim().slice(0, LIMITS.routeLabel); })
    })),
    propField('样式', selectControl(r.style, Object.keys(ROUTE_STYLES).map((key) => ({ value: key, label: ROUTE_STYLES[key].name })), (value) => {
      updateObjectProp(r.id, (o) => {
        const oldStyle = ROUTE_STYLES[o.style];
        o.style = value;
        if (o.color === oldStyle.color) o.color = ROUTE_STYLES[value].color;
      });
    })),
    propField('颜色', colorRow(r.color, ['#B23A2E', '#2F6F6A', '#B08A45', '#7C8178', '#3F7D58', '#8A6E9A'], (color) => {
      updateObjectProp(r.id, (o) => { o.color = color; });
    })),
    propField('线宽', h('div', { class: 'size-row' },
      [1.5, 2.5, 3.5].map((width) => h('button', {
        class: Number(r.width) === width ? 'on' : '',
        onclick: () => updateObjectProp(r.id, (o) => { o.width = width; })
      }, width + 'px'))
    )),
    propField('箭头', h('div', { class: 'seg-row' },
      h('button', { class: r.arrow ? 'on' : '', onclick: () => updateObjectProp(r.id, (o) => { o.arrow = true; }) }, '显示'),
      h('button', { class: !r.arrow ? 'on' : '', onclick: () => updateObjectProp(r.id, (o) => { o.arrow = false; }) }, '隐藏')
    )),
    propField('备注', textareaControl({
      value: r.note, maxlength: LIMITS.routeNote, rows: 2,
      onCommit: (value) => updateObjectProp(r.id, (o) => { o.note = value.slice(0, LIMITS.routeNote); })
    }))
  ));
  wrap.append(propSection('位置',
    h('div', { class: 'coord-readout' },
      h('span', {}, '折点 ', h('b', { text: String(r.points.length) })),
      h('span', {}, '起点 ', h('b', { text: `${(r.points[0].x * 100).toFixed(1)}%, ${(r.points[0].y * 100).toFixed(1)}%` }))
    ),
    h('div', { style: 'font-size:8.5px;color:#A39A87;margin-top:4px' }, '路线折点不可拖动；如需修改请删除后重画。')
  ));
  wrap.append(propActions(r.id, r.type));
  return wrap;
}

function renderTextProps(t, x) {
  const wrap = h('div', {});
  wrap.append(h('div', { class: 'prop-head' },
    h('div', { class: 'pd', style: `--school:${x.color};--camp:${x.color}`, text: '文' }),
    h('div', { class: 'pinfo' },
      h('h3', { text: '地图文字' }),
      h('span', { class: 'ptype', text: 'TEXT · ' + x.fontSize + 'px' })
    )
  ));
  wrap.append(propSection('内容',
    propField('文字', textControl({
      value: x.content, maxlength: LIMITS.textLen, id: 'prop-text-content',
      onCommit: (value) => {
        const content = value.trim();
        if (!content) { toast('文字内容不能为空', 'warn'); renderProps(t); return; }
        updateObjectProp(x.id, (o) => { o.content = content.slice(0, LIMITS.textLen); });
      }
    })),
    propField('字号', h('div', { class: 'size-row' },
      [12, 16, 20].map((size) => h('button', {
        class: x.fontSize === size ? 'on' : '',
        onclick: () => updateObjectProp(x.id, (o) => { o.fontSize = size; })
      }, size + 'px'))
    )),
    propField('颜色', colorRow(x.color, ['#1F2420', '#B23A2E', '#2F6F6A', '#B08A45', '#3F7D58', '#7C8178'], (color) => {
      updateObjectProp(x.id, (o) => { o.color = color; });
    }))
  ));
  wrap.append(propSection('位置', readonlyCoord(x)));
  wrap.append(propActions(x.id, x.type));
  return wrap;
}

function updateObjectProp(id, mutator) {
  if (guardEdit()) return;
  const t = currentTemplate();
  if (!t) return;
  const obj = t.objects.find((o) => o.id === id);
  if (!obj) return;
  mutator(obj);
  t.updatedAt = nowIso();
  pushHistory();
  scheduleSave();
  renderEditorAll();
}

function propActions(id, type) {
  return h('div', { class: 'prop-actions' },
    h('button', { class: 'mini-btn', onclick: () => duplicateSelected() }, icon('copy'), '复制偏移'),
    h('button', { class: 'mini-btn danger', onclick: () => deleteSelected() }, icon('trash'), '删除对象')
  );
}

function renderTemplateSummary(t) {
  const pane = $('#pane-props');
  const chars = t.objects.filter((o) => o.type === 'character').length;
  const markers = t.objects.filter((o) => o.type === 'marker').length;
  const routes = t.objects.filter((o) => o.type === 'route').length;
  const texts = t.objects.filter((o) => o.type === 'text').length;
  const map = resolveMap(t.mapId);
  pane.replaceChildren(
    h('div', { class: 'prop-empty' },
      h('div', { class: 'summary-hero' },
        h('div', { class: 'seal-sm', text: '要' }),
        h('div', {},
          h('h3', { text: t.name }),
          h('p', { text: t.category + ' · ' + map.name })
        )
      ),
      h('div', { class: 'summary-grid' },
        h('div', { class: 'summary-item' }, h('div', { class: 'k', text: '人物' }), h('div', { class: 'v', text: String(chars) })),
        h('div', { class: 'summary-item' }, h('div', { class: 'k', text: '标点' }), h('div', { class: 'v', text: String(markers) })),
        h('div', { class: 'summary-item' }, h('div', { class: 'k', text: '路线' }), h('div', { class: 'v', text: String(routes) })),
        h('div', { class: 'summary-item' }, h('div', { class: 'k', text: '文字' }), h('div', { class: 'v', text: String(texts) })),
        h('div', { class: 'summary-item' }, h('div', { class: 'k', text: '创建' }), h('div', { class: 'v', style: 'font-size:10px', text: dateFmt(t.createdAt) })),
        h('div', { class: 'summary-item' }, h('div', { class: 'k', text: '更新' }), h('div', { class: 'v', style: 'font-size:10px', text: dateFmt(t.updatedAt) }))
      ),
      h('p', { class: 'prop-desc', text: t.description || '暂无描述。可在左侧“模板信息”中补充这场战术的目标。' }),
      h('ul', { class: 'prop-tips' },
        h('li', { text: '点击地图上的对象选中，右侧会切换为属性面板。' }),
        h('li', { text: '选中人物后，可在花名册中点击行快速居中。' }),
        h('li', { text: '按 Z 框选局部，吸附默认 8px，适合精细摆位。' }),
        h('li', { text: '所有内容自动保存；按 Ctrl+Z 可撤销最近 30 步操作。' })
      )
    )
  );
}

/* ============================================================
   图例
   ============================================================ */
function renderLegend(t) {
  const pane = $('#pane-legend');
  pane.replaceChildren();
  const campRow = (camp) => h('div', { class: 'legend-row' },
    h('i', { class: 'lg-dot', style: `--school:${CAMPS[camp].color};--camp:${CAMPS[camp].color}` }),
    h('span', { class: 'lg-name', text: CAMPS[camp].name })
  );
  pane.append(
    h('div', { class: 'legend-group' },
      h('h4', { class: 'legend-title', text: '阵营' }),
      campRow('ally'), campRow('enemy'), campRow('neutral')
    ),
    h('div', { class: 'legend-group' },
      h('h4', { class: 'legend-title', text: '路线' }),
      ...Object.values(ROUTE_STYLES).map((s) => h('div', { class: 'legend-row' },
        h('i', { class: 'lg-line ' + (s.name === '进攻' ? 'red' : s.name === '撤退' ? 'gray' : s.name === '自定义' ? 'gold' : '') }),
        h('span', { class: 'lg-name', text: s.name + '路线' })
      ))
    ),
    h('div', { class: 'legend-group' },
      h('h4', { class: 'legend-title', text: '标点类型' }),
      h('div', { class: 'legend-marker-list' },
        MARKER_TYPES.map((def) => h('div', { class: 'legend-row' },
          h('i', { class: 'lg-pin', style: `--pin:${def.color}` }),
          h('span', { class: 'lg-name', text: def.abbr + ' ' + def.name })
        ))
      )
    ),
    h('div', { class: 'legend-group' },
      h('h4', { class: 'legend-title', text: '说明' }),
      h('div', { style: 'font-size:9px;line-height:1.75;color:#8B9186' },
        '人物圆形标记外圈颜色表示阵营，内部简称表示流派。缩放低于 70% 时名称标签自动隐藏，悬停可查看。')
    )
  );
}

/* ============================================================
   添加流派人物
   ============================================================ */
function nextSequence(school, offset, t) {
  const re = new RegExp('^' + escapeReg(school.abbr) + '(\\d+)号$');
  let max = 0;
  t.objects.forEach((o) => {
    if (o.type !== 'character') return;
    const match = o.name.match(re);
    if (match) max = Math.max(max, Number(match[1]) || 0);
  });
  return max + offset + 1;
}

function openCharacterModal() {
  if (guardEdit()) return;
  const t = currentTemplate();
  if (!t) return;
  const existing = t.objects.filter((o) => o.type === 'character');
  const remainingChars = LIMITS.characters - existing.length;
  const remainingObjects = LIMITS.totalObjects - t.objects.length;
  if (remainingChars <= 0) {
    toast('单模板人物上限 ' + LIMITS.characters + ' 人，请先删除部分人物', 'warn');
    return;
  }
  if (remainingObjects <= 0) {
    toast('单模板对象上限 ' + LIMITS.totalObjects + ' 个，请先删除部分对象', 'warn');
    return;
  }

  const selected = new Set([SCHOOLS[0].name]);
  let camp = 'ally';
  let group = '一队';
  let role = '';
  let count = 1;

  const schoolGrid = h('div', { class: 'school-grid' });
  const segCamp = h('div', { class: 'seg-group' });
  const segTeam = h('div', { class: 'seg-group' });
  const roleSelect = h('select', {},
    h('option', { value: '', text: '跟随流派默认定位' }),
    ROLES.map((r) => h('option', { value: r, text: r }))
  );
  const countInput = h('input', { type: 'number', min: 1, max: 10, value: 1 });
  const previewList = h('div', { class: 'preview-list' });
  const previewText = h('div', { class: 'preview-box' });
  const errorBox = h('div', { class: 'form-error', hidden: true });

  const buildNames = () => {
    const names = [];
    selected.forEach((name) => {
      const school = schoolDef(name);
      for (let i = 0; i < count; i++) {
        names.push({ school, name: school.abbr + nextSequence(school, i, t) + '号' });
      }
    });
    return names;
  };

  const renderSegs = () => {
    segCamp.replaceChildren(...Object.entries(CAMPS).map(([key, def]) => h('button', {
      type: 'button',
      class: camp === key ? 'on' : '',
      onclick: () => { camp = key; renderSegs(); }
    }, def.name)));
    segTeam.replaceChildren(...TEAMS.map((team) => h('button', {
      type: 'button',
      class: group === team ? 'on' : '',
      onclick: () => { group = team; renderSegs(); }
    }, team)));
  };

  const renderPreview = () => {
    schoolGrid.replaceChildren(...SCHOOLS.map((school) => {
      const on = selected.has(school.name);
      return h('button', {
        type: 'button',
        class: 'school-card' + (on ? ' on' : ''),
        title: school.name + ' · ' + school.weapon,
        onclick: () => {
          if (on) selected.delete(school.name);
          else selected.add(school.name);
          renderPreview();
        }
      },
        h('span', { class: 'sd' + (school.abbr.length > 1 ? ' two' : ''), style: '--school:' + school.color, text: school.abbr }),
        h('span', { class: 'sn' }, h('b', { text: school.name }), h('small', { text: school.role }))
      );
    }));

    const names = buildNames();
    const cap = Math.min(remainingChars, remainingObjects);
    const over = names.length > cap;
    const shown = names.slice(0, 18);
    previewList.replaceChildren(...shown.map((item) => h('span', {},
      h('i', { style: 'width:7px;height:7px;border-radius:50%;background:' + item.school.color + ';display:inline-block;flex:none' }),
      item.name
    )));
    if (names.length > shown.length) previewList.append(h('span', { text: '+' + (names.length - shown.length) }));
    const previewLines = [
      h('div', {}, '将添加 ', h('b', { text: String(Math.min(names.length, cap)) }), ' 位人物',
        names.length ? '；命名按当前花名册自动续号。' : '；请选择流派。')
    ];
    if (over) {
      previewLines.push(h('div', { style: 'color:var(--cinnabar);margin-top:2px',
        text: '超出上限，只会添加前 ' + cap + ' 位（人物上限 ' + LIMITS.characters + ' / 对象上限 ' + LIMITS.totalObjects + '）。' }));
    }
    previewText.replaceChildren(...previewLines);
    errorBox.hidden = true;
  };

  const step = (delta) => {
    count = clamp(count + delta, 1, 10);
    countInput.value = String(count);
    renderPreview();
  };
  countInput.addEventListener('change', () => {
    let value = parseInt(countInput.value, 10);
    if (!Number.isFinite(value)) value = 1;
    count = clamp(value, 1, 10);
    countInput.value = String(count);
    renderPreview();
  });
  roleSelect.addEventListener('change', () => { role = roleSelect.value; });

  const submit = () => {
    if (!selected.size) {
      errorBox.hidden = false;
      errorBox.textContent = '请至少选择一个流派。';
      return false;
    }
    const names = buildNames();
    const cap = Math.min(names.length, remainingChars, remainingObjects);
    if (cap <= 0) {
      errorBox.hidden = false;
      errorBox.textContent = '已达到单模板上限，无法继续添加。';
      return false;
    }
    const stage = $('#stage');
    const map = currentMap();
    const k = view.fit * view.zoom || 1;
    const center = screenToNorm(stage.clientWidth / 2, stage.clientHeight / 2);
    const gapX = 46 / (map.width * k);
    const gapY = 42 / (map.height * k);
    const cols = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(cap))));
    const rows = Math.ceil(cap / cols);
    const startX = center.x - ((Math.min(cols, cap) - 1) * gapX) / 2;
    const startY = center.y - ((rows - 1) * gapY) / 2;
    const added = [];
    for (let i = 0; i < cap; i++) {
      const item = names[i];
      const obj = {
        id: uid('ch'), type: 'character', name: item.name,
        school: item.school.name, abbr: item.school.abbr,
        camp, group, role: role || item.school.role,
        x: round4(clamp(startX + (i % cols) * gapX, 0.02, 0.98)),
        y: round4(clamp(startY + Math.floor(i / cols) * gapY, 0.02, 0.98)),
        color: item.school.color, note: '', visible: true
      };
      t.objects.push(obj);
      added.push(obj);
    }
    t.updatedAt = nowIso();
    pushHistory();
    scheduleSave();
    ui.selection = { kind: 'character', id: added[0].id };
    ui.tab = 'props';
    renderEditorAll();
    toast('已添加 ' + cap + ' 位人物，可直接拖动微调站位', 'ok');
    return true;
  };

  const body = h('div', {},
    errorBox,
    h('div', { class: 'section-label', text: '流派（可多选，按简称自动续号）' }),
    schoolGrid,
    h('div', { class: 'form-row three' },
      h('div', { class: 'form-field' },
        h('label', { text: '数量' }),
        h('div', { class: 'stepper' },
          h('button', { type: 'button', onclick: () => step(-1), text: '−' }),
          countInput,
          h('button', { type: 'button', onclick: () => step(1), text: '+' })
        )
      ),
      h('div', { class: 'form-field' }, h('label', { text: '阵营' }), segCamp),
      h('div', { class: 'form-field' }, h('label', { text: '队伍' }), segTeam)
    ),
    h('div', { class: 'form-field' },
      h('label', { text: '定位' }),
      roleSelect,
      h('div', { class: 'hint' }, h('span', { text: '留空则按流派自动带入；之后可在属性面板单独修改。' }))
    ),
    h('div', { class: 'section-label', text: '预览' }),
    previewText,
    previewList,
    h('div', { class: 'form-field', style: 'margin-top:10px' },
      h('div', { class: 'preview-box' },
        '人物以当前视图中心为起点排成网格；如果压到地图边缘会自动收进有效范围。花名册和地图会同步更新。')
    )
  );

  renderSegs();
  renderPreview();
  roleSelect.value = '';

  openModal({
    eyebrow: 'ADD CHARACTERS',
    title: '添加流派人物',
    subtitle: '按流派批量生成，名称默认「简称 + 序号 + 号」。',
    width: 620,
    body,
    actions: [
      { label: '取消', variant: 'ghost' },
      { label: '添加人物', variant: 'primary', onClick: submit }
    ]
  });
}

/* ============================================================
   底图：注册、上传、替换
   ============================================================ */
function readMapImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('无法解析这张图片'));
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) { reject(new Error('图片尺寸无效')); return; }
        const maxSide = 2200;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        if (scale === 1 && file.size <= 1200 * 1024) {
          resolve({ src: String(reader.result), width: w, height: h });
          return;
        }
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve({ src: canvas.toDataURL('image/jpeg', 0.86), width: w, height: h });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function registerUploadedMap(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('仅支持 JPG / PNG / WebP 图片');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('图片超过 8MB，请先压缩后再上传');
  }
  const data = await readMapImage(file);
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, ' ').trim().slice(0, 24) || '自定义底图';
  const map = { id: uid('map'), name: base, src: data.src, width: data.width, height: data.height, builtin: false };
  const previous = maps.slice();
  maps.unshift(map);
  if (!saveMaps()) {
    maps = previous;
    throw new Error('浏览器存储空间不足，底图未能保存。请换一张更小的图片');
  }
  return map;
}

function applyTemplateMap(mapId) {
  const t = currentTemplate();
  if (!t) return;
  if (t.mapId === mapId) return;
  t.mapId = mapId;
  t.updatedAt = nowIso();
  mapMissing = !allMaps().some((m) => m.id === mapId);
  mapError = false;
  pushHistory();
  scheduleSave();
  currentMapIdKey = null;
  view.fit = 0;
  view.zoom = 1;
  view.sector = null;
  view.label = '';
  renderEditorAll();
  requestAnimationFrame(() => layoutStage(true));
}

async function resetTemplateMap() {
  if (guardEdit()) return;
  const t = currentTemplate();
  if (!t) return;
  if (t.mapId === DEFAULT_MAP_ID) { toast('当前已经是默认底图', 'ok'); return; }
  const ok = await confirmDialog({
    eyebrow: 'RESET MAP',
    title: '恢复默认底图',
    subtitle: '所有标点与人物会按归一化坐标保留，但可能因地图比例不同而需要微调。',
    message: h('div', { class: 'danger-note' }, '将底图恢复为「' + DEFAULT_MAP.name + '」。'),
    confirmText: '恢复默认',
    tone: 'plain'
  });
  if (!ok) return;
  applyTemplateMap(DEFAULT_MAP_ID);
  toast('已恢复默认底图', 'ok');
}

function openMapModal() {
  if (guardEdit()) return;
  const t = currentTemplate();
  if (!t) return;
  let selectedId = allMaps().some((m) => m.id === t.mapId) ? t.mapId : DEFAULT_MAP_ID;
  let modalEl = null;
  const grid = h('div', { class: 'map-grid' });
  const errorBox = h('div', { class: 'form-error', hidden: true });

  const render = () => {
    grid.replaceChildren(...allMaps().map((map) => h('button', {
      type: 'button',
      class: 'map-card' + (selectedId === map.id ? ' on' : ''),
      onclick: () => { selectedId = map.id; render(); }
    },
      h('span', { class: 'mc-thumb', style: 'background-image:url("' + map.src + '")' },
        h('span', { class: 'flag', text: map.builtin ? '内置' : '自定义' })
      ),
      h('span', { class: 'mc-body' },
        h('span', { class: 'mc-name', text: map.name }),
        h('span', { class: 'mc-meta', text: map.width + ' × ' + map.height + ' · ' + map.id })
      )
    )));
  };
  render();

  const uploadBtn = h('button', {
    type: 'button',
    class: 'btn block',
    style: 'margin-top:8px',
    onclick: () => {
      pickMapFile(async (file) => {
        if (!file) return;
        errorBox.hidden = false;
        errorBox.textContent = '正在压缩并登记底图…';
        try {
          const map = await registerUploadedMap(file);
          selectedId = map.id;
          render();
          errorBox.hidden = true;
          toast('底图已登记，点击「应用底图」生效', 'ok');
        } catch (err) {
          errorBox.hidden = false;
          errorBox.textContent = err && err.message ? err.message : '底图上传失败';
        }
      });
    }
  }, icon('upload'), '上传新底图（JPG / PNG / WebP，≤8MB）');

  const body = h('div', {},
    mapMissing ? h('div', { class: 'warning-box' },
      '当前模板引用的底图在本浏览器不存在，已回退到默认图。选择一张底图并应用即可修复。') : null,
    errorBox,
    grid,
    uploadBtn,
    h('div', { class: 'form-field', style: 'margin-top:10px' },
      h('div', { class: 'preview-box' },
        '底图只保存在当前浏览器。自定义底图会压缩后写入 localStorage；对象坐标使用 0–1 归一化，换图后位置按比例保留。')
    )
  );

  const apply = (mapId) => {
    if (mapId === t.mapId) { toast('当前已经使用这张底图', 'ok'); return; }
    applyTemplateMap(mapId);
    toast('底图已更换，标点与人物按比例保留', 'ok');
  };

  modalEl = openModal({
    eyebrow: 'BASE MAP',
    title: '更换底图',
    subtitle: '选择已登记的底图，或上传一张干净的战场图。',
    width: 620,
    body,
    actions: [
      { label: '取消', variant: 'ghost' },
      { label: '恢复默认', onClick: () => apply(DEFAULT_MAP_ID) },
      { label: '应用底图', variant: 'primary', onClick: () => apply(selectedId) }
    ]
  });
  return modalEl;
}

/* ============================================================
   模板重命名 / 标签
   ============================================================ */
function openRenameModal() {
  if (guardEdit()) return;
  const t = currentTemplate();
  if (!t) return;
  const input = h('input', { type: 'text', maxlength: LIMITS.name, value: t.name, autocomplete: 'off' });
  const errorBox = h('div', { class: 'form-error', hidden: true });
  const submit = () => {
    const name = input.value.trim();
    if (!name) {
      errorBox.hidden = false;
      errorBox.textContent = '模板名称不能为空。';
      return false;
    }
    if (name === t.name) return true;
    t.name = name;
    t.updatedAt = nowIso();
    pushHistory();
    scheduleSave();
    renderEditorAll();
    toast('已重命名为「' + name + '」', 'ok');
    return true;
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (submit()) closeModal();
    }
  });
  openModal({
    eyebrow: 'RENAME',
    title: '重命名模板',
    subtitle: '名称会显示在模板库与编辑器顶部。',
    width: 440,
    body: h('div', {}, errorBox,
      h('div', { class: 'form-field' }, h('label', { text: '模板名称' }), input,
        h('div', { class: 'hint' }, h('span', { text: '最多 ' + LIMITS.name + ' 个字符' })))
    ),
    actions: [
      { label: '取消', variant: 'ghost' },
      { label: '保存名称', variant: 'primary', onClick: submit }
    ]
  });
}

function addTags(raw) {
  const t = currentTemplate();
  if (!t) return;
  const parts = String(raw).split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return;
  const added = [];
  for (const part of parts) {
    const tag = part.slice(0, LIMITS.tagLen);
    if (!tag || t.tags.includes(tag) || added.includes(tag)) continue;
    if (t.tags.length + added.length >= LIMITS.tags) {
      toast('最多 ' + LIMITS.tags + ' 个标签', 'warn');
      break;
    }
    added.push(tag);
  }
  if (!added.length) return;
  t.tags.push(...added);
  t.updatedAt = nowIso();
  pushHistory();
  scheduleSave();
  renderTemplateInfo(t);
}

function removeTag(tag) {
  if (guardEdit()) return;
  const t = currentTemplate();
  if (!t) return;
  if (!t.tags.includes(tag)) return;
  t.tags = t.tags.filter((item) => item !== tag);
  t.updatedAt = nowIso();
  pushHistory();
  scheduleSave();
  renderTemplateInfo(t);
}

/* ============================================================
   导出
   ============================================================ */
function buildExport(t) {
  return {
    format: 'yysls-baizhan-tactic',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    appVersion: APP_VERSION,
    template: clone(t)
  };
}

function exportFileName(t) {
  const prefix = '百业战战术_';
  const suffix = '_' + stampFmt() + '.json';
  const maxNameLen = Math.max(1, 80 - prefix.length - suffix.length);
  const clean = (t.name || '未命名模板')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxNameLen) || '未命名模板';
  return prefix + clean + suffix;
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function openExportModal() {
  const t = currentTemplate();
  if (!t) { toast('请先打开一个模板再导出', 'warn'); return; }
  const fileName = exportFileName(t);
  const chars = t.objects.filter((o) => o.type === 'character').length;
  const markers = t.objects.filter((o) => o.type === 'marker').length;
  const routes = t.objects.filter((o) => o.type === 'route').length;
  const texts = t.objects.filter((o) => o.type === 'text').length;
  const map = resolveMap(t.mapId);
  const item = (k, v) => h('div', { class: 'is' },
    h('div', { class: 'k', text: k }),
    h('div', { class: 'v', text: v })
  );
  openModal({
    eyebrow: 'EXPORT JSON',
    title: '导出战术模板',
    subtitle: '导出一个自包含的 JSON 文件，可用于备份或分享给队友。',
    width: 560,
    body: h('div', {},
      h('div', { class: 'import-summary' },
        item('模板', t.name),
        item('分类', t.category),
        item('对象', chars + ' 人 · ' + markers + ' 标点 · ' + routes + ' 路线 · ' + texts + ' 文字'),
        item('底图', map.name),
        item('格式', 'yysls-baizhan-tactic'),
        item('版本', 'schemaVersion ' + SCHEMA_VERSION)
      ),
      h('div', { class: 'section-label', text: '文件名' }),
      h('div', { class: 'export-file', text: fileName }),
      h('div', { class: 'preview-box', style: 'margin-top:8px' },
        '导出内容包括模板信息、分类、底图 ID、图层状态与全部对象；坐标保留 4 位小数。'),
      map.builtin ? null : h('div', { class: 'warning-box', style: 'margin-top:8px' },
        '当前底图是自定义上传图。JSON 只记录底图 ID 与尺寸，不包含图片本身；导入到其他浏览器后会回退到默认底图，需要重新上传。')
    ),
    actions: [
      { label: '取消', variant: 'ghost' },
      {
        label: '下载 JSON',
        variant: 'primary',
        onClick: () => {
          downloadJson(buildExport(t), fileName);
          toast('已开始下载 ' + fileName, 'ok');
        }
      }
    ]
  });
}

function quickExportBackup() {
  const t = currentTemplate();
  if (!t) { toast('请先打开一个模板再导出备份', 'warn'); return; }
  const fileName = exportFileName(t);
  downloadJson(buildExport(t), fileName);
  toast('已导出当前模板备份', 'ok');
}

/* ============================================================
   导入
   ============================================================ */
function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsText(file, 'utf-8');
  });
}

function validateImportFile(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('JSON 根节点必须是一个对象');
  }
  if (data.format !== 'yysls-baizhan-tactic') {
    throw new Error('不是本工具导出的战术模板文件（format 不匹配）');
  }
  const version = Number(data.schemaVersion);
  if (!Number.isFinite(version) || version < 1) {
    throw new Error('文件缺少有效的 schemaVersion');
  }
  if (version > SCHEMA_VERSION) {
    throw new Error('文件版本 v' + version + ' 高于当前支持的 v' + SCHEMA_VERSION + '，请更新工具后再导入');
  }
  if (!data.template || typeof data.template !== 'object' || Array.isArray(data.template)) {
    throw new Error('文件缺少 template 对象');
  }
  const raw = data.template;
  if (typeof raw.name !== 'string' || !raw.name.trim()) {
    throw new Error('模板缺少名称');
  }
  if (!Array.isArray(raw.objects)) {
    throw new Error('模板缺少 objects 数组');
  }
  const warnings = [];
  if (raw.objects.length > LIMITS.totalObjects) {
    warnings.push('对象数量 ' + raw.objects.length + ' 超过上限 ' + LIMITS.totalObjects + '，已保留前 ' + LIMITS.totalObjects + ' 个。');
  }
  const template = normalizeTemplate(raw);
  if (!template) throw new Error('模板结构无法识别');
  const chars = template.objects.filter((o) => o.type === 'character');
  if (chars.length > LIMITS.characters) {
    const keep = new Set(chars.slice(0, LIMITS.characters).map((o) => o.id));
    template.objects = template.objects.filter((o) => o.type !== 'character' || keep.has(o.id));
    warnings.push('人物数量超过 ' + LIMITS.characters + '，已保留前 ' + LIMITS.characters + ' 位。');
  }
  if (!allMaps().some((m) => m.id === template.mapId)) {
    warnings.push('底图「' + template.mapId + '」在当前浏览器不存在，导入时会改用默认底图。');
  }
  return { template, warnings };
}

async function handleImportFile(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    toast('JSON 文件不能超过 5MB', 'error');
    return;
  }
  if (!/\.json$/i.test(file.name) && file.type !== 'application/json') {
    toast('请选择 .json 文件', 'warn');
    return;
  }
  try {
    const text = await readFileText(file);
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (_) {
      throw new Error('JSON 解析失败，请检查文件是否完整');
    }
    const result = validateImportFile(data);
    openImportPreview(result.template, result.warnings, file.name, data.exportedAt);
  } catch (err) {
    toast(err && err.message ? err.message : '导入失败', 'error');
  }
}

function uniqueTemplateName(base, excludeId) {
  let name = String(base).slice(0, LIMITS.name) || '未命名模板';
  let n = 2;
  while (db.templates.some((t) => t.id !== excludeId && t.name === name)) {
    const suffix = '（' + n + '）';
    name = String(base).slice(0, Math.max(1, LIMITS.name - suffix.length)) + suffix;
    n += 1;
  }
  return name;
}

function openImportPreview(template, warnings, fileName, exportedAt) {
  let mode = 'new';
  let mapId = allMaps().some((m) => m.id === template.mapId) ? template.mapId : DEFAULT_MAP_ID;
  const errorBox = h('div', { class: 'form-error', hidden: true });
  const chars = template.objects.filter((o) => o.type === 'character').length;
  const markers = template.objects.filter((o) => o.type === 'marker').length;
  const mapSummary = h('div', { class: 'v', text: resolveMap(mapId).name });
  const nameInput = h('input', { type: 'text', maxlength: LIMITS.name, value: uniqueTemplateName(template.name) });
  const mapSelect = h('select', {}, allMaps().map((m) => h('option', { value: m.id, selected: m.id === mapId }, m.name)));
  const targetSelect = h('select', {}, db.templates.map((tpl) => h('option', { value: tpl.id }, tpl.name + ' · ' + tpl.category)));
  const current = currentTemplate();
  if (current) targetSelect.value = current.id;

  const newRadio = h('input', { type: 'radio', name: 'import-mode', value: 'new', checked: true });
  const overRadio = h('input', { type: 'radio', name: 'import-mode', value: 'overwrite', disabled: !db.templates.length });
  const newOption = h('label', { class: 'import-option on' }, newRadio, h('span', { text: '作为新模板导入' }));
  const overOption = h('label', { class: 'import-option' }, overRadio, h('span', { text: '覆盖现有模板' }));

  const overwriteBlock = h('div', { class: 'form-field', hidden: true },
    h('label', { text: '覆盖哪个模板' }),
    targetSelect,
    h('div', { class: 'hint' }, h('span', { text: '保留原模板 ID，名称与内容会被导入文件替换。' }))
  );
  const newBlock = h('div', { class: 'form-row' },
    h('div', { class: 'form-field' }, h('label', { text: '导入后名称' }), nameInput),
    h('div', { class: 'form-field' }, h('label', { text: '使用底图' }), mapSelect)
  );

  const renderMode = () => {
    newOption.classList.toggle('on', mode === 'new');
    overOption.classList.toggle('on', mode === 'overwrite');
    newBlock.hidden = mode !== 'new';
    overwriteBlock.hidden = mode !== 'overwrite';
    errorBox.hidden = true;
  };
  newRadio.addEventListener('change', () => { if (newRadio.checked) { mode = 'new'; renderMode(); } });
  overRadio.addEventListener('change', () => { if (overRadio.checked) { mode = 'overwrite'; renderMode(); } });
  newOption.addEventListener('click', () => { mode = 'new'; newRadio.checked = true; renderMode(); });
  overOption.addEventListener('click', () => {
    if (!db.templates.length) return;
    mode = 'overwrite'; overRadio.checked = true; renderMode();
  });
  mapSelect.addEventListener('change', () => {
    mapId = mapSelect.value;
    mapSummary.textContent = resolveMap(mapId).name;
  });

  const item = (k, v) => h('div', { class: 'is' },
    h('div', { class: 'k', text: k }),
    typeof v === 'string' ? h('div', { class: 'v', text: v }) : h('div', { class: 'v' }, v)
  );

  const submit = () => {
    const target = mode === 'overwrite' ? db.templates.find((tpl) => tpl.id === targetSelect.value) : null;
    if (mode === 'overwrite' && !target) {
      errorBox.hidden = false;
      errorBox.textContent = '请选择要覆盖的模板。';
      return false;
    }
    const name = mode === 'new' ? nameInput.value.trim() : template.name;
    if (!name) {
      errorBox.hidden = false;
      errorBox.textContent = '模板名称不能为空。';
      return false;
    }
    const next = normalizeTemplate({
      ...clone(template),
      id: mode === 'new' ? uid('tpl') : target.id,
      name: uniqueTemplateName(name, mode === 'new' ? null : target.id),
      mapId,
      createdAt: mode === 'new' ? nowIso() : target.createdAt,
      updatedAt: nowIso()
    });
    if (!next) {
      errorBox.hidden = false;
      errorBox.textContent = '模板结构无法识别，未能导入。';
      return false;
    }
    if (mode === 'new') {
      db.templates.unshift(next);
    } else {
      const index = db.templates.findIndex((tpl) => tpl.id === target.id);
      db.templates[index] = next;
    }
    if (!db.categories.includes(next.category)) db.categories.push(next.category);
    db.lastTemplateId = next.id;
    saveNow();
    toast(mode === 'new' ? '已导入为新模板' : '已覆盖「' + next.name + '」', 'ok');
    gotoEditor(next.id);
    return true;
  };

  const body = h('div', {},
    errorBox,
    h('div', { class: 'import-summary' },
      item('文件', fileName),
      item('模板', template.name),
      item('分类', template.category),
      item('对象', chars + ' 人 · ' + markers + ' 标点 · ' + template.objects.length + ' 总'),
      item('底图', mapSummary),
      item('导出时间', exportedAt ? dateFmt(exportedAt) : '—')
    ),
    warnings.length ? h('div', { class: 'warning-box' },
      h('b', { text: '导入提示' }),
      h('ul', {}, warnings.map((w) => h('li', { text: w })))
    ) : null,
    h('div', { class: 'section-label', text: '导入方式' }),
    h('div', { class: 'import-options' }, newOption, overOption),
    newBlock,
    overwriteBlock
  );

  renderMode();
  openModal({
    eyebrow: 'IMPORT JSON',
    title: '导入战术模板',
    subtitle: '先校验再导入，不会悄悄覆盖你的模板。',
    width: 620,
    body,
    actions: [
      { label: '取消', variant: 'ghost' },
      { label: '确认导入', variant: 'primary', onClick: submit }
    ]
  });
}

function gotoEditor(id) {
  const hash = '#/editor/' + encodeURIComponent(id);
  if (location.hash === hash) showEditor(id);
  else location.hash = hash;
}

/* ============================================================
   帮助抽屉
   ============================================================ */
function openDrawer() {
  const drawer = $('#help-drawer');
  const backdrop = $('#drawer-backdrop');
  if (!drawer || !backdrop) return;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.hidden = false;
}

function closeDrawer() {
  const drawer = $('#help-drawer');
  const backdrop = $('#drawer-backdrop');
  if (!drawer || !backdrop) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  backdrop.hidden = true;
}

/* ============================================================
   只读模式 / 底图文件选择
   ============================================================ */
function updateReadonlyUI() {
  const readonly = isReadonly();
  document.body.classList.toggle('readonly-mode', readonly);
  const banner = $('#readonly-banner');
  if (banner) banner.hidden = !(readonly && ui.view === 'editor');
  updateToolsUI();
  const addBtn = $('#btn-add-character');
  if (addBtn) addBtn.disabled = readonly;
}

let mapPickCallback = null;
function pickMapFile(callback) {
  mapPickCallback = typeof callback === 'function' ? callback : null;
  const input = $('#map-file');
  if (!input) return;
  input.value = '';
  input.click();
}

/* ============================================================
   快捷键
   ============================================================ */
function onKeyDown(e) {
  if (e.key === 'Escape') {
    if (activeModal) { closeModal(); return; }
    const backdrop = $('#drawer-backdrop');
    if (backdrop && !backdrop.hidden) { closeDrawer(); return; }
    const picker = $('#mk-picker');
    if (picker && !picker.hidden) { closePicker(); return; }
    if (isTypingTarget(e.target)) { e.target.blur(); return; }
    if (drawing) { cancelRoute(); return; }
    if (ui.view === 'editor') {
      if (ui.tool === 'sector') setTool('select');
      else if (ui.selection) selectObject(null, null);
    }
    return;
  }
  if (activeModal) return;
  if (isTypingTarget(e.target)) return;
  if (e.key === '/' && ui.view === 'library') {
    e.preventDefault();
    const search = $('#lib-search');
    if (search) search.focus();
    return;
  }
  if (ui.view !== 'editor') return;
  const key = e.key.toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  if (mod && key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
  if (mod && key === 'y') { e.preventDefault(); redo(); return; }
  if (mod && key === 'd') { e.preventDefault(); duplicateSelected(); return; }
  if (mod || e.altKey) return;
  if (key === 'delete' || key === 'backspace') {
    if (ui.selection) { e.preventDefault(); deleteSelected(); }
    return;
  }
  if (key === ' ') {
    if (!spaceDown) {
      spaceDown = true;
      const stage = $('#stage');
      if (stage) stage.classList.add('space-pan');
    }
    e.preventDefault();
    return;
  }
  if (key === 'enter') {
    if (drawing) { e.preventDefault(); finishRoute(); }
    return;
  }
  if (key === '+' || key === '=') { e.preventDefault(); zoomIn(); return; }
  if (key === '-' || key === '_') { e.preventDefault(); zoomOut(); return; }
  if (key === '0') { e.preventDefault(); fitView(); return; }
  if (e.shiftKey) return;
  if (key === 'v') setTool('select');
  else if (key === 'h') setTool('pan');
  else if (key === 'm') setTool('marker');
  else if (key === 'c') openCharacterModal();
  else if (key === 'r') setTool('route');
  else if (key === 't') setTool('text');
  else if (key === 'z') setTool('sector');
}

function onKeyUp(e) {
  if (e.key === ' ') {
    spaceDown = false;
    const stage = $('#stage');
    if (stage) stage.classList.remove('space-pan');
  }
}

/* ============================================================
   事件绑定
   ============================================================ */
function bindStaticEvents() {
  const on = (id, event, handler, opts) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler, opts);
  };

  /* ---- 全局顶栏 / 帮助 ---- */
  on('btn-new', 'click', openNewTemplateModal);
  on('btn-import', 'click', () => $('#import-file').click());
  on('btn-import-ed', 'click', () => $('#import-file').click());
  on('btn-help', 'click', openDrawer);
  on('btn-help-ed', 'click', openDrawer);
  on('btn-help-close', 'click', closeDrawer);
  on('drawer-backdrop', 'click', closeDrawer);

  /* ---- 模板库 ---- */
  on('btn-add-cat', 'click', openCategoryModal);
  on('btn-empty-new', 'click', openNewTemplateModal);
  on('btn-empty-clear', 'click', () => {
    ui.search = '';
    ui.category = 'all';
    const search = $('#lib-search');
    if (search) search.value = '';
    renderLibrary();
  });
  on('btn-reload', 'click', () => {
    loadDb();
    renderLibrary();
    toast('已重新读取本地数据', 'ok');
  });
  on('btn-reset-data', 'click', async () => {
    const ok = await confirmDialog({
      eyebrow: 'RESET DATA',
      title: '以空模板库继续',
      subtitle: '当前浏览器中的模板数据会被覆盖。',
      message: h('div', { class: 'danger-note' },
        '如果还想保留旧数据，请先取消并尝试刷新页面或导出 JSON。确定要清空吗？'),
      confirmText: '清空并继续',
      tone: 'danger'
    });
    if (!ok) return;
    db = { templates: [], categories: DEFAULT_CATEGORIES.slice(), lastTemplateId: null, schemaVersion: SCHEMA_VERSION };
    loadFailed = false;
    saveNow();
    if (ui.view !== 'library') location.hash = '#/library';
    renderLibrary();
    toast('已重置为空模板库', 'warn');
  });
  on('lib-search', 'input', (e) => { ui.search = e.target.value; renderLibrary(); });
  on('lib-sort', 'change', (e) => { ui.sort = e.target.value; renderLibrary(); });

  const navEditor = $('#nav-editor-link');
  if (navEditor) {
    navEditor.addEventListener('click', (e) => {
      e.preventDefault();
      const id = db.lastTemplateId && db.templates.some((t) => t.id === db.lastTemplateId)
        ? db.lastTemplateId
        : (db.templates[0] && db.templates[0].id);
      if (!id) { toast('还没有模板，先新建一个', 'warn'); openNewTemplateModal(); return; }
      gotoEditor(id);
    });
  }

  /* ---- 编辑器顶部 ---- */
  on('ed-back', 'click', () => {
    flushSave();
    if (location.hash === '#/library') showLibrary();
    else location.hash = '#/library';
  });
  on('ed-title', 'click', openRenameModal);
  on('btn-undo', 'click', undo);
  on('btn-redo', 'click', redo);
  on('btn-toggle-left', 'click', () => {
    ui.leftOpen = !ui.leftOpen;
    updateEditorChrome(currentTemplate());
    setTimeout(layoutStage, 280);
  });
  on('btn-toggle-right', 'click', () => {
    ui.rightOpen = !ui.rightOpen;
    updateEditorChrome(currentTemplate());
    setTimeout(layoutStage, 280);
  });
  on('btn-export', 'click', openExportModal);

  /* ---- 左栏：模板信息 / 图层 / 底图 ---- */
  on('ti-category', 'change', (e) => {
    const t = currentTemplate();
    if (!t) return;
    const value = e.target.value;
    if (value === t.category) return;
    mutateCurrent((tpl) => { tpl.category = value; });
    toast('分类已更新', 'ok');
  });

  const desc = $('#ti-desc');
  if (desc) {
    let descStart = null;
    desc.addEventListener('focus', () => {
      const t = currentTemplate();
      descStart = t ? (t.description || '') : '';
    });
    desc.addEventListener('input', () => {
      const t = currentTemplate();
      if (!t) return;
      t.description = desc.value.slice(0, LIMITS.description);
      const counter = $('#ti-desc-count');
      if (counter) counter.textContent = t.description.length + ' / ' + LIMITS.description;
      scheduleSave();
    });
    desc.addEventListener('blur', () => {
      const t = currentTemplate();
      if (!t) return;
      if (descStart !== null && descStart !== t.description) {
        t.updatedAt = nowIso();
        pushHistory();
        updateUndoButtons();
      }
      descStart = null;
    });
  }

  const tagInput = $('#ti-tag-input');
  if (tagInput) {
    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
        e.preventDefault();
        addTags(tagInput.value);
        tagInput.value = '';
      }
    });
  }

  on('btn-add-character', 'click', openCharacterModal);
  on('btn-change-map', 'click', openMapModal);
  on('btn-change-map-2', 'click', openMapModal);
  on('btn-reset-map', 'click', resetTemplateMap);
  on('btn-map-error-change', 'click', openMapModal);
  on('btn-map-error-reset', 'click', resetTemplateMap);

  /* ---- 右侧页签 / 花名册 ---- */
  $$('#side-tabs .stab').forEach((btn) => {
    btn.addEventListener('click', () => {
      ui.tab = btn.dataset.tab;
      renderSideTabs();
      if (ui.tab === 'props') renderProps(currentTemplate());
      if (ui.tab === 'legend') renderLegend(currentTemplate());
    });
  });
  on('roster-search', 'input', (e) => {
    ui.rosterQuery = e.target.value;
    renderRoster(currentTemplate());
  });
  $$('#roster-filters .camp-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      ui.rosterCamp = btn.dataset.camp;
      renderRoster(currentTemplate());
    });
  });

  /* ---- 工具栏 / 缩放 / 吸附 ---- */
  $$('#stage-tools .tool').forEach((btn) => {
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
  });
  on('btn-zoom-out', 'click', zoomOut);
  on('btn-zoom-in', 'click', zoomIn);
  on('btn-fit', 'click', fitView);
  on('btn-back-full', 'click', returnToFullView);
  on('zoom-range', 'input', (e) => setZoom(Number(e.target.value) / 100));
  on('snap-select', 'change', (e) => {
    ui.snap = Number(e.target.value) || 0;
    updateHint();
  });

  /* ---- 画布 ---- */
  const stage = $('#stage');
  if (stage) {
    stage.addEventListener('pointerdown', onStagePointerDown);
    stage.addEventListener('pointermove', onStagePointerMove);
    stage.addEventListener('pointerup', onStagePointerUp);
    stage.addEventListener('pointercancel', onStagePointerUp);
    stage.addEventListener('wheel', (e) => {
      if (ui.view !== 'editor') return;
      e.preventDefault();
      const point = stagePoint(e);
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setZoom(view.zoom * factor, point);
    }, { passive: false });
    stage.addEventListener('dblclick', (e) => {
      if (ui.view === 'editor' && drawing) {
        e.preventDefault();
        finishRoute();
      }
    });
    stage.addEventListener('contextmenu', (e) => {
      if (ui.view === 'editor' && drawing) {
        e.preventDefault();
        cancelRoute();
      }
    });
  }

  /* ---- 保存失败横幅 ---- */
  on('btn-save-retry', 'click', () => {
    saveNow();
    if (saveStatus === 'error') toast('仍然保存失败，请导出备份并清理浏览器存储', 'error');
    else toast('已保存到当前浏览器', 'ok');
  });
  on('btn-save-export', 'click', quickExportBackup);
  on('btn-save-dismiss', 'click', hideSaveBanner);

  /* ---- 文件选择 ---- */
  on('import-file', 'change', async (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    input.value = '';
    if (file) await handleImportFile(file);
  });
  on('map-file', 'change', async (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    input.value = '';
    const callback = mapPickCallback;
    mapPickCallback = null;
    if (file && callback) await callback(file);
  });

  /* ---- 点击空白关闭标点选择器 ---- */
  document.addEventListener('pointerdown', (e) => {
    const picker = $('#mk-picker');
    if (!picker || picker.hidden) return;
    if (e.target.closest('#mk-picker')) return;
    if (e.target.closest('#stage')) return;
    closePicker();
  }, true);

  /* ---- 窗口级事件 ---- */
  window.addEventListener('hashchange', routeFromHash);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('beforeunload', flushSave);
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      updateReadonlyUI();
      if (ui.view === 'editor') layoutStage();
    });
  });
}

/* ============================================================
   初始化
   ============================================================ */
function init() {
  maps = loadMaps();
  loadDb();
  bindStaticEvents();
  updateSaveUI();
  if (!location.hash) {
    try { history.replaceState(null, '', '#/library'); }
    catch (_) { location.hash = '#/library'; }
  }
  routeFromHash();
  if (!initialized) {
    initialized = true;
    saveNow();
  }
  if (loadFailed) toast('本地数据读取失败，请查看模板库中的提示', 'error');
}

document.addEventListener('DOMContentLoaded', init);
