/* app.js — 业务编排：状态、历史、模板库、编队、导入导出、属性面板、初始化 */
(function (global) {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  // 流派字典：流派简称用于默认命名（如 翊→翊翊1号，双剑→双剑1号）
  var STYLES = [
    { name: '牵丝·翊', short: '翊', icon: '翊', role: '辅助' },
    { name: '双剑', short: '双剑', icon: '剑', role: '突进' },
    { name: '陌刀', short: '陌刀', icon: '刀', role: '重装' },
    { name: '枪', short: '枪', icon: '枪', role: '机动' },
    { name: '扇', short: '扇', icon: '扇', role: '续航' },
    { name: '伞', short: '伞', icon: '伞', role: '控场' },
    { name: '双刀', short: '双刀', icon: '刃', role: '奇袭' },
    { name: '拳脚', short: '拳', icon: '拳', role: '控制' },
    { name: '弓', short: '弓', icon: '弓', role: '压制' }
  ];

  var App = {
    tpl: null,
    board: null,
    maps: [],
    history: [],
    future: [],
    pendingMember: null,   // 下一枚人物标点所用的编队成员
    saveTimer: null,
    coordMode: 'px',
    suppressHistory: false  // 同步改名/改流派时避免重复入栈
  };

  /* ================= 历史（撤销/重做） =================
     保存 lastSnapshot = 最近一次“干净”状态。改动发生后调 markChanged，
     把 lastSnapshot 推入历史，再把当前(改动后)状态记为新的干净状态。
     这样 undo 弹回的正是改动前的样子。 */
  function snapshot() { return App.tpl ? JSON.parse(JSON.stringify(App.tpl)) : null; }
  function markClean() { App.lastSnapshot = snapshot(); }
  function pushHistory() {
    if (App.suppressHistory) return;
    if (App.lastSnapshot) {
      App.history.push(App.lastSnapshot);
      if (App.history.length > 50) App.history.shift();
    }
    App.future = [];
    markClean();
  }
  function restore(s) {
    if (!s) return;
    App.tpl = JSON.parse(JSON.stringify(s));
    App.board.setTemplate(App.tpl);
    $('#tplName').value = App.tpl.name;
    $('#notes').value = App.tpl.notes || '';
    renderInspector(); renderSquads();
    App.lastSnapshot = snapshot();
    scheduleSave(true);
    toast('已恢复到上一状态');
  }
  App.undo = function () {
    if (!App.history.length) return toast('没有可撤销的操作');
    App.future.push(snapshot());
    restore(App.history.pop());
  };
  App.redo = function () {
    if (!App.future.length) return toast('没有可重做的操作');
    App.history.push(snapshot());
    restore(App.future.pop());
  };

  /* ================= 保存 ================= */
  function setSaveState(txt, saving) {
    var el = $('#saveState');
    el.classList.toggle('saving', !!saving);
    el.querySelector('.txt').textContent = txt;
  }
  function scheduleSave(immediate) {
    clearTimeout(App.saveTimer);
    setSaveState('保存中…', true);
    App.saveTimer = setTimeout(function () {
      if (!App.tpl) return;
      if (App.tpl.viewState) App.tpl.viewState.zoom = App.board.zoom;
      Store.saveTemplate(App.tpl).then(function () {
        setSaveState('已存 · ' + new Date().toTimeString().slice(0, 5), false);
        renderTree();
      }).catch(function () { setSaveState('保存失败', false); });
    }, immediate ? 0 : 500);
  }
  App.markChanged = function () { pushHistory(); scheduleSave(); };

  /* ================= 模板库 ================= */
  function renderTree() {
    var idx = Store.getIndex();
    var root = $('#tplTree');
    root.innerHTML = '';
    var g = document.createElement('div');
    g.className = 'tree-row lv0';
    g.innerHTML = '<span class="ic">◆</span>百业战 · 战术模板';
    root.appendChild(g);

    var byMap = {};
    idx.forEach(function (e) { (byMap[e.mapName || e.mapId || '未指定地图'] = byMap[e.mapName || e.mapId || '未指定地图'] || []).push(e); });
    Object.keys(byMap).forEach(function (mapName) {
      var mg = document.createElement('div');
      mg.className = 'tree-row lv1';
      mg.innerHTML = '<span class="ic">▣</span>' + escapeHtml(mapName);
      root.appendChild(mg);
      byMap[mapName].forEach(function (e) {
        var r = document.createElement('div');
        r.className = 'tree-row lv2' + (App.tpl && App.tpl.id === e.id ? ' selected' : '');
        r.innerHTML = '<span class="ic">✦</span><span class="nm">' + escapeHtml(e.name) + '</span><span class="del" title="删除">✕</span>';
        r.onclick = function (ev) {
          if (ev.target.classList.contains('del')) {
            ev.stopPropagation();
            confirmModal('删除模板', '确定删除「' + e.name + '」？此操作不可撤销。', function () {
              Store.deleteTemplate(e.id).then(function () {
                if (App.tpl && App.tpl.id === e.id) { App.tpl = null; newTemplate(); }
                renderTree(); toast('已删除模板');
              });
            });
            return;
          }
          openTemplate(e.id);
        };
        root.appendChild(r);
      });
    });
  }

  function openTemplate(id) {
    Store.loadTemplate(id).then(function (t) {
      if (!t) return toast('模板不存在');
      App.tpl = t;
      App.board.setTemplate(t);
      $('#tplName').value = t.name;
      $('#notes').value = t.notes || '';
      Store.setActiveId(id);
      var map = App.maps.find(function (m) { return m.id === t.mapId; });
      if (map) App.board.setMapImage(map.src, map.w, map.h);
      else App.board.setMapImage(null);
      App.history = []; App.future = []; App.lastSnapshot = null;
      renderTree(); renderSquads(); renderInspector();
      // 恢复保存的视角；无有效缩放时才重新适配
      if (!t.viewState || !t.viewState.zoom || t.viewState.zoom <= 0) { App.board.fit(); }
      else { App.board.applyTransform(); markClean(); }
      setSaveState('已载入', false);
    });
  }

  function newTemplate() {
    var tpl = Store.blankTemplate('未命名战术', App.maps.length ? App.maps[0].id : '');
    if (App.maps.length) tpl.mapName = App.maps[0].name;
    App.tpl = tpl;
    App.board.setTemplate(tpl);
    $('#tplName').value = tpl.name;
    $('#notes').value = '';
    Store.setActiveId(tpl.id);
    App.history = []; App.future = []; App.lastSnapshot = null;
    renderTree(); renderSquads(); renderInspector();
    // S8：新建模板时若已有底图则直接载入，避免残留上一模板画面
    var map = App.maps.find(function (m) { return m.id === tpl.mapId; });
    App.board.setMapImage(map ? map.src : null, map ? map.w : 1000, map ? map.h : 700);
    App.board.fit();
    markClean();
    scheduleSave(true);
    toast('已新建模板，先上传或选择一张底图');
  }
  App.newTemplate = newTemplate;

  /* ================= 地图资源 ================= */
  function renderMaps() {
    var box = $('#mapRes');
    box.innerHTML = '';
    App.maps.forEach(function (m) {
      var c = document.createElement('div');
      c.className = 'res-card' + (App.tpl && App.tpl.mapId === m.id ? ' active' : '');
      var th = document.createElement('div');
      th.className = 'res-thumb';
      if (m.src) th.style.backgroundImage = 'url("' + m.src + '")';
      else th.textContent = '无预览';
      c.appendChild(th);
      var n = document.createElement('div'); n.className = 'rn'; n.textContent = m.name; c.appendChild(n);
      var meta = document.createElement('div'); meta.className = 'rm';
      meta.textContent = m.w + '×' + m.h + ' · ' + (m.size ? Math.round(m.size / 1024) + 'KB' : ''); c.appendChild(meta);
      var bd = document.createElement('div'); bd.className = 'badge-ok'; bd.textContent = '● 已就绪'; c.appendChild(bd);
      var del = document.createElement('button');
      del.className = 'squad-del'; del.textContent = '删除底图'; del.style.marginTop = '6px';
      del.onclick = function (e) {
        e.stopPropagation();
        confirmModal('删除底图', '删除「' + m.name + '」？引用该底图的模板将失去底图显示。', function () {
          Store.deleteMap(m.id).then(loadMaps);
        });
      };
      c.appendChild(del);
      c.onclick = function () {
        if (!App.tpl) return toast('先新建模板');
        App.tpl.mapId = m.id; App.tpl.mapName = m.name;
        App.board.setMapImage(m.src, m.w, m.h);
        App.board.fit();
        App.markChanged();
        renderMaps(); renderTree(); toast('已切换底图：' + m.name);
      };
      box.appendChild(c);
    });
  }

  function loadMaps() {
    return Store.loadAllMaps().then(function (arr) {
      App.maps = arr;
      renderMaps();
      return arr;
    });
  }

  function uploadMap(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast('请选择图片文件', true);
    if (file.size > 20 * 1024 * 1024) return toast('图片超过 20MB，请压缩后再传', true);
    var reader = new FileReader();
    reader.onload = function (e) {
      var src = e.target.result;
      var img = new Image();
      img.onload = function () {
        var name = file.name.replace(/\.[^.]+$/, '');
        var map = { id: Store.newId('map'), name: name, src: src, w: img.width, h: img.height, size: file.size };
        // 限制长边 4096
        if (Math.max(img.width, img.height) > 4096) {
          var scale = 4096 / Math.max(img.width, img.height);
          var cv = document.createElement('canvas');
          cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          map.src = cv.toDataURL('image/png'); map.w = cv.width; map.h = cv.height;
        }
        Store.saveMap(map).then(function () {
          loadMaps().then(function () {
            if (App.tpl) {
              App.tpl.mapId = map.id; App.tpl.mapName = map.name;
              App.board.setMapImage(map.src, map.w, map.h);
              App.board.fit();
              App.markChanged(); renderMaps(); renderTree();
            }
            toast('底图已上传：' + name);
          });
        }).catch(function () { toast('底图保存失败（空间不足？）', true); });
      };
      img.onerror = function () { toast('图片解析失败', true); };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  /* ================= 编队 ================= */
  function styleOf(name) {
    return STYLES.find(function (s) { return s.name === name || s.short === name; }) || STYLES[0];
  }
  function nextMemberName(tpl, style) {
    var n = 1;
    var all = [];
    (tpl.squads || []).forEach(function (sq) { (sq.members || []).forEach(function (m) { all.push(m); }); });
    while (all.some(function (m) { return m.name === style.short + n + '号'; })) n++;
    return style.short + n + '号';
  }

  function renderSquads() {
    var box = $('#squadList');
    box.innerHTML = '';
    if (!App.tpl) return;
    (App.tpl.squads || []).forEach(function (sq, si) {
      var d = document.createElement('div'); d.className = 'squad';
      var title = document.createElement('div'); title.className = 'squad-title';
      var nm = document.createElement('input');
      nm.className = 'squad-name'; nm.value = sq.name; nm.spellcheck = false;
      nm.oninput = function () { sq.name = nm.value; scheduleSave(); };
      var del = document.createElement('button'); del.className = 'squad-del'; del.textContent = '✕'; del.title = '解散队伍';
      del.onclick = function () {
        confirmModal('解散队伍', '解散「' + sq.name + '」？地图上的对应人物标点也会清理。', function () {
          var ids = (sq.members || []).map(function (m) { return m.id; });
          App.tpl.units = (App.tpl.units || []).filter(function (u) { return ids.indexOf(u.memberId) < 0; });
          App.tpl.squads.splice(si, 1);
          App.board.select(null, null);
          App.markChanged(); renderSquads();
        });
      };
      title.appendChild(nm); title.appendChild(del); d.appendChild(title);

      (sq.members || []).forEach(function (m, mi) {
        var row = document.createElement('div');
        row.className = 'member' + (App.pendingMember === m.id ? ' selected' : '');
        var st = styleOf(m.style);
        var ic = document.createElement('div'); ic.className = 'wicon' + (st.name.indexOf('翊') >= 0 ? ' yi' : ''); ic.textContent = st.icon;
        row.appendChild(ic);
        var mn = document.createElement('div'); mn.className = 'mname';
        var inp = document.createElement('input'); inp.value = m.name; inp.spellcheck = false;
        inp.oninput = function () {
          m.name = inp.value;
          App.suppressHistory = true;
          (App.tpl.units || []).forEach(function (u) { if (u.memberId === m.id) u.name = m.name; });
          App.board.render();
          App.suppressHistory = false;
          scheduleSave();
        };
        mn.appendChild(inp); row.appendChild(mn);
        var sel = document.createElement('select'); sel.className = 'mstyle';
        STYLES.forEach(function (s) {
          var o = document.createElement('option'); o.value = s.name; o.textContent = s.short;
          if (s.name === m.style) o.selected = true; sel.appendChild(o);
        });
        sel.onchange = function () {
          m.style = sel.value; // 全名，与属性面板 option value 及 styleIcon 映射统一
          App.suppressHistory = true;
          (App.tpl.units || []).forEach(function (u) {
            if (u.memberId === m.id) u.style = m.style;
          });
          App.board.render();
          App.suppressHistory = false;
          scheduleSave();
        };
        row.appendChild(sel);
        var role = document.createElement('div'); role.className = 'mrole'; role.textContent = st.role; row.appendChild(role);
        var md = document.createElement('button'); md.className = 'member-del'; md.textContent = '✕'; md.title = '移除成员';
        md.onclick = function (e) {
          e.stopPropagation();
          App.tpl.units = (App.tpl.units || []).filter(function (u) { return u.memberId !== m.id; });
          sq.members.splice(mi, 1);
          App.board.select(null, null);
          App.markChanged(); renderSquads(); App.board.render();
        };
        row.appendChild(md);
        row.onclick = function (e) {
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
          App.pendingMember = App.pendingMember === m.id ? null : m.id;
          renderSquads();
          App.board.setTool('unit'); updateToolUI('unit');
          toast(App.pendingMember ? '已选「' + m.name + '」，点击地图放下该成员' : '已取消成员选择');
        };
        d.appendChild(row);
      });

      var add = document.createElement('button'); add.className = 'add-member'; add.textContent = '＋ 添加流派人物';
      add.onclick = function () {
        var st = STYLES[0];
        var m = { id: Store.newId('m'), style: st.name, name: nextMemberName(App.tpl, st), unitId: '' };
        sq.members = sq.members || []; sq.members.push(m);
        App.markChanged(); renderSquads(); toast('已添加 ' + m.name + '，点它再点地图即可布阵');
      };
      d.appendChild(add);
      box.appendChild(d);
    });
  }

  App.getMembers = function () {
    var out = [];
    if (!App.tpl) return out;
    (App.tpl.squads || []).forEach(function (sq) {
      (sq.members || []).forEach(function (m) { out.push(m); });
    });
    if (App.pendingMember) {
      var i = out.findIndex(function (m) { return m.id === App.pendingMember; });
      if (i > 0) { var t = out[0]; out[0] = out[i]; out[i] = t; }
    }
    return out;
  };

  /* ================= 属性检查器 ================= */
  function renderInspector() {
    var box = $('#inspector');
    box.innerHTML = '';
    var sel = App.board && App.board.getSelected ? App.board.getSelected() : null;
    if (!sel) {
      box.innerHTML = '<div class="no-sel">未选中对象<br><small>点击地图标点或列表项编辑属性</small></div>';
      return;
    }
    var kind = App.board.selected.kind;
    var titleMap = { zone: '作战分区', unit: '人物标点', mark: '地图标点' };
    var sec = document.createElement('div'); sec.className = 'inspector-section';
    var st = document.createElement('div'); st.className = 'st';
    st.innerHTML = '<span>▾ ' + titleMap[kind] + '</span><span>' + escapeHtml(sel.name || sel.label || sel.text || (sel.type || '')) + '</span>';
    sec.appendChild(st);
    var sb = document.createElement('div'); sb.className = 'sb';
    sec.appendChild(sb);

    function field(label, control) {
      var r = document.createElement('div'); r.className = 'field';
      var l = document.createElement('label'); l.textContent = label; r.appendChild(l);
      r.appendChild(control); sb.appendChild(r);
    }
    function input(val, oninput, type) {
      var i = document.createElement('input');
      if (type) i.type = type; else i.value = val == null ? '' : val;
      i.spellcheck = false;
      if (oninput) i.oninput = oninput;
      return i;
    }
    function commit() { App.markChanged(); App.board.render(); }

    if (kind === 'zone') {
      field('名称', input(sel.name, function (e) { sel.name = e.target.value; commit(); }));
      var own = document.createElement('select');
      own.appendChild(new Option('未指定', ''));
      (App.tpl.squads || []).forEach(function (sq) { own.appendChild(new Option(sq.name, sq.id)); });
      own.value = sel.owner || '';
      own.onchange = function () { sel.owner = own.value; commit(); };
      field('负责队伍', own);
      field('标识色', input(sel.color, function (e) { sel.color = e.target.value; commit(); }, 'color'));
      field('宽', input(sel.w.toFixed(3), function (e) { var v = parseFloat(e.target.value); if (!isNaN(v)) { sel.w = v; commit(); } }));
      field('高', input(sel.h.toFixed(3), function (e) { var v = parseFloat(e.target.value); if (!isNaN(v)) { sel.h = v; commit(); } }));
      var lock = input(null, null, 'checkbox'); lock.checked = !!sel.locked;
      lock.onchange = function () { sel.locked = lock.checked; commit(); };
      field('锁定', lock);
    } else if (kind === 'unit') {
      // S9：反向同步——地图改名字/流派后回写对应编队成员
      function syncMember(patch) {
        if (!sel.memberId) return;
        (App.tpl.squads || []).forEach(function (sq) {
          (sq.members || []).forEach(function (m) { if (m.id === sel.memberId) Object.assign(m, patch); });
        });
        App.suppressHistory = true;
        renderSquads();
        App.suppressHistory = false;
      }
      field('显示名', input(sel.name, function (e) {
        sel.name = e.target.value; syncMember({ name: sel.name }); commit();
      }));
      var sd = document.createElement('select');
      sd.appendChild(new Option('我方', 'ally')); sd.appendChild(new Option('敌方', 'enemy'));
      sd.value = sel.side || 'ally';
      sd.onchange = function () { sel.side = sd.value; commit(); };
      field('阵营', sd);
      var stSel = document.createElement('select');
      STYLES.forEach(function (s) { stSel.appendChild(new Option(s.short, s.name)); });
      stSel.value = sel.style || '牵丝·翊';
      stSel.onchange = function () {
        sel.style = stSel.value;
        syncMember({ style: sel.style });
        commit();
      };
      field('流派', stSel);
      var zs = document.createElement('select');
      zs.appendChild(new Option('无分区', ''));
      (App.tpl.zones || []).forEach(function (z) { zs.appendChild(new Option(z.name, z.id)); });
      zs.value = sel.zoneId || '';
      zs.onchange = function () { sel.zoneId = zs.value; commit(); };
      field('所属分区', zs);
      var pos = document.createElement('span'); pos.className = 'val';
      pos.textContent = App.board.formatCoord({ x: sel.x, y: sel.y });
      field('坐标', pos);
    } else {
      var typeLbl = document.createElement('span'); typeLbl.className = 'val';
      typeLbl.textContent = { point: '据点标记', area: '控制区域', path: '路径', text: '文字' }[sel.type] || sel.type;
      field('类型', typeLbl);
      field('文字', input(sel.type === 'text' ? sel.text : sel.label, function (e) {
        if (sel.type === 'text') sel.text = e.target.value; else sel.label = e.target.value; commit();
      }));
      field('颜色', input(sel.color, function (e) { sel.color = e.target.value; commit(); }, 'color'));
      var pos2 = document.createElement('span'); pos2.className = 'val';
      var cx = sel.x, cy = sel.y;
      if (sel.type === 'path' && (!isFinite(cx) || !isFinite(cy)) && sel.points && sel.points.length) {
        cx = sel.points.reduce(function (a, p) { return a + p.x; }, 0) / sel.points.length;
        cy = sel.points.reduce(function (a, p) { return a + p.y; }, 0) / sel.points.length;
      }
      pos2.textContent = App.board.formatCoord({ x: cx || 0, y: cy || 0 });
      field('坐标', pos2);
    }
    box.appendChild(sec);
  }

  /* ================= 导入 / 导出 ================= */
  function download(name, text) {
    var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function safeName(s) { return (s || 'template').replace(/[\\/:*?"<>|]/g, '_'); }

  App.doExport = function (act) {
    if (!App.tpl) return toast('没有当前模板', true);
    if (act === 'json' || act === 'clip') {
      var text = JSON.stringify(App.tpl, null, 2);
      if (act === 'clip') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { toast('JSON 已复制'); });
        } else toast('剪贴板不可用，请改用导出文件', true);
      } else {
        download(safeName(App.tpl.name) + '.json', text); toast('模板已导出');
      }
    } else if (act === 'pack') {
      var map = App.maps.find(function (m) { return m.id === App.tpl.mapId; }) || null;
      var pack = Store.exportPack(App.tpl, map);
      download(safeName(App.tpl.name) + '_战术包.json', JSON.stringify(pack, null, 2));
      toast('模板包已导出（含底图）');
    }
  };

  function handleImport(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var obj;
      try { obj = JSON.parse(e.target.result); }
      catch (err) { return toast('JSON 解析失败', true); }
      var v = Store.validateImport(obj);
      if (!v.ok) return toast(v.msg, true);
      var apply = function (asNew) {
        var t = v.tpl;
        if (asNew) t.id = Store.newId('tpl');
        var mapPromise = Promise.resolve();
        if (v.map && v.map.src) {
          // S10：同 id 地图也用导入包内容更新，保证底图随模板走
          mapPromise = Store.saveMap(v.map).then(loadMaps);
        }
        mapPromise.then(function () {
          Store.saveTemplate(t).then(function () {
            App.tpl = t;
            App.board.setTemplate(t);
            $('#tplName').value = t.name; $('#notes').value = t.notes || '';
            Store.setActiveId(t.id);
            App.history = []; App.future = []; App.lastSnapshot = null;
            renderTree(); renderSquads(); renderInspector();
            var map = App.maps.find(function (m) { return m.id === t.mapId; });
            App.board.setMapImage(map ? map.src : null, map ? map.w : 1000, map ? map.h : 700);
            App.board.fit();
            markClean();
            toast('导入成功：' + t.name);
          });
        });
      };
      var exists = Store.getIndex().some(function (x) { return x.id === v.tpl.id; });
      if (exists) {
        confirmModal('模板已存在', '本地已有同名 ID 的模板。覆盖现有模板？取消则另存为新模板。',
          function () { apply(false); },
          function () { apply(true); },
          '覆盖', '另存为新模板');
      } else apply(false);
    };
    reader.readAsText(file, 'utf-8');
  }

  /* ================= 通用 UI ================= */
  function toast(msg, err) {
    var old = $('.toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; }, 1800);
    setTimeout(function () { t.remove(); }, 2100);
  }
  function confirmModal(title, msg, onYes, onNo, yesText, noText) {
    var mask = document.createElement('div'); mask.className = 'modal-mask';
    var m = document.createElement('div'); m.className = 'modal';
    var h = document.createElement('h3'); h.textContent = title; m.appendChild(h);
    var p = document.createElement('p'); p.textContent = msg; m.appendChild(p);
    var row = document.createElement('div'); row.className = 'row';
    var no = document.createElement('button'); no.className = 'btn'; no.textContent = noText || '取消';
    no.onclick = function () { mask.remove(); if (onNo) onNo(); };
    var yes = document.createElement('button'); yes.className = 'btn btn-primary'; yes.textContent = yesText || '确定';
    yes.onclick = function () { mask.remove(); onYes(); };
    row.appendChild(no); row.appendChild(yes); m.appendChild(row);
    mask.appendChild(m); document.body.appendChild(mask);
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function updateToolUI(tool) {
    $$('#toolbar .tool').forEach(function (t) { t.classList.toggle('active', t.dataset.tool === tool); });
  }

  /* ================= 初始化 ================= */
  function bindUI() {
    $$('.tab').forEach(function (t) {
      t.onclick = function () {
        $$('.tab').forEach(function (x) { x.classList.remove('active'); });
        $$('.tab-pane').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        $('#pane-' + t.dataset.tab).classList.add('active');
      };
    });

    $$('#toolbar .tool').forEach(function (t) {
      t.onclick = function () {
        var tool = t.dataset.tool;
        if (tool === 'undo') return App.undo();
        if (tool === 'redo') return App.redo();
        App.pendingMember = null; renderSquads();
        App.board.setTool(tool);
        updateToolUI(tool);
      };
    });

    $('#tplName').oninput = function () {
      if (!App.tpl) return;
      App.tpl.name = $('#tplName').value || '未命名战术';
      scheduleSave();
    };
    $('#notes').oninput = function () {
      if (!App.tpl) return;
      App.tpl.notes = $('#notes').value;
      scheduleSave();
    };

    $('#btnNewTpl').onclick = function () {
      confirmModal('新建模板', '新建一份空白战术模板？当前未保存的改动会先保留到上一份模板。', newTemplate);
    };
    $('#btnDelTpl').onclick = function () {
      if (!App.tpl) return toast('没有当前模板', true);
      confirmModal('删除当前模板', '确定删除「' + App.tpl.name + '」？', function () {
        Store.deleteTemplate(App.tpl.id).then(function () {
          toast('已删除'); App.tpl = null; newTemplate();
        });
      });
    };
    $('#btnAddSquad').onclick = function () {
      if (!App.tpl) return toast('先新建模板', true);
      var n = (App.tpl.squads || []).length + 1;
      App.tpl.squads.push({ id: Store.newId('sq'), name: '开摆咯 · ' + ['一', '二', '三', '四', '五'][n - 1] + '队', members: [] });
      App.markChanged(); renderSquads();
    };

    $('#btnUploadMap').onclick = function () { $('#mapFile').click(); };
    $('#mapFile').onchange = function (e) { uploadMap(e.target.files[0]); e.target.value = ''; };

    $('#btnImport').onclick = function () { $('#importFile').click(); };
    $('#importFile').onchange = function (e) { handleImport(e.target.files[0]); e.target.value = ''; };

    $('#btnExport').onclick = function (e) {
      e.stopPropagation();
      $('#exportMenu').classList.toggle('open');
    };
    $$('#exportMenu div').forEach(function (d) {
      d.onclick = function () { $('#exportMenu').classList.remove('open'); App.doExport(d.dataset.act); };
    });
    document.addEventListener('click', function () { $('#exportMenu').classList.remove('open'); });

    $('#coordSwitch').onclick = function (e) {
      var s = e.target.closest('span'); if (!s) return;
      $$('#coordSwitch span').forEach(function (x) { x.classList.remove('on'); });
      s.classList.add('on');
      App.coordMode = s.dataset.c;
      App.board.setCoordMode(App.coordMode);
      $('#coordVal').textContent = 'X —   Y —';
      var p = Store.getPref(); p.coordMode = App.coordMode; Store.setPref(p);
    };

    window.addEventListener('resize', function () { App.board._updateViewport(); });
  }

  function init() {
    App.board = new Board({
      canvas: $('#canvas'), wrap: $('#mapWrap'), realMap: $('#realMap'),
      emptyMap: $('#emptyMap'), svg: $('#vectorLayer'), markerLayer: $('#markerLayer'),
      viewport: $('#viewport'), miniInner: $('#miniInner'),
      callbacks: {
        onChange: function () { App.markChanged(); },
        onSelect: renderInspector,
        onCoord: function (txt) { $('#coordVal').textContent = txt; },
        onZoom: function (z) { $('#zoomVal').textContent = z + '%'; },
        onCount: function (n) { $('#objCount').textContent = n; },
        onHint: function (h) { $('#hintText').textContent = h; },
        onUndo: App.undo, onRedo: App.redo,
        onToolKey: function (tool) { App.board.setTool(tool); updateToolUI(tool); },
        getMembers: App.getMembers
      }
    });

    var pref = Store.getPref();
    App.coordMode = pref.coordMode || 'px';
    App.board.setCoordMode(App.coordMode);
    $$('#coordSwitch span').forEach(function (x) { x.classList.toggle('on', x.dataset.c === App.coordMode); });

    bindUI();
    loadMaps().then(function () {
      var active = Store.getActiveId();
      var idx = Store.getIndex();
      var target = active && idx.some(function (x) { return x.id === active; }) ? active : (idx[0] && idx[0].id);
      if (target) openTemplate(target);
      else newTemplate();
    }).catch(function () { newTemplate(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.App = App;
})(window);
