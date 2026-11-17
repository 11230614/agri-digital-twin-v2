<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { FarmRuntime } from '../app/composition/FarmRuntime';
import { createFieldSampleScene, FIELD_SAMPLE_SHOTS } from '../rendering/FieldSampleScene';
import type { SceneSnapshot } from '../app/ports/scene';
const host=ref<HTMLElement>();const state=shallowRef<SceneSnapshot>();const route=useRoute();const clean=computed(()=>route.query.clean==='1');
let runtime:FarmRuntime|undefined,off:(()=>void)|undefined;

onMounted(()=>{runtime=new FarmRuntime(host.value!,createFieldSampleScene,FIELD_SAMPLE_SHOTS);off=runtime.getFacade().subscribe(snapshot=>{state.value=snapshot;});void runtime.start().catch(()=>{});});
onBeforeUnmount(()=>{off?.();void runtime?.dispose();});
</script>
<template>
  <main class="workspace" :class="{'is-clean':clean}">
    <header v-if="!clean" class="topbar"><div class="brand"><span class="brand-symbol">禾</span><div><strong>完整田块 · 候选 02</strong><small>ASSET STUDY / 土垄 · 叶菜 · 灌溉 · 监测</small></div></div><nav><RouterLink to="/samples/solar">太阳能板</RouterLink><RouterLink to="/samples/leaf">叶菜</RouterLink><RouterLink to="/calibration">空间校准 ↗</RouterLink></nav></header>
    <section class="scene-shell"><div ref="host" class="scene-host" data-testid="scene-host" :data-diagnostics="JSON.stringify(state)"></div>
      <div v-if="!clean" class="scene-caption"><span class="eyebrow">FIELD STUDY / CANDIDATE 02</span><h1>十行作物，落在土垄上。</h1><p>28 × 32 m · 10 垄 · 2680 株</p></div>
      <div v-if="!clean" class="scene-note">静态设备样板 · 非特定品牌实物复刻<br>保持真实尺寸比例 · 无设备实时数据</div>
    </section>
    <aside v-if="!clean" class="inspector sample-inspector">
      <div class="inspector-heading"><span class="eyebrow">AUTHORING / FIELD 02</span><h2>田垄与作物，真实尺度。</h2><p>复用已确认叶菜与监测设备，<br>支管贴垄面，端部接回主水管。</p></div>
      <section class="inspector-section"><h3>01 <span>审阅角度</span></h3><div class="shot-grid"><button v-for="(shot,i) in FIELD_SAMPLE_SHOTS" :key="shot.id" :class="{active:state?.shotId===shot.id}" :data-shot="shot.id" @click="runtime?.getFacade().setCameraShot(shot.id)"><small>0{{i+1}}</small>{{shot.label}}<span>↗</span></button></div></section>
      <section class="inspector-section"><h3>02 <span>样板规格</span></h3><dl><div><dt>田块占地</dt><dd>28 × 32 m</dd></div><div><dt>土垄</dt><dd>10 × 1.8 × 28 m</dd></div><div><dt>土垄顶高</dt><dd>0.12 m</dd></div><div><dt>田间叶菜</dt><dd>2680 株 / 高0.28 m</dd></div><div><dt>间距</dt><dd>沿行0.4 m / 四列0.38 m</dd></div><div><dt>监测设备</dt><dd>1站 / 3探头 / 1柜</dd></div></dl></section>
      <section class="inspector-section"><h3>03 <span>本次审阅范围</span></h3><p class="small-note">候选02加密组合：缓坡土垄、田间规格叶菜、主支管与阀门、四角桩及东侧监测边带。使用plot-02规范坐标，不复制三个正式田块。<br><br>支管中心0.135 m为你已确认的集成修正。你已确认采用每垄4列、每列67株配方；当前检查加密后的静态密度与空间关系；风动、流向、数据状态及整园性能另行验收。</p></section>
      <section class="inspector-section metrics"><h3>04 <span>运行状态</span></h3><dl><div><dt>Runtime</dt><dd>{{state?.runtime??'idle'}}</dd></div><div><dt>离线地图</dt><dd>{{state?.map.status??'loading'}}</dd></div><div><dt>Three 三角形</dt><dd>{{state?.threeTriangles??0}}</dd></div><div><dt>Three draw calls</dt><dd>{{state?.threeDrawCalls??0}}</dd></div></dl><p v-if="state?.error" class="error-message">{{state.error}}</p></section>
      <footer class="inspector-footer">本版田块密度与静态外观已获你确认。<br>不以样板通过替代整园验收。</footer>
    </aside>
  </main>
</template>
<style scoped>
nav{display:flex;gap:18px}nav a{color:#dcc591;text-decoration:none;font-size:12px}.shot-grid{grid-template-columns:1fr}.sample-inspector .shot-grid button{font-size:11px}.pose-buttons{display:flex;gap:8px}.pose-buttons button{flex:1;background:transparent;border:1px solid var(--border);padding:9px 5px;font-size:11px}.pose-buttons button.active{border-color:#a39164;color:#ead5a8;background:#d8c28e17}
@media(max-width:600px){nav{gap:8px}nav a{font-size:9px}.brand strong{font-size:12px}.brand small{letter-spacing:0}.scene-caption h1{font-size:17px}}
</style>
