<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { FarmRuntime } from '../app/composition/FarmRuntime';
import { createTreeSampleScene, TREE_SAMPLE_SHOTS } from '../rendering/TreeSampleScene';
import type { SceneSnapshot } from '../app/ports/scene';
const host=ref<HTMLElement>();const state=shallowRef<SceneSnapshot>();const route=useRoute();const clean=computed(()=>route.query.clean==='1');
let runtime:FarmRuntime|undefined,off:(()=>void)|undefined;

onMounted(()=>{runtime=new FarmRuntime(host.value!,createTreeSampleScene,TREE_SAMPLE_SHOTS);off=runtime.getFacade().subscribe(snapshot=>{state.value=snapshot;});void runtime.start().catch(()=>{});});
onBeforeUnmount(()=>{off?.();void runtime?.dispose();});
</script>
<template>
  <main class="workspace" :class="{'is-clean':clean}">
    <header v-if="!clean" class="topbar"><div class="brand"><span class="brand-symbol">禾</span><div><strong>阔叶景观树 · 候选 01</strong><small>ASSET STUDY / 分枝 · 分簇树冠 · 叶片</small></div></div><nav><RouterLink to="/samples/solar">太阳能板</RouterLink><RouterLink to="/samples/leaf">叶菜</RouterLink><RouterLink to="/calibration">空间校准 ↗</RouterLink></nav></header>
    <section class="scene-shell"><div ref="host" class="scene-host" data-testid="scene-host" :data-diagnostics="JSON.stringify(state)"></div>
      <div v-if="!clean" class="scene-caption"><span class="eyebrow">BROADLEAF TREE / CANDIDATE 01</span><h1>枝冠错落，光落叶间。</h1><p>8 m 树高 · 4 组主枝 · 5 簇树冠</p></div>
      <div v-if="!clean" class="scene-note">静态单树样板 · 未指定具体树种<br>树冠由独立曲面叶片形成，非不透明球体</div>
    </section>
    <aside v-if="!clean" class="inspector sample-inspector">
      <div class="inspector-heading"><span class="eyebrow">AUTHORING / TREE 01</span><h2>树干分枝，叶面成冠。</h2><p>保留枝干与树冠空隙，<br>以曲面叶片形成不规则轮廓。</p></div>
      <section class="inspector-section"><h3>01 <span>审阅角度</span></h3><div class="shot-grid"><button v-for="(shot,i) in TREE_SAMPLE_SHOTS" :key="shot.id" :class="{active:state?.shotId===shot.id}" :data-shot="shot.id" @click="runtime?.getFacade().setCameraShot(shot.id)"><small>0{{i+1}}</small>{{shot.label}}<span>↗</span></button></div></section>
      <section class="inspector-section"><h3>02 <span>样板规格</span></h3><dl><div><dt>树高</dt><dd>8 m</dd></div><div><dt>静态冠幅</dt><dd>5.6 m</dd></div><div><dt>主枝 / 冠簇</dt><dd>4 组 / 5 簇</dd></div><div><dt>曲面叶片</dt><dd>480 片</dd></div><div><dt>风动预留</dt><dd>水平 0.12 m</dd></div><div><dt>外形种子</dt><dd>17 · 可复现</dd></div></dl></section>
      <section class="inspector-section"><h3>03 <span>本次审阅范围</span></h3><p class="small-note">渐细树干、四组主枝、五簇枝叶、树皮纹理与落地阴影。叶面使用不透明双面曲面，保留冠层透光空隙。<br><br>本次仅审阅单树静态外观；风动、运行 LOD、八棵边界树及整园性能尚未验收。</p></section>
      <section class="inspector-section metrics"><h3>04 <span>运行状态</span></h3><dl><div><dt>Runtime</dt><dd>{{state?.runtime??'idle'}}</dd></div><div><dt>离线地图</dt><dd>{{state?.map.status??'loading'}}</dd></div><div><dt>Three 三角形</dt><dd>{{state?.threeTriangles??0}}</dd></div><div><dt>Three draw calls</dt><dd>{{state?.threeDrawCalls??0}}</dd></div></dl><p v-if="state?.error" class="error-message">{{state.error}}</p></section>
      <footer class="inspector-footer">本版单株静态外观已获你确认。<br>不以样板通过替代整园验收。</footer>
    </aside>
  </main>
</template>
<style scoped>
nav{display:flex;gap:18px}nav a{color:#dcc591;text-decoration:none;font-size:12px}.shot-grid{grid-template-columns:1fr}.sample-inspector .shot-grid button{font-size:11px}.pose-buttons{display:flex;gap:8px}.pose-buttons button{flex:1;background:transparent;border:1px solid var(--border);padding:9px 5px;font-size:11px}.pose-buttons button.active{border-color:#a39164;color:#ead5a8;background:#d8c28e17}
@media(max-width:600px){nav{gap:8px}nav a{font-size:9px}.brand strong{font-size:12px}.brand small{letter-spacing:0}.scene-caption h1{font-size:17px}}
</style>
