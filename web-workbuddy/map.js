/* 百业战底图渲染
   默认：游戏内实机原图（彩色版，map_real.jpg）
   自定义：由 state.map.dataUrl 覆盖（用户上传，随本地存储/JSON 走）
   标点层用归一化百分比坐标，与图片严格线性对齐，换图不影响已布置的点 */
const DEFAULT_MAP_SRC = 'map_real.jpg?v=2';   // 换默认底图时改版本号，强制浏览器重新加载

let _mapSrcCache = null;   // 上次渲染用的底图源（同一引用时 === 比较是 O(1)）
function renderMapImage(){
  const el=document.getElementById('mapCanvas');
  if(!el) return;
  let src=DEFAULT_MAP_SRC;
  try{
    if(typeof state!=='undefined' && state && state.map && state.map.dataUrl) src=state.map.dataUrl;
  }catch(e){}
  // 底图没变就不要重建 <img>：重建会触发重新解码+重新光栅化，
  // 表现为每次改动（如隐藏队伍）后整张地图短暂“变锐/变虚”，且很费性能
  const cur=el.querySelector('img.map-img');
  if(cur && _mapSrcCache===src) return;
  _mapSrcCache=src;
  el.innerHTML=`<img class="map-img" src="${src}" alt="百业战地图" draggable="false">`;
}
