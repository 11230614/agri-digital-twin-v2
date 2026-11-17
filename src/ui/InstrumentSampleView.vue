<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { FarmRuntime } from '../app/composition/FarmRuntime';
import { createInstrumentSampleScene, INSTRUMENT_SAMPLE_SHOTS } from '../rendering/InstrumentSampleScene';
import type { SceneSnapshot } from '../app/ports/scene';
const host=ref<HTMLElement>();const state=shallowRef<SceneSnapshot>();const route=useRoute();const clean=computed(()=>route.query.clean==='1');
let runtime:FarmRuntime|undefined,off:(()=>void)|undefined;

onMounted(()=>{runtime=new FarmRuntime(host.value!,createInstrumentSampleScene,INSTRUMENT_SAMPLE_SHOTS);off=runtime.getFacade().subscribe(snapshot=>{state.value=snapshot;});void runtime.start().catch(()=>{});});
onBeforeUnmount(()=>{off?.();void runtime?.dispose();});
</script>
<template>
  <main class="workspace" :class="{'is-clean':clean}">
    <header v-if="!clean" class="topbar"><div class="brand"><span class="brand-symbol">禾</span><div><strong>气象站与土壤传感器 · 候选 01</strong><small>ASSET STUDY / 风杯 · 百叶箱 · 设备头</small></div></div><nav><RouterLink to="/samples/solar">太阳能板</RouterLink><RouterLink to="/samples/leaf">叶菜</RouterLink><RouterLink to="/calibration">空间校准 ↗</RouterLink></nav></header>
    <section class="scene-shell"><div ref="host" class="scene-host" data-testid="scene-host" :data-diagnostics="JSON.stringify(state)"></div>
      <div v-if="!clean" class="scene-caption"><span class="eyebrow">FIELD INSTRUMENTS / CANDIDATE 01</span><h1>风与土壤，细节可见。</h1><p>3.5 m 气象站 · 0.6 m 土壤传感器</p></div>
      <div v-if="!clean" class="scene-note">静态设备样板 · 非特定品牌实物复刻<br>保持真实尺寸比例 · 无设备实时数据</div>
    </section>
    <aside v-if="!clean" class="inspector sample-inspector">
      <div class="inspector-heading"><span class="eyebrow">AUTHORING / INSTRUMENTS 01</span><h2>细杆承托，构件分明。</h2><p>风杯、风向标独立枢轴，<br>传感器保留设备头与短线。</p></div>
      <section class="inspector-section"><h3>01 <span>审阅角度</span></h3><div class="shot-grid"><button v-for="(shot,i) in INSTRUMENT_SAMPLE_SHOTS" :key="shot.id" :class="{active:state?.shotId===shot.id}" :data-shot="shot.id" @click="runtime?.getFacade().setCameraShot(shot.id)"><small>0{{i+1}}</small>{{shot.label}}<span>↗</span></button></div></section>
      <section class="inspector-section"><h3>02 <span>样板规格</span></h3><dl><div><dt>气象站高度</dt><dd>3.5 m 包络</dd></div><div><dt>气象站宽深</dt><dd>≤ 0.6 m</dd></div><div><dt>传感器高度</dt><dd>0.6 m</dd></div><div><dt>传感器宽深</dt><dd>≤ 0.16 m</dd></div><div><dt>机械动作</dt><dd>静态审阅姿态</dd></div></dl></section>
      <section class="inspector-section"><h3>03 <span>本次审阅范围</span></h3><p class="small-note">气象站基座、主杆、分层百叶箱、控制盒、三风杯与独立风向标；土壤传感器细杆、设备头、短线。正常模式不露出入土探头。<br><br>指示点为静态外观色，不表示在线状态。尚未接入风速风向动画、数据质量、运行LOD和正式田块布局。</p></section>
      <section class="inspector-section metrics"><h3>04 <span>运行状态</span></h3><dl><div><dt>Runtime</dt><dd>{{state?.runtime??'idle'}}</dd></div><div><dt>离线地图</dt><dd>{{state?.map.status??'loading'}}</dd></div><div><dt>Three 三角形</dt><dd>{{state?.threeTriangles??0}}</dd></div><div><dt>Three draw calls</dt><dd>{{state?.threeDrawCalls??0}}</dd></div></dl><p v-if="state?.error" class="error-message">{{state.error}}</p></section>
      <footer class="inspector-footer">本版设备静态外观已获你确认。<br>不以样板通过替代整园验收。</footer>
    </aside>
  </main>
</template>
<style scoped>
nav{display:flex;gap:18px}nav a{color:#dcc591;text-decoration:none;font-size:12px}.shot-grid{grid-template-columns:1fr}.sample-inspector .shot-grid button{font-size:11px}.pose-buttons{display:flex;gap:8px}.pose-buttons button{flex:1;background:transparent;border:1px solid var(--border);padding:9px 5px;font-size:11px}.pose-buttons button.active{border-color:#a39164;color:#ead5a8;background:#d8c28e17}
@media(max-width:600px){nav{gap:8px}nav a{font-size:9px}.brand strong{font-size:12px}.brand small{letter-spacing:0}.scene-caption h1{font-size:17px}}
</style>
