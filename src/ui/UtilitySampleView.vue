<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { FarmRuntime } from '../app/composition/FarmRuntime';
import { createUtilitySampleScene, UTILITY_SAMPLE_SHOTS } from '../rendering/UtilitySampleScene';
import type { SceneSnapshot } from '../app/ports/scene';
const host=ref<HTMLElement>();const state=shallowRef<SceneSnapshot>();const route=useRoute();const clean=computed(()=>route.query.clean==='1');
let runtime:FarmRuntime|undefined,off:(()=>void)|undefined;

onMounted(()=>{runtime=new FarmRuntime(host.value!,createUtilitySampleScene,UTILITY_SAMPLE_SHOTS);off=runtime.getFacade().subscribe(snapshot=>{state.value=snapshot;});void runtime.start().catch(()=>{});});
onBeforeUnmount(()=>{off?.();void runtime?.dispose();});
</script>
<template>
  <main class="workspace" :class="{'is-clean':clean}">
    <header v-if="!clean" class="topbar"><div class="brand"><span class="brand-symbol">禾</span><div><strong>控制柜与滴灌管网 · 候选 01</strong><small>ASSET STUDY / 柜体 · 主支管 · 阀门</small></div></div><nav><RouterLink to="/samples/solar">太阳能板</RouterLink><RouterLink to="/samples/leaf">叶菜</RouterLink><RouterLink to="/calibration">空间校准 ↗</RouterLink></nav></header>
    <section class="scene-shell"><div ref="host" class="scene-host" data-testid="scene-host" :data-diagnostics="JSON.stringify(state)"></div>
      <div v-if="!clean" class="scene-caption"><span class="eyebrow">CABINET & IRRIGATION / CANDIDATE 01</span><h1>从柜体到管网。</h1><p>1.2 m 控制柜 · 10 条滴灌支管</p></div>
      <div v-if="!clean" class="scene-note">静态设备样板 · 非特定品牌实物复刻<br>保持真实尺寸比例 · 无设备实时数据</div>
    </section>
    <aside v-if="!clean" class="inspector sample-inspector">
      <div class="inspector-heading"><span class="eyebrow">AUTHORING / UTILITIES 01</span><h2>连接有序，尺度如实。</h2><p>柜门静止关闭，<br>滴灌不生成喷泉或旋转喷头。</p></div>
      <section class="inspector-section"><h3>01 <span>审阅角度</span></h3><div class="shot-grid"><button v-for="(shot,i) in UTILITY_SAMPLE_SHOTS" :key="shot.id" :class="{active:state?.shotId===shot.id}" :data-shot="shot.id" @click="runtime?.getFacade().setCameraShot(shot.id)"><small>0{{i+1}}</small>{{shot.label}}<span>↗</span></button></div></section>
      <section class="inspector-section"><h3>02 <span>样板规格</span></h3><dl><div><dt>控制柜 宽×深×高</dt><dd>0.8×0.4×1.2 m</dd></div><div><dt>主水管</dt><dd>Ø 0.06 m / 25.2 m</dd></div><div><dt>支管</dt><dd>10×29 m / Ø 0.025 m</dd></div><div><dt>阀体 / 手柄宽</dt><dd>0.12 m / 0.08 m</dd></div><div><dt>设备状态</dt><dd>无遥测 · 静态样板</dd></div></dl></section>
      <section class="inspector-section"><h3>03 <span>本次审阅范围</span></h3><p class="small-note">柜体基座、门缝、把手、暗色显示区及三枚静态指示点；一田完整管线、十处接头与端帽、入口阀柄。<br><br>未添加独立泵站或水箱，不生成喷泉。静态阀柄不代表设备实际开度；数据驱动、流向、运行LOD及整园性能尚未验收。</p></section>
      <section class="inspector-section metrics"><h3>04 <span>运行状态</span></h3><dl><div><dt>Runtime</dt><dd>{{state?.runtime??'idle'}}</dd></div><div><dt>离线地图</dt><dd>{{state?.map.status??'loading'}}</dd></div><div><dt>Three 三角形</dt><dd>{{state?.threeTriangles??0}}</dd></div><div><dt>Three draw calls</dt><dd>{{state?.threeDrawCalls??0}}</dd></div></dl><p v-if="state?.error" class="error-message">{{state.error}}</p></section>
      <footer class="inspector-footer">本版设施静态外观已获你确认。<br>不以样板通过替代整园验收。</footer>
    </aside>
  </main>
</template>
<style scoped>
nav{display:flex;gap:18px}nav a{color:#dcc591;text-decoration:none;font-size:12px}.shot-grid{grid-template-columns:1fr}.sample-inspector .shot-grid button{font-size:11px}.pose-buttons{display:flex;gap:8px}.pose-buttons button{flex:1;background:transparent;border:1px solid var(--border);padding:9px 5px;font-size:11px}.pose-buttons button.active{border-color:#a39164;color:#ead5a8;background:#d8c28e17}
@media(max-width:600px){nav{gap:8px}nav a{font-size:9px}.brand strong{font-size:12px}.brand small{letter-spacing:0}.scene-caption h1{font-size:17px}}
</style>
