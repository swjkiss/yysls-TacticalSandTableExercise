/* store.js — 本地存储层：localStorage 存索引/偏好，IndexedDB 存模板全文与底图 */
(function (global) {
  'use strict';

  var LS = {
    INDEX: 'yysls_tpl_index',
    ACTIVE: 'yysls_active_tpl',
    PREF: 'yysls_pref'
  };
  var DB_NAME = 'yysls_tactics_db';
  var DB_VER = 1;
  var S_TPL = 'templates';
  var S_MAP = 'maps';

  function lsGet(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }

  var _db = null;
  function openDB() {
    return new Promise(function (resolve, reject) {
      if (_db) return resolve(_db);
      if (!global.indexedDB) return reject(new Error('IndexedDB unavailable'));
      var req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(S_TPL)) db.createObjectStore(S_TPL, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(S_MAP)) db.createObjectStore(S_MAP, { keyPath: 'id' });
      };
      req.onsuccess = function () { _db = req.result; resolve(_db); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbPut(store, value) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(value);
        tx.oncomplete = function () { resolve(value); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }
  function idbGet(store, key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store, 'readonly');
        var r = tx.objectStore(store).get(key);
        r.onsuccess = function () { resolve(r.result); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }
  function idbGetAll(store) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store, 'readonly');
        var r = tx.objectStore(store).getAll();
        r.onsuccess = function () { resolve(r.result || []); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }
  function idbDel(store, key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).delete(key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function newId(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function blankTemplate(name, mapId) {
    return {
      schemaVersion: '1.1',
      id: newId('tpl'),
      name: name || '未命名战术',
      mapId: mapId || '',
      meta: { author: '滚滚红尘', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 },
      viewState: { zoom: 1, center: [0.5, 0.5] },
      zones: [], marks: [], units: [], squads: [],
      notes: ''
    };
  }

  var Store = {
    newId: newId,
    blankTemplate: blankTemplate,

    /* ---------- 模板索引（localStorage） ---------- */
    getIndex: function () { return lsGet(LS.INDEX, []); },
    setIndex: function (arr) { return lsSet(LS.INDEX, arr); },
    upsertIndex: function (tpl) {
      var idx = this.getIndex();
      var i = idx.findIndex(function (x) { return x.id === tpl.id; });
      var entry = {
        id: tpl.id, name: tpl.name, mapId: tpl.mapId,
        mapName: tpl.mapName || '', updatedAt: tpl.meta ? tpl.meta.updatedAt : new Date().toISOString(),
        zones: (tpl.zones || []).length, marks: (tpl.marks || []).length, units: (tpl.units || []).length
      };
      if (i >= 0) idx[i] = entry; else idx.unshift(entry);
      this.setIndex(idx);
      return entry;
    },
    removeIndex: function (id) {
      this.setIndex(this.getIndex().filter(function (x) { return x.id !== id; }));
    },
    getActiveId: function () { return lsGet(LS.ACTIVE, null); },
    setActiveId: function (id) { lsSet(LS.ACTIVE, id); },

    /* ---------- 偏好 ---------- */
    getPref: function () { return lsGet(LS.PREF, { coordMode: 'px' }); },
    setPref: function (p) { lsSet(LS.PREF, p); },

    /* ---------- 模板全文（IndexedDB） ---------- */
    saveTemplate: function (tpl) {
      var self = this;
      tpl.meta = tpl.meta || {};
      tpl.meta.updatedAt = new Date().toISOString();
      return idbPut(S_TPL, tpl).then(function (r) { self.upsertIndex(tpl); return r; });
    },
    loadTemplate: function (id) { return idbGet(S_TPL, id); },
    loadAllTemplates: function () { return idbGetAll(S_TPL); },
    deleteTemplate: function (id) {
      var self = this;
      return idbDel(S_TPL, id).then(function () { self.removeIndex(id); });
    },

    /* ---------- 底图（IndexedDB，dataURL） ---------- */
    saveMap: function (map) { return idbPut(S_MAP, map); },
    loadMap: function (id) { return idbGet(S_MAP, id); },
    loadAllMaps: function () { return idbGetAll(S_MAP); },
    deleteMap: function (id) { return idbDel(S_MAP, id); },

    /* ---------- 导入导出辅助 ---------- */
    exportPack: function (tpl, map) {
      return { kind: 'yysls-tactics-pack', exportedAt: new Date().toISOString(), template: tpl, map: map || null };
    },
    validateImport: function (obj) {
      if (!obj || typeof obj !== 'object') return { ok: false, msg: '不是有效 JSON 对象' };
      var tpl = obj.template || obj;
      if (!tpl || !tpl.id || !tpl.name) return { ok: false, msg: '缺少模板 id 或 name' };
      ['zones', 'marks', 'units', 'squads'].forEach(function (k) {
        if (!Array.isArray(tpl[k])) tpl[k] = [];
      });
      tpl.meta = tpl.meta || {};
      tpl.viewState = tpl.viewState || { zoom: 1, center: [0.5, 0.5] };
      tpl.schemaVersion = '1.1';
      return { ok: true, tpl: tpl, map: obj.map || null };
    }
  };

  global.Store = Store;
})(window);
