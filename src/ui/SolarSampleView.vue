<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { FarmRuntime } from '../app/composition/FarmRuntime';
import { createSolarSampleScene, SOLAR_SAMPLE_SHOTS } from '../rendering/SolarSampleScene';
import type { SceneSnapshot } from '../app/ports/scene';
const host=ref<HTMLElement>();const state=shallowRef<SceneSnapshot>();
const route=useRoute();const clean=computed(()=>route.query.clean==='1');
let runtime:FarmRuntime|undefined,off:(()=>void)|undefined;
onMounted(()=>{runtime=new FarmRuntime(host.value!,createSolarSampleScene,SOLAR_SAMPLE_SHOTS);off=runtime.getFacade().subscribe(snapshot=>{state.value=snapshot;});void runtime.start().catch(()=>{});});
onBeforeUnmount(()=>{off?.();void runtime?.dispose();});
</script>
<template>
  <main class="workspace" :class="{'is-clean':clean}">
    <header v-if="!clean" class="topbar"><div class="brand"><span class="brand-symbol">禾</span><div><strong>固定式太阳能板 · 候选 01</strong><small>ASSET STUDY / 蓝灰板面 · 银灰支架</small></div></div><RouterLink to="/samples/leaf" class="sample-back">叶菜样板 ↗</RouterLink></header>
    <section class="scene-shell"><div ref="host" class="scene-host" data-testid="scene-host" :data-diagnostics="JSON.stringify(state)"></div>
      <div v-if="!clean" class="scene-caption"><span class="eyebrow">FIXED SOLAR TABLE / CANDIDATE 01</span><h1>迎向日光，稳稳落地。</h1><p>固定 25° · 16 分区 · 金属边框与支脚</p></div>
      <div v-if="!clean" class="scene-note">单桌隔离样板，供外观与结构审阅<br>电池分区为美术结构，不据此推算装机容量</div>
    </section>
    <aside v-if="!clean" class="inspector sample-inspector">
      <div class="inspector-heading"><span class="eyebrow">AUTHORING / SOLAR 01</span><h2>先看板面，再看背面。</h2><p>蓝灰细栅与低对比反射，<br>高低支脚贴合倾斜板背。</p></div>
      <section class="inspector-section"><h3>01 <span>样板规格</span></h3><dl><div><dt>板面宽 × 斜面深</dt><dd>8 × 3.2 m</dd></div><div><dt>总厚度</dt><dd>0.05 m</dd></div><div><dt>固定倾角</dt><dd>25° · 朝南</dd></div><div><dt>面板中心高</dt><dd>1.326 m</dd></div><div><dt>电池分区</dt><dd>8 列 × 2 行</dd></div><div><dt>支脚</dt><dd>4 支 · 接地基座</dd></div></dl></section>
      <section class="inspector-section"><h3>02 <span>审阅角度</span></h3><div class="shot-grid"><button v-for="(shot,i) in SOLAR_SAMPLE_SHOTS" :key="shot.id" :class="{active:state?.shotId===shot.id}" :data-shot="shot.id" @click="runtime?.getFacade().setCameraShot(shot.id)"><small>0{{i+1}}</small>{{shot.label}}<span>↗</span></button></div></section>
      <section class="inspector-section"><h3>03 <span>当前范围</span></h3><p class="small-note">包含背板、固定横梁、斜撑、地脚、接线盒与贴背线缆。没有追日或摆动动作。<br><br>当前仅一桌；确认样板后再按正式坐标放置四桌。状态高亮、运行 LOD 和整园性能尚未验收。</p></section>
      <section class="inspector-section metrics"><h3>04 <span>运行状态</span></h3><dl><div><dt>Runtime</dt><dd>{{state?.runtime??'idle'}}</dd></div><div><dt>离线地图</dt><dd>{{state?.map.status??'loading'}}</dd></div><div><dt>Three 三角形</dt><dd>{{state?.threeTriangles??0}}</dd></div></dl><p v-if="state?.error" class="error-message">{{state.error}}</p></section>
      <footer class="inspector-footer">本版板面、边框与支架待你审阅。<br>单资产检查不替代完整阶段验收。</footer>
    </aside>
  </main>
</template>
<style scoped>
.sample-back{color:#dcc591;text-decoration:none;font-size:12px}.shot-grid{grid-template-columns:1fr}.sample-inspector .shot-grid button{font-size:11px}
@media(max-width:600px){.sample-back{font-size:10px}.brand strong{font-size:12px}}
</style>
