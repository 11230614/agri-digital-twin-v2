<script setup lang="ts">
import {computed,onMounted,onBeforeUnmount,ref,shallowRef} from 'vue';
import {useRoute} from 'vue-router';
import {FarmRuntime} from '../app/composition/FarmRuntime';
import {createParkSampleScene} from '../rendering/ParkSampleScene';
import {createParkBenchmarkPath} from '../config/park-benchmark-path';
import {PARK_SHOTS} from '../config/park-shots';
import {PARK_COUNTS} from '../config/park-layout';
import {ENVIRONMENT_REVIEW_SHOT} from '../config/park-environment';
import type {SceneSnapshot} from '../app/ports/scene';
const host=ref<HTMLElement>(),state=shallowRef<SceneSnapshot>(),sidebar=ref(true),route=useRoute(),clean=computed(()=>route.query.clean==='1');
let runtime:FarmRuntime|undefined,off:(()=>void)|undefined;
const quality=computed(()=>route.query.quality==='reference'?'reference':'balanced');
const facade=()=>runtime?.getFacade();
const showOverview=()=>{facade()?.setInspection({cutaway:false,doorRatio:state.value?.inspection?.doorRatio??0});facade()?.setCameraShot('CAM-01');};
const inspection=(cutaway:boolean,doorRatio=state.value?.inspection?.doorRatio??0)=>facade()?.setInspection({cutaway,doorRatio});
const title=computed(()=>[...PARK_SHOTS,ENVIRONMENT_REVIEW_SHOT].find(s=>s.id===state.value?.shotId)?.label??'整园总览');
onMounted(()=>{runtime=new FarmRuntime(host.value!,renderer=>createParkSampleScene(renderer,quality.value,route.query.environment!=='off',route.query.atmosphere!=='off'),[...PARK_SHOTS,ENVIRONMENT_REVIEW_SHOT],{localNavigation:true,imageryOnlyCesium:route.query.mapPipeline!=='legacy',cameraPath:import.meta.env.DEV&&typeof route.query.benchmarkPath==='string'?createParkBenchmarkPath(route.query.benchmarkPath):undefined});off=runtime.getFacade().subscribe(s=>state.value=s);void runtime.start().then(()=>{if(import.meta.env.DEV&&typeof route.query.benchmarkPath==='string')facade()?.setCameraShot(route.query.benchmarkPath);}).catch(()=>{});});
onBeforeUnmount(()=>{off?.();void runtime?.dispose();});
</script>
<template>
 <main class="workspace park-workspace" :class="{'is-clean':clean,'sidebar-closed':!sidebar}">
  <header v-if="!clean" class="topbar"><div class="brand"><span class="brand-symbol">禾</span><div><strong>禾境 · 整园布局样板</strong><small>PARK STUDY / CANDIDATE 03</small></div></div><nav><RouterLink to="/samples/greenhouse">温室样板</RouterLink><RouterLink to="/samples/field">田块样板</RouterLink><RouterLink to="/calibration">空间校准 ↗</RouterLink></nav></header>
  <section class="scene-shell" aria-label="农业园区布局三维场景"><div ref="host" class="scene-host" data-testid="scene-host" :data-quality="quality" :data-diagnostics="JSON.stringify(state)"></div>
   <template v-if="!clean"><div class="scene-caption"><span class="eyebrow">DEMO / 108 × 90 M</span><h1>{{title}}</h1><p>三座温室 · 三块菜田 · 四桌太阳能板</p></div>
    <button class="panel-toggle" data-testid="sidebar-toggle" :aria-expanded="sidebar" aria-controls="park-inspector" @click="sidebar=!sidebar">{{sidebar?'收起面板':'展开面板'}} <span>↗</span></button>
    <button class="overview-button" data-testid="return-overview" @click="showOverview">↖ 返回整园</button>
    <div class="scene-note">示意园区 · 本地影像底图 · 非测绘复刻<br>{{state?.inspection?.cutaway?'屋顶剖切审阅 · 可恢复覆盖层':'正常覆盖层'}} · {{state?.map.status==='ready'?'离线地图已就绪':'离线地图加载中'}}</div>
   </template>
  </section>
  <aside v-if="!clean&&sidebar" id="park-inspector" class="inspector">
   <div class="inspector-heading"><span class="eyebrow">QUALITY STUDY / 01</span><h2>从园区，到一片叶。</h2><p>{{quality==='balanced'?'平衡档：2048阴影，中远景叶片简化材质。':'原画质：4096阴影，保留完整叶片材质。'}}<br>两档保留布局、株数与近景造型。平衡档外观已确认。</p></div>
   <section class="inspector-section"><div class="quality-links"><RouterLink data-testid="quality-reference" :to="{path:route.path,query:{quality:'reference'}}" :class="{selected:quality==='reference'}">原画质</RouterLink><RouterLink data-testid="quality-balanced" :to="{path:route.path,query:{quality:'balanced'}}" :class="{selected:quality==='balanced'}">平衡档 · 已确认</RouterLink></div><p class="small-note">切换画质后返回总览，请选择相同镜头对照。</p></section>
   <section class="inspector-section"><h3>01 <span>五种观察尺度</span></h3><div class="shot-grid"><button v-for="(shot,i) in PARK_SHOTS" :key="shot.id" :data-shot="shot.id" :class="{active:state?.shotId===shot.id}" @click="facade()?.setCameraShot(shot.id)"><small>0{{i+1}}</small>{{shot.label}}<span>↗</span></button></div></section>
   <section v-if="state?.environment" class="inspector-section"><h3>环境候选 <span>周边山体与天空</span></h3><div class="shot-grid"><button data-testid="environment-review" @click="facade()?.setCameraShot('ENV-01')">低俯角查看山体 <span>↗</span></button></div><p class="small-note">保留原总览镜头；此视角用于审阅山体远近与高度。</p></section>
   <section class="inspector-section"><h3>02 <span>覆盖层与地表</span></h3><label class="switch-row">屋顶剖切<input type="checkbox" data-testid="cutaway-toggle" :checked="state?.inspection?.cutaway" @change="inspection(($event.target as HTMLInputElement).checked)"></label><label class="switch-row">局部设计地表<input type="checkbox" data-testid="surfaces-toggle" :checked="state?.surfacesVisible" @change="facade()?.setSurfacesVisible(($event.target as HTMLInputElement).checked)"></label><label class="switch-row">三维模型覆盖层<input type="checkbox" data-testid="overlay-toggle" :checked="state?.overlayVisible" @change="facade()?.setOverlayVisible(($event.target as HTMLInputElement).checked)"></label><p class="small-note">剖切仅用于观察；返回整园恢复正常棚壳。左键平移，右键旋转/俯仰，滚轮缩放；到边界自动停止。</p></section>
   <section class="inspector-section"><h3>03 <span>布局清单</span></h3><dl><div><dt>示意占地</dt><dd>108 × 90 m</dd></div><div><dt>温室 / 田块 / 板桌</dt><dd>3 / 3 / 4</dd></div><div><dt>温室净距 / 田块净距</dt><dd>12 m / 6 m</dd></div><div><dt>田间 / 棚内叶菜</dt><dd>{{PARK_COUNTS.fieldLeaves}} / {{PARK_COUNTS.greenhouseLeaves}} 株</dd></div><div><dt>番茄 / 边界树</dt><dd>30 株 / 8 棵</dd></div></dl></section>
   <section class="inspector-section"><h3>04 <span>运行状态</span></h3><dl><div><dt>Runtime</dt><dd>{{state?.runtime??'idle'}}</dd></div><div><dt>Three 三角形</dt><dd>{{state?.threeTriangles??0}}</dd></div><div><dt>Three draw calls</dt><dd>{{state?.threeDrawCalls??0}}</dd></div></dl><p v-if="state?.error" class="error-message" role="alert">{{state.error}}</p></section>
   <footer class="inspector-footer">平衡档外观已确认，作为后续优化基线。<br><template v-if="state?.environment">山体轮廓已确认 · 天空与薄雾候选02。<br>轻量山坡，预烘焙云层，园区外围薄雾。<br></template>动画与完整性能仍需验收。</footer>
  </aside>
 </main>
