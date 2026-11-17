<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { FarmRuntime } from '../app/composition/FarmRuntime';
import { createGreenhouseSampleScene, GREENHOUSE_SAMPLE_SHOTS } from '../rendering/GreenhouseSampleScene';
import type { SceneSnapshot } from '../app/ports/scene';
const host=ref<HTMLElement>();const state=shallowRef<SceneSnapshot>();const route=useRoute();const clean=computed(()=>route.query.clean==='1');
let runtime:FarmRuntime|undefined,off:(()=>void)|undefined;
const inspect=(doorRatio=state.value?.inspection?.doorRatio??0,cutaway=state.value?.inspection?.cutaway??false)=>runtime?.getFacade().setInspection({doorRatio,cutaway});
onMounted(()=>{runtime=new FarmRuntime(host.value!,createGreenhouseSampleScene,GREENHOUSE_SAMPLE_SHOTS);off=runtime.getFacade().subscribe(snapshot=>{state.value=snapshot;});void runtime.start().catch(()=>{});});
onBeforeUnmount(()=>{off?.();void runtime?.dispose();});
</script>
<template>
  <main class="workspace" :class="{'is-clean':clean}">
    <header v-if="!clean" class="topbar"><div class="brand"><span class="brand-symbol">禾</span><div><strong>拱顶温室 · 组合候选 02</strong><small>ASSET STUDY / 玻璃 · 框架 · 种植床</small></div></div><nav><RouterLink to="/samples/solar">太阳能板</RouterLink><RouterLink to="/samples/leaf">叶菜</RouterLink><RouterLink to="/calibration">空间校准 ↗</RouterLink></nav></header>
    <section class="scene-shell"><div ref="host" class="scene-host" data-testid="scene-host" :data-diagnostics="JSON.stringify(state)"></div>
      <div v-if="!clean" class="scene-caption"><span class="eyebrow">ARCHED GREENHOUSE / CANDIDATE 02</span><h1>光穿过棚顶，绿沿通道生长。</h1><p>18 × 28 × 7 m · 8 榀拱架 · 双床种植</p></div>
      <div v-if="!clean" class="scene-note">{{state?.inspection?.cutaway?'剖切审阅：仅隐藏屋顶覆盖层，非机械开顶':'正常覆盖层：屋顶保留，玻璃采用透明与环境反射组合'}}<br>隔离样板 · 780株叶菜 + 10株已确认番茄</div>
    </section>
    <aside v-if="!clean" class="inspector sample-inspector">
      <div class="inspector-heading"><span class="eyebrow">AUTHORING / GREENHOUSE 02</span><h2>从整棚，走入棚内。</h2><p>看清拱架、玻璃与入口，<br>再看床沿、叶片与设备纵深。</p></div>
      <section class="inspector-section"><h3>01 <span>审阅角度</span></h3><div class="shot-grid"><button v-for="(shot,i) in GREENHOUSE_SAMPLE_SHOTS" :key="shot.id" :class="{active:state?.shotId===shot.id}" :data-shot="shot.id" @click="runtime?.getFacade().setCameraShot(shot.id)"><small>0{{i+1}}</small>{{shot.label}}<span>↗</span></button></div></section>
      <section class="inspector-section"><h3>02 <span>静态构件审阅</span></h3><div class="pose-buttons"><button v-for="(ratio,i) in [0,.5,1]" :key="ratio" :class="{active:state?.inspection?.doorRatio===ratio}" :data-door="ratio" @click="inspect(ratio)">{{['关门','半开','全开'][i]}}</button></div><label class="switch-row">剖切查看屋顶<input type="checkbox" :checked="state?.inspection?.cutaway" data-testid="cutaway-toggle" @change="inspect(undefined,($event.target as HTMLInputElement).checked)"></label><p class="small-note">门位为静态审阅姿态，非设备反馈。剖切是查看模式，可随时恢复覆盖层。</p></section>
      <section class="inspector-section"><h3>03 <span>样板规格</span></h3><dl><div><dt>外包络</dt><dd>18 × 28 × 7 m</dd></div><div><dt>门洞</dt><dd>3 × 2.5 m</dd></div><div><dt>种植床</dt><dd>2 张 · 6 × 24 m</dd></div><div><dt>叶菜</dt><dd>780 株 · 间距 0.6 m</dd></div><div><dt>设备</dt><dd>3 风机 / 8 灯 / 6 盒 / 10 番茄</dd></div><div><dt>人眼镜头</dt><dd>1.7 m / 65°</dd></div></dl></section>
      <section class="inspector-section metrics"><h3>04 <span>运行状态</span></h3><dl><div><dt>Runtime</dt><dd>{{state?.runtime??'idle'}}</dd></div><div><dt>离线地图</dt><dd>{{state?.map.status??'loading'}}</dd></div><div><dt>Three 三角形</dt><dd>{{state?.threeTriangles??0}}</dd></div><div><dt>Three draw calls</dt><dd>{{state?.threeDrawCalls??0}}</dd></div></dl><p v-if="state?.error" class="error-message">{{state.error}}</p></section>
      <footer class="inspector-footer">当前审阅静态外观、空间与覆盖层。<br>本次审阅番茄接入后的静态组合；动画及整园性能尚未验收。</footer>
    </aside>
  </main>
</template>
<style scoped>
nav{display:flex;gap:18px}nav a{color:#dcc591;text-decoration:none;font-size:12px}.shot-grid{grid-template-columns:1fr}.sample-inspector .shot-grid button{font-size:11px}.pose-buttons{display:flex;gap:8px}.pose-buttons button{flex:1;background:transparent;border:1px solid var(--border);padding:9px 5px;font-size:11px}.pose-buttons button.active{border-color:#a39164;color:#ead5a8;background:#d8c28e17}
@media(max-width:600px){nav{gap:8px}nav a{font-size:9px}.brand strong{font-size:12px}.brand small{letter-spacing:0}.scene-caption h1{font-size:17px}}
</style>
