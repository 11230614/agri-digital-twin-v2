<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { FarmRuntime } from '../app/composition/FarmRuntime';
import { createLeafSampleScene, LEAF_SAMPLE_SHOTS } from '../rendering/LeafSampleScene';
import type { SceneSnapshot } from '../app/ports/scene';
const host=ref<HTMLElement>();const state=shallowRef<SceneSnapshot>();
const route=useRoute();const clean=computed(()=>route.query.clean==='1');
let runtime:FarmRuntime|undefined,off:(()=>void)|undefined;
onMounted(()=>{
  runtime=new FarmRuntime(host.value!,createLeafSampleScene,LEAF_SAMPLE_SHOTS);
  off=runtime.getFacade().subscribe(snapshot=>{state.value=snapshot;});
  void runtime.start().catch(()=>{});
});
onBeforeUnmount(()=>{off?.();void runtime?.dispose();});
</script>
<template>
  <main class="workspace" :class="{'is-clean':clean}">
    <header v-if="!clean" class="topbar"><div class="brand"><span class="brand-symbol">禾</span><div><strong>小白菜／油菜类 · 候选 02</strong><small>ASSET STUDY / 静态外观已确认</small></div></div><RouterLink to="/samples/solar" class="sample-back">太阳能板样板 ↗</RouterLink></header>
    <section class="scene-shell"><div ref="host" class="scene-host" data-testid="scene-host" :data-diagnostics="JSON.stringify(state)"></div>
      <div v-if="!clean" class="scene-caption"><span class="eyebrow">UPRIGHT LEAFY ROSETTE / CANDIDATE 02</span><h1>匙形宽叶，层层向上。</h1><p>浅绿叶柄 · 圆润叶面 · 6 + 4 + 2 叶层</p></div>
      <div v-if="!clean" class="scene-note">隔离建模样段，非完整田块；不代表阶段 3 / 4 已通过<br>本样板暂为静态近景，风动、远景 LOD 与整园性能分别验收</div>
    </section>
    <aside v-if="!clean" class="inspector sample-inspector">
      <div class="inspector-heading"><span class="eyebrow">AUTHORING / LEAF 02</span><h2>先审一株，再建一园。</h2><p>已按确认的小白菜／油菜类方向，<br>细化叶柄、叶缘与直立层次。</p></div>
      <section class="inspector-section"><h3>01 <span>样板规格</span></h3><dl><div><dt>当前规格</dt><dd>{{state?.shotId==='leaf-field'?'田间':'棚内'}}</dd></div><div><dt>名义株高</dt><dd>{{state?.shotId==='leaf-field'?'0.28':'0.35'}} m</dd></div><div><dt>名义冠幅</dt><dd>{{state?.shotId==='leaf-field'?'0.35':'0.45'}} m</dd></div><div><dt>叶片层次</dt><dd>外圈 6 / 中圈 4 / 内心 2</dd></div><div><dt>近景候选几何</dt><dd>1152 三角形 / 株</dd></div><div><dt>样段间距</dt><dd>0.6 m</dd></div><div><dt>材质资源</dt><dd>自有程序纹理 1024²</dd></div></dl></section>
      <section class="inspector-section"><h3>02 <span>审阅角度</span></h3><div class="shot-grid"><button v-for="(shot,i) in LEAF_SAMPLE_SHOTS" :key="shot.id" :class="{active:state?.shotId===shot.id}" :data-shot="shot.id" @click="runtime?.getFacade().setCameraShot(shot.id)"><small>0{{i+1}}</small>{{shot.label}}<span>↗</span></button></div></section>
      <section class="inspector-section"><h3>03 <span>当前范围</span></h3><p class="small-note">单株视角仅显示一株，样段视角显示 27 株。两种规格都以根基为原点，保留浅绿叶柄与独立匙形叶片。<br><br>本次先审静态造型；风动与三档切换尚未验收。未复制到三座温室和三块田地。</p></section>
      <section class="inspector-section metrics"><h3>04 <span>运行状态</span></h3><dl><div><dt>Runtime</dt><dd>{{state?.runtime??'idle'}}</dd></div><div><dt>离线地图</dt><dd>{{state?.map.status??'loading'}}</dd></div><div><dt>Three 三角形</dt><dd>{{state?.threeTriangles??0}}</dd></div></dl><p v-if="state?.error" class="error-message">{{state.error}}</p></section>
      <footer class="inspector-footer">候选02静态外观已由用户确认。<br>审阅通过仅针对本候选版本，不替代整园验收。</footer>
    </aside>
  </main>
</template>
<style scoped>
.sample-back{color:#dcc591;text-decoration:none;font-size:12px}.shot-grid{grid-template-columns:1fr}.sample-inspector .shot-grid button{font-size:11px}
@media(max-width:600px){.sample-back{font-size:10px}.brand strong{font-size:12px}}
</style>