</template>
<style scoped>
.quality-links{display:flex;gap:8px}.quality-links a{padding:8px;border:1px solid var(--border);color:#dcc591;text-decoration:none;font-size:11px}.quality-links .selected{background:#395648}
nav{display:flex;gap:18px}nav a{color:#dcc591;text-decoration:none;font-size:12px}.shot-grid{grid-template-columns:1fr}.shot-grid button{font-size:11px}.overview-button{position:absolute;right:24px;bottom:28px;z-index:3;background:#183025ed;border:1px solid var(--border);padding:12px 18px;font-size:12px}.scene-caption{color:#f3ebd8}.scene-caption h1{font-size:30px}.scene-caption p{text-shadow:0 1px 4px #162018}
@media(max-width:600px){nav{gap:9px}nav a{font-size:9px}nav a:last-child{display:none}.brand strong{font-size:12px}.brand small{letter-spacing:.5px}.inspector{display:block}.inspector-section{margin-bottom:18px}.inspector-section:nth-of-type(n+3){display:none}.shot-grid{grid-template-columns:1fr 1fr}.scene-caption h1{font-size:22px}.scene-caption{top:62px}.overview-button{right:16px;bottom:24px;padding:8px 10px;font-size:10px}.scene-note{max-width:210px;bottom:24px}.sidebar-closed .scene-shell{grid-row:2}}
</style>
