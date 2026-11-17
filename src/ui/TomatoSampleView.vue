<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { FarmRuntime } from '../app/composition/FarmRuntime';
import { createTomatoSampleScene, TOMATO_SAMPLE_SHOTS } from '../rendering/TomatoSampleScene';
import type { SceneSnapshot } from '../app/ports/scene';
const host=ref<HTMLElement>();const state=shallowRef<SceneSnapshot>();const route=useRoute();const clean=computed(()=>route.query.clean==='1');
let runtime:FarmRuntime|undefined,off:(()=>void)|undefined;

onMounted(()=>{runtime=new FarmRuntime(host.value!,createTomatoSampleScene,TOMATO_SAMPLE_SHOTS);off=runtime.getFacade().subscribe(snapshot=>{state.value=snapshot;});void runtime.start().catch(()=>{});});
onBeforeUnmount(()=>{off?.();void runtime?.dispose();});
</script>
<template>
  <main class="workspace" :class="{'is-clean':clean}">
    <header v-if="!clean" class="topbar"><div class="brand"><span class="brand-symbol">禾</span><div><strong>攀援番茄 · 候选 01</strong><small>ASSET STUDY / 复叶 · 果簇 · 支撑绳</small></div></div><nav><RouterLink to="/samples/solar">太阳能板</RouterLink><RouterLink to="/samples/leaf">叶菜</RouterLink><RouterLink to="/calibration">空间校准 ↗</RouterLink></nav></header>
    <section class="scene-shell"><div ref="host" class="scene-host" data-testid="scene-host" :data-diagnostics="JSON.stringify(state)"></div>
      <div v-if="!clean" class="scene-caption"><span class="eyebrow">CLIMBING TOMATO / CANDIDATE 01</span><h1>枝叶向上，青果成簇。</h1><p>2.4 m 株高 · 6 组支枝 · 3 簇果实</p></div>
      <div v-if="!clean" class="scene-note">静态单株样板 · 青果为主，少量黄橙转色<br>支撑绳顶部为后续棚架连接点，非独立支架</div>
    </section>
    <aside v-if="!clean" class="inspector sample-inspector">
      <div class="inspector-heading"><span class="eyebrow">AUTHORING / TOMATO 01</span><h2>看清一株的生长结构。</h2><p>主茎与复叶枝组相连，<br>七颗青果，两颗黄橙转色果。</p></div>
      <section class="inspector-section"><h3>01 <span>审阅角度</span></h3><div class="shot-grid"><button v-for="(shot,i) in TOMATO_SAMPLE_SHOTS" :key="shot.id" :class="{active:state?.shotId===shot.id}" :data-shot="shot.id" @click="runtime?.getFacade().setCameraShot(shot.id)"><small>0{{i+1}}</small>{{shot.label}}<span>↗</span></button></div></section>
      <section class="inspector-section"><h3>02 <span>样板规格</span></h3><dl><div><dt>株高 / 静态冠幅</dt><dd>2.4 / 0.55 m</dd></div><div><dt>主茎 / 支枝组</dt><dd>1 / 6</dd></div><div><dt>复叶小叶</dt><dd>60 片</dd></div><div><dt>果实 / 果簇</dt><dd>9 颗 / 3 簇</dd></div><div><dt>成熟外观</dt><dd>7 青果 / 2 转色果</dd></div><div><dt>纹理</dt><dd>自有叶面 1024²</dd></div></dl></section>
      <section class="inspector-section"><h3>03 <span>本次审阅范围</span></h3><p class="small-note">主茎、六组复叶支枝、三簇果实、果柄萼片与支撑绳。叶片采用锯齿轮廓和浅弯曲，果实保留柔和高光。<br><br>本次先确认静态外观，尚未接入风动、运行 LOD、温室十株布局及整园性能。</p></section>
      <section class="inspector-section metrics"><h3>04 <span>运行状态</span></h3><dl><div><dt>Runtime</dt><dd>{{state?.runtime??'idle'}}</dd></div><div><dt>离线地图</dt><dd>{{state?.map.status??'loading'}}</dd></div><div><dt>Three 三角形</dt><dd>{{state?.threeTriangles??0}}</dd></div><div><dt>Three draw calls</dt><dd>{{state?.threeDrawCalls??0}}</dd></div></dl><p v-if="state?.error" class="error-message">{{state.error}}</p></section>
      <footer class="inspector-footer">本版单株静态外观已获你确认。<br>不以样板通过替代整园验收。</footer>
    </aside>
  </main>
</template>
<style scoped>
nav{display:flex;gap:18px}nav a{color:#dcc591;text-decoration:none;font-size:12px}.shot-grid{grid-template-columns:1fr}.sample-inspector .shot-grid button{font-size:11px}.pose-buttons{display:flex;gap:8px}.pose-buttons button{flex:1;background:transparent;border:1px solid var(--border);padding:9px 5px;font-size:11px}.pose-buttons button.active{border-color:#a39164;color:#ead5a8;background:#d8c28e17}
@media(max-width:600px){nav{gap:8px}nav a{font-size:9px}.brand strong{font-size:12px}.brand small{letter-spacing:0}.scene-caption h1{font-size:17px}}
</style>
