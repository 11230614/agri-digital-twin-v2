<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { FarmRuntime } from '../app/composition/FarmRuntime';
import { CALIBRATION_SHOTS } from '../config/calibration-shots';
import { useDiagnosticsStore } from './diagnostics-store';
const host=ref<HTMLElement>();
const store=useDiagnosticsStore();
const state=computed(()=>store.snapshot);
const route=useRoute();
const clean=computed(()=>route.query.clean==='1');
const sidebar=ref(true);
let runtime:FarmRuntime|undefined;
let unsubscribe:(()=>void)|undefined;
const facade=()=>runtime?.getFacade();
const mapLabels={loading:'正在加载离线影像',ready:'离线影像已就绪',failed:'影像加载失败',degraded:'影像降级'};
onMounted(()=>{
  runtime=new FarmRuntime(host.value!);
  unsubscribe=runtime.getFacade().subscribe(store.project);
  void runtime.start().catch(()=>{/* Runtime publishes the diagnostic error. */});
});
onBeforeUnmount(()=>{unsubscribe?.();void runtime?.dispose();});
</script>

<template>
  <main class="workspace" :class="{'is-clean':clean,'sidebar-closed':!sidebar}">
    <header v-if="!clean" class="topbar">
      <div class="brand"><span class="brand-symbol">禾</span><div><strong>禾境 · 农业数字孪生</strong><small>独立重建 / SPATIAL FOUNDATION</small></div></div>
      <div class="phase"><RouterLink class="park-entry" data-testid="open-park" to="/samples/park">进入当前整园场景 ↗</RouterLink><span class="status-dot"></span>阶段 01—02 <span class="phase-muted">空间与地图校准</span></div>
    </header>
    <section class="scene-shell" aria-label="Cesium 地图与 Three.js 校准场景">
      <div ref="host" class="scene-host" data-testid="scene-host" :data-diagnostics="JSON.stringify(state)"></div>
      <template v-if="!clean">
        <div class="scene-caption"><span class="eyebrow">SUINING / LOCAL COORDINATES</span><h1>先让每一米，对齐世界。</h1><p>周边卫星影像 × 本地米制三维空间</p></div>
        <button class="panel-toggle" @click="sidebar=!sidebar" :aria-expanded="sidebar" aria-controls="diagnostics">{{sidebar?'收起校准面板':'展开校准面板'}} <span>{{sidebar?'↗':'↙'}}</span></button>
        <div class="scene-legend"><span><i class="east"></i>东 +X</span><span><i class="north"></i>北 −Z</span><span><i class="up"></i>上 +Y</span><span>白色立方体 10 × 10 × 10 m</span></div>
        <div class="scene-note">当前为校准几何，非正式农业模型<br>园区位置为示意放置，不对应卫星图中的实测农场</div>
      </template>
    </section>
    <aside v-if="!clean && sidebar" id="diagnostics" class="inspector">
      <div class="inspector-heading"><span class="eyebrow">VALIDATION / 02</span><h2>双引擎校准</h2><p>地图在底层，模型在上层。<br>先验证空间，再交付视觉。</p></div>
      <section class="inspector-section"><h3>01 <span>底图状态</span></h3>
        <div class="map-status" :data-status="state?.map.status" data-testid="map-status"><span class="status-dot"></span>{{state?mapLabels[state.map.status]:'初始化中'}}</div>
        <dl><div><dt>影像来源</dt><dd>Sentinel-2 L2A</dd></div><div><dt>采集日期</dt><dd>2026.11.06</dd></div><div><dt>地面像元</dt><dd>≈ 8.3 m</dd></div><div><dt>地形</dt><dd>椭球 · 无起伏</dd></div></dl>
        <p v-if="state?.map.lastError" class="error-message">{{state.map.lastError.message}}</p>
        <button v-if="state?.map.status==='failed'" class="secondary" @click="facade()?.retryMap()">重试加载影像</button>
      </section>
      <section class="inspector-section"><h3>02 <span>校准镜头</span></h3>
        <div class="shot-grid"><button v-for="(shot,i) in CALIBRATION_SHOTS" :key="shot.id" :class="{active:state?.shotId===shot.id}" @click="facade()?.setCameraShot(shot.id)" :data-shot="shot.id"><small>0{{i+1}}</small>{{shot.label}}<span>↗</span></button></div>
      </section>
      <section class="inspector-section"><h3>03 <span>图层检查</span></h3>
        <label class="switch-row">Three.js 覆盖层<input type="checkbox" :checked="state?.overlayVisible" @change="facade()?.setOverlayVisible(($event.target as HTMLInputElement).checked)" data-testid="overlay-toggle"></label>
        <label class="switch-row">局部道路接收面<input type="checkbox" :checked="state?.surfacesVisible" @change="facade()?.setSurfacesVisible(($event.target as HTMLInputElement).checked)" data-testid="surfaces-toggle"></label>
        <p class="small-note">隐藏覆盖层后底图应保留，恢复后不应出现残影。鼠标拖拽旋转，滚轮缩放。</p>
      </section>
      <section class="inspector-section metrics"><h3>04 <span>运行诊断</span></h3>
        <dl><div><dt>Runtime</dt><dd data-testid="runtime-status">{{state?.runtime??'idle'}}</dd></div><div><dt>控制点最大偏差</dt><dd data-testid="alignment">{{state?.alignmentErrorPx==null?'—':state.alignmentErrorPx.toFixed(6)+' px'}}</dd></div><div><dt>画布 / DPR</dt><dd data-testid="viewport">{{state?.viewport.width}} × {{state?.viewport.height}} / {{state?.viewport.dpr}}</dd></div><div><dt>Three draw calls</dt><dd>{{state?.threeDrawCalls??0}}</dd></div></dl>
        <p v-if="state?.error" class="error-message" role="alert">{{state.error}}</p>
        <button class="secondary" @click="state?.runtime==='paused'?facade()?.resume():facade()?.pause()">{{state?.runtime==='paused'?'恢复交互':'暂停交互'}}</button>
      </section>
      <footer class="inspector-footer">WGS84 · X 东 / Y 上 / Z 南<br>此页用于工程校准，非五视角最终 UI</footer>
    </aside>
  </main>
</template>

<style scoped>
.park-entry{color:#dcc591;text-decoration:none;margin-right:18px;font-size:12px}@media(max-width:600px){.park-entry{display:block;margin:0 0 5px;font-size:10px}}
</style>
