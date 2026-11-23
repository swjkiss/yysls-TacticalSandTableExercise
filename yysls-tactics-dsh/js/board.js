/* board.js — 画布引擎：缩放/平移、标点/分区/路径渲染、绘制与拖拽、坐标换算 */
(function (global) {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var COLORS = ['#D9A441', '#6E8B74', '#A8342A', '#B8935A', '#5A6470', '#C9A7D8', '#4C9BA8', '#D98C5A'];
  // 流派全名 → 单字图标，兼容直接存 icon 的旧数据
  var STYLE_ICON = {
    '牵丝·翊': '翊', '双剑': '剑', '陌刀': '刀', '枪': '枪', '扇': '扇',
    '伞': '伞', '双刀': '刃', '拳脚': '拳', '弓': '弓'
  };
  function styleIcon(v) { return STYLE_ICON[v] || v || '兵'; }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function el(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function Board(opts) {
    this.canvas = opts.canvas;
    this.wrap = opts.wrap;
    this.realMap = opts.realMap;
    this.emptyMap = opts.emptyMap;
    this.svg = opts.svg;
    this.markerLayer = opts.markerLayer;
    this.vLayer = opts.viewport;
    this.miniInner = opts.miniInner;
    this.cb = opts.callbacks || {};

    this.tpl = null;
    this.tool = 'select';
    this.zoom = 1;
    this.panX = 0; this.panY = 0;
    this.mapW = 1000; this.mapH = 700;
    this.hasMap = false;
    this.selected = null; // {kind:'mark'|'unit'|'zone', id}
    this.coordMode = 'px';

    // 交互态
    this.spaceDown = false;
    this.drag = null;
    this.pathPoints = [];

    this._bind();
  }

  Board.prototype.setTemplate = function (tpl) {
    this.tpl = tpl;
    this.zoom = (tpl.viewState && tpl.viewState.zoom) || 1;
    if (tpl.viewState && tpl.viewState.center) {
      this.panX = 0; this.panY = 0;
    }
    this.selected = null;
    this.applyTransform();
    this.render();
  };

  Board.prototype.setMapImage = function (src, w, h) {
    var mini = this.vLayer ? this.vLayer.closest('.minimap') : null;
    if (!src) {
      this.hasMap = false;
      this.realMap.style.display = 'none';
      this.realMap.removeAttribute('src'); // S17/S8：清除残留底图
      this.emptyMap.style.display = 'flex';
      this.mapW = 1000; this.mapH = 700;
      this.wrap.style.width = ''; this.wrap.style.height = '';
      this.svg.setAttribute('viewBox', '0 0 1000 700');
      if (mini) mini.hidden = true;
    } else {
      this.hasMap = true;
      this.realMap.src = src;
      this.realMap.style.display = 'block';
      this.emptyMap.style.display = 'none';
      this.mapW = w || 1000; this.mapH = h || 700;
      this.wrap.style.width = this.mapW + 'px';
      this.wrap.style.height = this.mapH + 'px';
      this.svg.setAttribute('viewBox', '0 0 ' + this.mapW + ' ' + this.mapH);
      if (mini) mini.hidden = false;
    }
    this.render();
  };

  Board.prototype.setCoordMode = function (m) { this.coordMode = m; };
  Board.prototype.setTool = function (t) {
    this.tool = t;
    this.pathPoints = [];
    this._updateHint();
  };

  Board.prototype.applyTransform = function () {
    this.wrap.style.transform = 'translate(' + this.panX + 'px,' + this.panY + 'px) scale(' + this.zoom + ')';
    if (this.cb.onZoom) this.cb.onZoom(Math.round(this.zoom * 100));
    this._updateViewport();
  };

  Board.prototype.fit = function () {
    var cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    if (!this.hasMap) { this.zoom = 1; this.panX = 0; this.panY = 0; this.applyTransform(); return; }
    var z = Math.min((cw - 120) / this.mapW, (ch - 120) / this.mapH, 1.5);
    z = clamp(z, 0.1, 8);
    this.zoom = z;
    this.panX = 0; this.panY = 0;
    if (this.tpl) this.tpl.viewState = { zoom: z, center: [0.5, 0.5] };
    this.applyTransform();
    if (this.cb.onChange) this.cb.onChange();
  };

  /* ---------- 坐标换算 ---------- */
  Board.prototype.clientToNorm = function (cx, cy) {
    var r = this.wrap.getBoundingClientRect();
    return { x: clamp((cx - r.left) / r.width, 0, 1), y: clamp((cy - r.top) / r.height, 0, 1) };
  };
  Board.prototype.normToClient = function (x, y) {
    var r = this.wrap.getBoundingClientRect();
    return { x: r.left + x * r.width, y: r.top + y * r.height };
  };
  Board.prototype.normToPixel = function (x, y) {
    return { x: x * this.mapW, y: y * this.mapH };
  };
  Board.prototype.formatCoord = function (n) {
    var p = this.normToPixel(n.x, n.y);
    if (this.coordMode === 'norm') return 'X ' + n.x.toFixed(3) + '   Y ' + n.y.toFixed(3);
    if (this.coordMode === 'game') return 'X ' + Math.round(n.x * 2000) + '   Y ' + Math.round(n.y * 2000);
    return 'X ' + p.x.toFixed(1) + '   Y ' + p.y.toFixed(1);
  };

  /* ---------- 渲染 ---------- */
  Board.prototype.render = function () {
    this._renderSvg();
    this._renderMarkers();
    this._updateCounts();
  };

  Board.prototype._renderSvg = function () {
    var s = this.svg;
    while (s.firstChild) s.removeChild(s.firstChild);
    var t = this.tpl;
    if (!t) return;
    var self = this;

    // 分区（虚线金框）
    (t.zones || []).forEach(function (z) {
      var x = (z.x - z.w / 2) * self.mapW, y = (z.y - z.h / 2) * self.mapH;
      var w = z.w * self.mapW, h = z.h * self.mapH;
      var g = el('g', {});
      g.appendChild(el('rect', {
        x: x, y: y, width: w, height: h,
        fill: hexA(z.color || '#B8935A', .07),
        stroke: self.selected && self.selected.kind === 'zone' && self.selected.id === z.id ? '#E8DFC8' : (z.color || '#B8935A'),
        'stroke-width': self.selected && self.selected.kind === 'zone' && self.selected.id === z.id ? 2.5 : 1.4,
        'stroke-dasharray': z.locked ? '2 4' : '8 5'
      }));
      var lb = el('text', { x: x + 8, y: y + 18, fill: z.color || '#B8935A', 'font-size': 14, 'font-family': 'STKaiti,serif' });
      lb.textContent = z.name || '分区';
      g.appendChild(lb);
      s.appendChild(g);
    });

    // 区域标记
    (t.marks || []).filter(function (m) { return m.type === 'area'; }).forEach(function (m) {
      s.appendChild(el('ellipse', {
        cx: m.x * self.mapW, cy: m.y * self.mapH,
        rx: (m.rx || 0.08) * self.mapW, ry: (m.ry || 0.08) * self.mapH,
        fill: hexA(m.color || '#6E8B74', .16), stroke: m.color || '#6E8B74', 'stroke-width': 1.6
      }));
    });

    // 路径
    (t.marks || []).filter(function (m) { return m.type === 'path' && m.points && m.points.length > 1; }).forEach(function (m) {
      var d = m.points.map(function (p, i) { return (i ? 'L' : 'M') + (p.x * self.mapW) + ',' + (p.y * self.mapH); }).join(' ');
      var defs = el('defs', {});
      var mid = 'arw_' + m.id;
      var mk = el('marker', { id: mid, markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: 'auto' });
      mk.appendChild(el('path', { d: 'M0,0 L6,3 L0,6 Z', fill: m.color || '#B8935A' }));
      defs.appendChild(mk); s.appendChild(defs);
      var last = m.points[m.points.length - 1];
      s.appendChild(el('path', {
        d: d, fill: 'none', stroke: m.color || '#B8935A', 'stroke-width': 2.4,
        'stroke-dasharray': '8 6', 'marker-end': 'url(#' + mid + ')', opacity: .9
      }));
    });

    // 正在绘制的路径预览
    if (this.pathPoints.length) {
      var pd = this.pathPoints.map(function (p, i) { return (i ? 'L' : 'M') + (p.x * self.mapW) + ',' + (p.y * self.mapH); }).join(' ');
      s.appendChild(el('path', { d: pd, fill: 'none', stroke: '#E8DFC8', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
    }
  };

  Board.prototype._renderMarkers = function () {
    var L = this.markerLayer;
    L.innerHTML = '';
    var t = this.tpl;
    if (!t) return;
    var self = this;

    (t.marks || []).filter(function (m) { return m.type === 'point' || m.type === 'text'; }).forEach(function (m) {
      var d = document.createElement('div');
      d.className = 'mk' + (self.selected && self.selected.id === m.id ? ' selected' : '');
      d.style.left = (m.x * 100) + '%'; d.style.top = (m.y * 100) + '%';
      d.dataset.kind = 'mark'; d.dataset.id = m.id;
      if (m.type === 'point') {
        var seal = document.createElement('div');
        seal.className = 'seal-mark';
        seal.style.background = m.color || '#D9A441';
        seal.textContent = m.label || '点';
        d.appendChild(seal);
        if (m.label) {
          var lb = document.createElement('div'); lb.className = 'mk-label'; lb.textContent = m.label;
          lb.style.color = m.color || '#D9A441'; d.appendChild(lb);
        }
      } else {
        var tx = document.createElement('div');
        tx.className = 'txt-mark'; tx.textContent = m.text || '文字';
        tx.style.color = m.color || '#E8DFC8'; d.appendChild(tx);
      }
      L.appendChild(d);
    });

    (t.units || []).forEach(function (u) {
      var d = document.createElement('div');
      d.className = 'mk' + (self.selected && self.selected.id === u.id ? ' selected' : '');
      d.style.left = (u.x * 100) + '%'; d.style.top = (u.y * 100) + '%';
      d.dataset.kind = 'unit'; d.dataset.id = u.id;
      var chip = document.createElement('div');
      chip.className = 'unit-chip ' + (u.side === 'enemy' ? 'enemy' : 'ally');
      chip.textContent = styleIcon(u.style).slice(0, 1);
      d.appendChild(chip);
      var nm = document.createElement('div'); nm.className = 'unit-name'; nm.textContent = u.name || '未命名';
      d.appendChild(nm);
      L.appendChild(d);
    });

    // SVG 层对象（分区/区域/路径）的透明命中区，使其可被点选与拖拽
    function hit(kind, obj, left, top, w, h) {
      var d = document.createElement('div');
      d.className = 'mk mk-hit' + (self.selected && self.selected.id === obj.id ? ' sel-hit' : '');
      d.style.left = (left * 100) + '%'; d.style.top = (top * 100) + '%';
      d.style.width = (w * 100) + '%'; d.style.height = (h * 100) + '%';
      d.dataset.kind = kind; d.dataset.id = obj.id;
      L.appendChild(d);
    }
    (t.zones || []).forEach(function (z) {
      hit('zone', z, z.x - z.w / 2, z.y - z.h / 2, z.w, z.h);
    });
    (t.marks || []).filter(function (m) { return m.type === 'area'; }).forEach(function (m) {
      hit('mark', m, m.x - (m.rx || .08), m.y - (m.ry || .06), (m.rx || .08) * 2, (m.ry || .06) * 2);
    });
    (t.marks || []).filter(function (m) { return m.type === 'path' && m.points && m.points.length > 1; }).forEach(function (m) {
      var xs = m.points.map(function (p) { return p.x; }), ys = m.points.map(function (p) { return p.y; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
      var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      var pad = .01;
      hit('mark', m, x0 - pad, y0 - pad, (x1 - x0) + pad * 2, (y1 - y0) + pad * 2);
    });
  };

  Board.prototype._updateCounts = function () {
    if (!this.tpl || !this.cb.onCount) return;
    var t = this.tpl;
    this.cb.onCount((t.zones || []).length + (t.marks || []).length + (t.units || []).length);
  };

  /* ---------- 选中 ---------- */
  Board.prototype.select = function (kind, id) {
    this.selected = kind && id ? { kind: kind, id: id } : null;
    this.render();
    if (this.cb.onSelect) this.cb.onSelect(this.selected);
  };
  Board.prototype.getSelected = function () {
    if (!this.selected || !this.tpl) return null;
    var arr = this.selected.kind === 'zone' ? this.tpl.zones : this.selected.kind === 'unit' ? this.tpl.units : this.tpl.marks;
    return (arr || []).find(function (x) { return x.id === this.selected.id; }, this) || null;
  };

  /* ---------- 绘制对象工厂 ---------- */
  function makeMark(type, n, color) {
    var m = { id: Store.newId('mk'), type: type, x: n.x, y: n.y, color: color || '#D9A441', label: '', text: '', rx: .08, ry: .06, points: [] };
    if (type === 'point') m.label = '据点';
    if (type === 'text') m.text = '文字';
    if (type === 'area') { m.rx = .08; m.ry = .06; }
    return m;
  }

  Board.prototype._addObject = function (n) {
    var t = this.tpl;
    var obj = null, kind = null;
    switch (this.tool) {
      case 'point': case 'text': case 'area':
        obj = makeMark(this.tool, n, COLORS[(t.marks || []).length % COLORS.length]);
        kind = 'mark'; t.marks.push(obj); break;
      case 'unit': {
        var members = this.cb.getMembers ? this.cb.getMembers() : [];
        var mem = members.length ? members[0] : null;
        obj = {
          id: Store.newId('u'), memberId: mem ? mem.id : '', x: n.x, y: n.y,
          name: mem ? mem.name : '新成员', style: mem ? mem.style : '牵丝·翊',
          side: 'ally', zoneId: ''
        };
        kind = 'unit'; t.units.push(obj);
        if (mem) mem.unitId = obj.id; // S16：回填 member.unitId 保持双向引用
        break;
      }
      case 'zone':
        obj = { id: Store.newId('z'), name: '新分区', x: n.x, y: n.y, w: .18, h: .14, color: '#B8935A', owner: '', locked: false };
        kind = 'zone'; t.zones.push(obj); break;
    }
    if (obj) {
      this.select(kind, obj.id);
      if (this.cb.onChange) this.cb.onChange();
      this._updateHint();
    }
  };

  /* ---------- 事件绑定 ---------- */
  Board.prototype._bind = function () {
    var self = this;
    function inField() { return /INPUT|TEXTAREA|SELECT/.test(document.activeElement ? document.activeElement.tagName : ''); }

    document.addEventListener('keydown', function (e) {
      if (inField()) return; // S3/S4：输入框内不拦截空格、Enter、快捷键
      if (e.code === 'Space') { self.spaceDown = true; e.preventDefault(); }
      if (e.key === 'Enter' && self.pathPoints.length >= 2) self._finishPath();
      if (e.key === 'Escape') { self.pathPoints = []; self.render(); }
    });
    document.addEventListener('keyup', function (e) { if (e.code === 'Space') self.spaceDown = false; });

    this.canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var old = self.zoom;
      var factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      self.zoom = clamp(self.zoom * factor, 0.1, 32);
      // 以指针为锚点补偿平移
      var rect = self.canvas.getBoundingClientRect();
      var px = e.clientX - rect.left - rect.width / 2;
      var py = e.clientY - rect.top - rect.height / 2;
      self.panX = px - (px - self.panX) * (self.zoom / old);
      self.panY = py - (py - self.panY) * (self.zoom / old);
      if (self.tpl) self.tpl.viewState = { zoom: self.zoom, center: [0.5, 0.5] };
      self.applyTransform();
      if (self.cb.onChange) self.cb.onChange();
    }, { passive: false });

    this.canvas.addEventListener('mousedown', function (e) {
      if (e.button === 1 || self.spaceDown) {
        self.drag = { mode: 'pan', sx: e.clientX, sy: e.clientY, px: self.panX, py: self.panY };
        self.canvas.classList.add('panning');
        e.preventDefault(); return;
      }
      if (e.button !== 0) return;
      var mk = e.target.closest('.mk');
      // 路径绘制中：点击空白处加点（S5：双击的第二下不加点，交给 dblclick 结束）
      if (self.tool === 'path') {
        if (!self.hasMap) return;
        if (e.detail >= 2) return;
        var n = self.clientToNorm(e.clientX, e.clientY);
        self.pathPoints.push(n); self.render(); return;
      }
      if (mk && self.tool === 'select') {
        self.select(mk.dataset.kind, mk.dataset.id);
        var startObj = self.getSelected();
        // 判断是否为“中心跟指针”类型：据点(point)/文字(text)/人物(unit)；其余按偏移整体平移
        var follow = mk.dataset.kind === 'unit' ||
          (mk.dataset.kind === 'mark' && startObj && (startObj.type === 'point' || startObj.type === 'text'));
        // path 没有 x/y，用点集质心作为基准，避免拖拽产生 NaN
        var ox = startObj ? startObj.x : 0, oy = startObj ? startObj.y : 0;
        var pts = startObj && startObj.points ? startObj.points.map(function (p) { return { x: p.x, y: p.y }; }) : null;
        if (pts && pts.length && (!isFinite(ox) || !isFinite(oy))) {
          ox = pts.reduce(function (a, p) { return a + p.x; }, 0) / pts.length;
          oy = pts.reduce(function (a, p) { return a + p.y; }, 0) / pts.length;
        }
        self.drag = {
          mode: 'marker', id: mk.dataset.id, kind: mk.dataset.kind,
          follow: follow, startN: self.clientToNorm(e.clientX, e.clientY),
          ox: isFinite(ox) ? ox : 0, oy: isFinite(oy) ? oy : 0, pts: pts
        };
        e.preventDefault(); return;
      }
      if (mk) return;
      // 空白：绘制 or 平移
      if (!self.hasMap) return;
      if (self.tool !== 'select') {
        self._addObject(self.clientToNorm(e.clientX, e.clientY));
      } else {
        self.select(null, null);
        self.drag = { mode: 'pan', sx: e.clientX, sy: e.clientY, px: self.panX, py: self.panY };
        self.canvas.classList.add('panning');
      }
    });

    document.addEventListener('mousemove', function (e) {
      if (self.hasMap) {
        var n = self.clientToNorm(e.clientX, e.clientY);
        if (self.cb.onCoord && n.x >= 0 && n.x <= 1 && n.y >= 0 && n.y <= 1) self.cb.onCoord(self.formatCoord(n));
      }
      if (!self.drag) return;
      if (self.drag.mode === 'pan') {
        self.panX = self.drag.px + (e.clientX - self.drag.sx);
        self.panY = self.drag.py + (e.clientY - self.drag.sy);
        self.applyTransform();
      } else if (self.drag.mode === 'marker') {
        var obj = self.getSelected();
        if (obj) {
          var np = self.clientToNorm(e.clientX, e.clientY);
          var d = self.drag;
          if (d.follow) {
            obj.x = np.x; obj.y = np.y;
          } else {
            // 按位移整体平移：区域/分区移动中心，路径移动所有点
            var dx = np.x - d.startN.x, dy = np.y - d.startN.y;
            if (d.pts) {
              obj.points = d.pts.map(function (p) { return { x: p.x + dx, y: p.y + dy }; });
              obj.x = d.ox + dx; obj.y = d.oy + dy;
            } else {
              obj.x = d.ox + dx; obj.y = d.oy + dy;
            }
          }
          self._renderSvg();
          // 更新对应命中区 DOM
          self._renderMarkers();
        }
      }
    });

    document.addEventListener('mouseup', function () {
      if (!self.drag) return;
      if (self.drag.mode === 'marker') { self.applyTransform(); if (self.cb.onChange) self.cb.onChange(); }
      self.drag = null;
      self.canvas.classList.remove('panning');
    });

    this.canvas.addEventListener('dblclick', function () { if (self.pathPoints.length >= 2) self._finishPath(); });

    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && self.selected) {
        if (inField()) return;
        e.preventDefault(); self.deleteSelected();
      }
      if (inField()) return; // S4：输入框内的 Ctrl+Z/Y 交给输入框自身处理
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); if (self.cb.onUndo) self.cb.onUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); if (self.cb.onRedo) self.cb.onRedo(); }
      var map = { v: 'select', '1': 'point', '2': 'area', '3': 'path', '4': 'text', '5': 'unit', '6': 'zone' };
      if (map[e.key.toLowerCase()] && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
        if (self.cb.onToolKey) self.cb.onToolKey(map[e.key.toLowerCase()]);
      }
    });
  };

  Board.prototype._finishPath = function () {
    if (this.pathPoints.length >= 2 && this.tpl) {
      this.tpl.marks.push({
        id: Store.newId('mk'), type: 'path', points: this.pathPoints.slice(),
        color: '#B8935A'
      });
      this.pathPoints = [];
      this.render();
      if (this.cb.onChange) this.cb.onChange();
      this._updateHint();
    }
  };

  Board.prototype.deleteSelected = function () {
    if (!this.selected || !this.tpl) return;
    var s = this.selected;
    var arr = s.kind === 'zone' ? this.tpl.zones : s.kind === 'unit' ? this.tpl.units : this.tpl.marks;
    var idx = arr.findIndex(function (x) { return x.id === s.id; });
    if (idx >= 0) arr.splice(idx, 1);
    if (s.kind === 'unit') {
      // 解绑编队成员引用
      (this.tpl.squads || []).forEach(function (sq) {
        (sq.members || []).forEach(function (m) { if (m.unitId === s.id) m.unitId = ''; });
      });
    }
    this.selected = null;
    this.render();
    if (this.cb.onSelect) this.cb.onSelect(null);
    if (this.cb.onChange) this.cb.onChange();
  };

  Board.prototype._updateViewport = function () {
    if (!this.miniInner || !this.vLayer || !this.hasMap) return;
    var cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    var shownW = cw / this.zoom, shownH = ch / this.zoom;
    var relW = clamp(shownW / this.mapW, 0.02, 1);
    var relH = clamp(shownH / this.mapH, 0.02, 1);
    // 中心点由 pan 反推
    var cx = (cw / 2 - this.panX) / (this.mapW * this.zoom);
    var cy = (ch / 2 - this.panY) / (this.mapH * this.zoom);
    var left = clamp((cx - relW / 2) * 100, 0, 100 - relW * 100);
    var top = clamp((cy - relH / 2) * 100, 0, 100 - relH * 100);
    this.vLayer.style.left = left + '%';
    this.vLayer.style.top = top + '%';
    this.vLayer.style.width = relW * 100 + '%';
    this.vLayer.style.height = relH * 100 + '%';
    this.miniInner.style.backgroundImage = this.realMap.src ? 'url("' + this.realMap.src + '")' : '';
  };

  Board.prototype._updateHint = function () {
    var h = { select: '选择/拖拽标点', point: '点击地图放置据点标记', area: '点击放置控制区域', path: '连续点击绘制路径，双击或回车结束', text: '点击放置文字标签', unit: '点击放置人物标点', zone: '点击放置作战分区' };
    var self = this;
    if (this.cb.onHint) this.cb.onHint(h[this.tool] || '就绪' + (this.pathPoints.length ? '（已选 ' + this.pathPoints.length + ' 点）' : ''));
  };

  function hexA(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  Board.COLORS = COLORS;
  global.Board = Board;
})(window);
