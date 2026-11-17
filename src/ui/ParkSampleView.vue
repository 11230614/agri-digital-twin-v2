<script setup lang="ts">
import {computed,onMounted,onBeforeUnmount,ref,shallowRef,watch,nextTick} from 'vue';
import {useRoute} from 'vue-router';
import {FarmRuntime} from '../app/composition/FarmRuntime';
import {createParkSampleScene} from '../rendering/ParkSampleScene';
import {createParkBenchmarkPath} from '../config/park-benchmark-path';
import {PARK_SHOTS} from '../config/park-shots';
import {PARK_COUNTS,PARK_LAYOUT} from '../config/park-layout';
import {ENVIRONMENT_REVIEW_SHOT} from '../config/park-environment';
import {SEASONS,DAY_PERIODS,type Season,type DayPeriod} from '../app/ports/environment';
import type {DemoScenario} from '../data/DemoMonitoringSource';
import {NDVI_STOPS,type VegetationMode} from '../app/ports/data-visual';
import {useMonitoringStore} from './monitoring-store';
import type {InteractionEntity} from '../app/ports/interaction';
import type {SceneSnapshot} from '../app/ports/scene';
import './park-hud.css';
const host=ref<HTMLElement>(),state=shallowRef<SceneSnapshot>(),panels=ref(true),mobileSide=ref<'left'|'right'>('left'),route=useRoute();
const clean=computed(()=>route.query.clean==='1');
const store=useMonitoringStore(),data=computed(()=>store.snapshot),now=ref(Date.now());
let runtime:FarmRuntime|undefined,off:(()=>void)|undefined,clock:ReturnType<typeof setInterval>|undefined;
const quality=computed(()=>route.query.quality==='reference'?'reference':'balanced');
const facade=()=>runtime?.getFacade();
const showOverview=()=>{facade()?.selectEntity(null);facade()?.setInspection({cutaway:false,doorRatio:state.value?.inspection?.doorRatio??0});facade()?.setCameraShot('CAM-01');};
const title=computed(()=>PARK_SHOTS.find(s=>s.id===state.value?.shotId)?.label??'整园总览');
const time=(value:number)=>new Date(value).toLocaleTimeString('zh-CN',{hour12:false});
const format=(value:number)=>value.toLocaleString('en-US');
const stale=computed(()=>!data.value||now.value-data.value.timestamp>18000);
const water=computed(()=>data.value?.plots.reduce((n,p)=>n+p.completedM3,0)??0);
const sparkline=computed(()=>data.value?.history.map((v,i,a)=>`${a.length===1?0:i/(a.length-1)*280},${66-(v-23)*25}`).join(' ')??'');
const goShot=(id:string)=>facade()?.setCameraShot(id);
const selected=computed(()=>state.value?.interaction?.entities.find(e=>e.id===state.value?.interaction?.selectedId));
const selectedPlot=computed(()=>data.value?.plots.find(p=>p.id===(selected.value?.ownerId??selected.value?.id)));
const kindNames:Record<InteractionEntity['kind'],string>={'plot':'种植田块','soil-sensor':'土壤传感器','greenhouse':'温室','weather-station':'气象站','controller':'控制柜'};
const selectedHouse=computed(()=>data.value?.greenhouses.find(h=>h.id===selected.value?.id));
const selectedInvalid=computed(()=>selected.value?.kind==='greenhouse'?stale.value||!selectedHouse.value:selected.value?.kind==='weather-station'?stale.value:!selectedPlot.value||selectedPlot.value.quality!=='good'||now.value-selectedPlot.value.timestamp>18000);
const alerts=computed(()=>stale.value?[]:data.value?.alerts??[]);
const navigationMessage=ref('');
const navigateEntity=(id:string,focus=false)=>{if(!state.value?.interaction?.entities.some(e=>e.id===id)){navigationMessage.value='目标暂不可定位';return;}navigationMessage.value='';facade()?.selectEntity(id);if(focus)focusEntity(id);};
const focusing=computed(()=>selected.value&&state.value?.interaction?.focusStatus!=='idle');
const samplePlot=computed(()=>data.value?.plots.find(p=>p.id===(state.value?.dataVisual?.entityId??'plot-02')));
const ndviPoints=computed(()=>samplePlot.value?.ndvi.history.map((v,i,a)=>`${a.length===1?0:i/(a.length-1)*270},${45-v*40}`).join(' ')??'');
const setMode=(mode:VegetationMode)=>facade()?.setVegetationMode(mode);
const setDataPlot=(event:Event)=>facade()?.setDataVisualPlot((event.target as HTMLSelectElement).value);
const setScenario=(event:Event)=>facade()?.setDemoScenario((event.target as HTMLSelectElement).value as DemoScenario);
const setSeason=(event:Event)=>facade()?.setEnvironmentPreset({season:(event.target as HTMLSelectElement).value as Season,period:state.value?.appearance?.period??'day'});
const setPeriod=(event:Event)=>facade()?.setEnvironmentPreset({season:state.value?.appearance?.season??'summer',period:(event.target as HTMLSelectElement).value as DayPeriod});
const updateFocusInsets=()=>{
 facade()?.setEntityLabelsVisible(panels.value&&!clean.value);
 const left=document.querySelector('.hud-left'),right=document.querySelector('.hud-right');
 const inset=(node:Element|null)=>!clean.value&&panels.value&&node&&getComputedStyle(node).display!=='none'?node.getBoundingClientRect().width+45:0;
 facade()?.setFocusSafeInsets({left:inset(left),right:inset(right)});
};
const focusEntity=(id:string)=>{updateFocusInsets();facade()?.focusEntity(id);};
watch(()=>selected.value?.id,async id=>{if(!id)return;await nextTick();document.querySelector('.entity-details')?.scrollIntoView({block:'nearest'});});
watch([panels,mobileSide,clean],async()=>{await nextTick();updateFocusInsets();});
onMounted(()=>{
 clock=setInterval(()=>{now.value=Date.now();},1000);
 runtime=new FarmRuntime(host.value!,renderer=>createParkSampleScene(renderer,quality.value,route.query.environment!=='off',route.query.atmosphere!=='off'),[...PARK_SHOTS,ENVIRONMENT_REVIEW_SHOT],{localNavigation:true,imageryOnlyCesium:route.query.mapPipeline!=='legacy',cameraPath:import.meta.env.DEV&&typeof route.query.benchmarkPath==='string'?createParkBenchmarkPath(route.query.benchmarkPath):undefined});
 off=runtime.getFacade().subscribe(s=>{state.value=s;if(s.monitoring&&s.monitoring!==store.snapshot)store.project(s.monitoring);});
 updateFocusInsets();window.addEventListener('resize',updateFocusInsets);
 void runtime.start().then(()=>{if(import.meta.env.DEV&&typeof route.query.benchmarkPath==='string')goShot(route.query.benchmarkPath);}).catch(error=>{console.error('园区初始化失败',error);});
});
onBeforeUnmount(()=>{window.removeEventListener('resize',updateFocusInsets);clearInterval(clock);store.reset();off?.();void runtime?.dispose();});
</script>
<template>
 <main class="park-monitor" :class="{'hud-hidden':!panels}" aria-label="禾境智慧农场数字孪生监测">
  <section class="monitor-scene scene-shell" aria-label="全屏农业园区三维场景"><div ref="host" class="scene-host" data-testid="scene-host" :data-quality="quality" :data-diagnostics="JSON.stringify(state)"></div></section>
  <template v-if="!clean">
   <header class="monitor-header">
    <div class="monitor-brand"><span class="monitor-emblem">禾</span><div><h1>禾境智慧农场 <span>· 数字孪生</span></h1><small>HEJING / AGRICULTURAL DIGITAL TWIN</small></div></div>
    <div class="monitor-context"><b>园区运行监测</b><span>江苏 · 睢宁示意园区</span></div>
    <div class="monitor-weather" v-if="data"><span class="weather-sun">☀</span><div><b>{{data.temperature}}°C</b><small>湿度 {{data.humidity}}% · 风速 {{data.wind}} m/s</small></div></div>
    <div class="monitor-clock"><b>{{time(now)}}</b><small>{{new Date(now).toLocaleDateString('zh-CN')}}</small></div>
    <span class="demo-badge">模拟监测 · DEMO</span>
    <button class="hud-action" data-testid="sidebar-toggle" :aria-expanded="panels" aria-controls="monitor-panels" @click="panels=!panels">{{panels?'隐藏面板':'显示面板'}}</button>
   </header>
   <div v-show="panels" class="monitor-hud" id="monitor-panels">
    <div class="view-indicator"><span class="live-dot"></span>{{focusing?selected?.name+'观察':title}}<i></i><span>场景实时渲染</span></div>
    <div class="mobile-tabs"><button :aria-pressed="mobileSide==='left'" @click="mobileSide='left'">园区与环境</button><button :aria-pressed="mobileSide==='right'" @click="mobileSide='right'">温室与设备</button></div>
    <aside class="hud-column hud-left" :class="{'mobile-visible':mobileSide==='left'}" aria-label="园区与环境监测">
     <section class="hud-card overview-card"><div class="card-heading"><h2>园区总览</h2><span>PARK OVERVIEW</span></div>
      <div class="summary-grid"><div><span>叶菜总量</span><strong>{{format(PARK_COUNTS.leaves)}}<small>株</small></strong></div><div><span>园区占地</span><strong>9,720<small>m²</small></strong></div><div><span>种植田块</span><strong>03<small>块</small></strong></div><div><span>生产温室</span><strong>03<small>座</small></strong></div></div>
      <div class="stat-line"><span>露地叶菜 / 棚内叶菜</span><b>{{format(PARK_COUNTS.fieldLeaves)}} / {{format(PARK_COUNTS.greenhouseLeaves)}} 株</b></div>
      <div class="stat-line"><span>棚内番茄</span><b>{{PARK_COUNTS.tomatoes}} 株</b></div><div class="stat-line"><span>今日灌溉 · 模拟累计</span><b class="mint">{{water.toFixed(2)}} m³</b></div>
     </section>
     <section class="hud-card" v-if="data"><div class="card-heading"><h2>园区环境</h2><span>ENVIRONMENT</span></div>
      <div class="environment-grid"><div><span>空气温度</span><strong>{{data.temperature}}<small>°C</small></strong></div><div><span>空气湿度</span><strong>{{data.humidity}}<small>%</small></strong></div><div><span>光照强度</span><strong>{{(data.light/1000).toFixed(1)}}<small>klx</small></strong></div><div><span>风速</span><strong>{{data.wind}}<small>m/s</small></strong></div></div>
      <div class="chart-caption"><span>空气温度 · 本次会话</span><b>°C</b></div><svg class="environment-chart" viewBox="0 0 280 76" role="img" aria-label="本次会话空气温度趋势"><path d="M0 22H280 M0 48H280 M0 74H280" stroke="#a0d1be20" fill="none"/><polyline :points="sparkline" fill="none" stroke="#5cddba" stroke-width="2" vector-effect="non-scaling-stroke"/><circle v-if="data.history.length===1" cx="0" :cy="66-(data.temperature-23)*25" r="3" fill="#5cddba"/></svg><div class="chart-axis"><span>开始采样</span><span>每 6 秒更新 · 最多 30 点</span><span>现在</span></div>
     </section>
     <section class="hud-card irrigation-card" v-if="data"><div class="card-heading"><h2>田块墒情与灌溉</h2><span>IRRIGATION</span></div>
      <div v-for="plot in data.plots" :key="plot.id" class="plot-reading" :data-entity-id="plot.id"><div class="plot-title"><button class="entity-text-link" :data-list-entity="plot.id" @click="navigateEntity(plot.id)">{{plot.name}}</button><span :class="{'warning-text':plot.moisture<50}">土壤湿度 {{plot.moisture}}%</span></div><div class="moisture-track"><i :class="{dry:plot.moisture<50}" :style="{width:plot.moisture+'%'}"></i></div><div class="plot-detail"><span>{{plot.status}} · {{plot.flowM3h.toFixed(1)}} m³/h</span><span>今日 {{Math.round(plot.completedM3/plot.plannedM3*100)}}%</span></div></div>
      <p class="card-footnote">每田 2,680 株 · 演示计划每田 12 m³ / 日</p>
     </section>
    </aside>
    <aside class="hud-column hud-right" :class="{'mobile-visible':mobileSide==='right'}" aria-label="温室设备与告警">
     <section v-if="state?.appearance" class="hud-card appearance-card" data-testid="appearance-card"><div class="card-heading"><h2>场景环境</h2><span>VISUAL PRESET · DEMO</span></div>
      <div class="appearance-controls"><label>景观季节<select data-testid="season-select" :value="state.appearance.season" @change="setSeason"><option v-for="season in SEASONS" :key="season.id" :value="season.id">{{season.label}}</option></select></label><label>光照时段<select data-testid="period-select" :value="state.appearance.period" @change="setPeriod"><option v-for="period in DAY_PERIODS" :key="period.id" :value="period.id">{{period.label}}</option></select></label></div>
      <button class="hud-action appearance-reset" data-testid="appearance-reset" @click="facade()?.setEnvironmentPreset({season:'summer',period:'day'})">恢复夏季白天</button><p class="card-footnote">仅为环境演示，不改变实时钟、监测数据、作物状态或 NDVI 色带。冬季积雪限景观树、草地和远山；夜晚使用可观察月光。</p>
     </section>
     <section v-if="selected" class="hud-card entity-details" data-testid="entity-details"><div class="card-heading"><h2>选中对象</h2><span>ENTITY / DEMO</span></div><h3>{{selected.name}}</h3><code>{{selected.id}}</code><div class="stat-line"><span>类型</span><b>{{kindNames[selected.kind]}}</b></div>
      <template v-if="selected.kind==='greenhouse'"><div class="stat-line"><span>作物数量</span><b>780叶菜 / 10番茄</b></div><div class="stat-line"><span>温度 / 湿度</span><b>{{selectedInvalid?'—':selectedHouse?.temperature??'—'}} °C / {{selectedInvalid?'—':selectedHouse?.humidity??'—'}} %</b></div><div class="stat-line"><span>CO₂</span><b>{{selectedInvalid?'—':selectedHouse?.co2??'—'}} ppm</b></div><p class="card-footnote">当前温室独立模拟数据，不代表真实传感器采样。</p></template>
      <template v-else-if="selected.kind==='weather-station'"><div class="stat-line"><span>园区温度 / 湿度</span><b>{{selectedInvalid?'—':data?.temperature}} °C / {{selectedInvalid?'—':data?.humidity}} %</b></div><div class="stat-line"><span>风速 / 光照</span><b>{{selectedInvalid?'—':data?.wind}} m/s / {{selectedInvalid?'—':((data?.light??0)/1000).toFixed(1)}} klx</b></div><p class="card-footnote">园区气象汇总 · 非本站独立遥测；未提供设备在线或故障状态。</p></template>
      <template v-else><div v-if="selected.kind==='plot'" class="stat-line"><span>叶菜数量</span><b>2,680株</b></div><div class="stat-line"><span>{{selected.kind==='plot'?'田块':'关联田块'}}</span><b>{{selectedPlot?.name??'暂无绑定'}}</b></div><div class="stat-line"><span>土壤湿度</span><b>{{selectedInvalid?'—':selectedPlot?.moisture??'—'}}%</b></div><div class="stat-line"><span>灌溉观测状态</span><b>{{selectedInvalid?'数据缺失或过期':selectedPlot?.status??'未知'}}</b></div><div class="stat-line"><span>流量 / 累计用水</span><b>{{selectedInvalid?'—':selectedPlot?.flowM3h??'—'}} m³/h / {{selectedInvalid?'—':selectedPlot?.completedM3.toFixed(2)??'—'}} m³</b></div><div class="stat-line"><span>灌溉进度</span><b>{{selectedInvalid?'—':Math.round((selectedPlot?.completedM3??0)/(selectedPlot?.plannedM3??12)*100)}}%</b></div><p v-if="selected.kind!=='plot'" class="card-footnote">所属田块汇总 · 非{{selected.kind==='controller'?'柜体':'单探头'}}独立遥测，不表示真实硬件控制或执行反馈。</p></template>
      <div class="stat-line"><span>数据质量</span><b>{{selectedInvalid?'缺失或过期':'有效模拟数据'}}</b></div><p class="card-footnote">DEMO · park-demo-v1 · {{data?time(selectedPlot?.timestamp??data.timestamp):'暂无数据'}}</p>
      <div class="entity-actions"><button class="hud-action" data-testid="focus-selected" @click="focusEntity(selected.id)">聚焦观察</button><button class="hud-action" data-testid="clear-selection" @click="facade()?.selectEntity(null)">取消选择</button></div><p class="card-footnote">{{state?.interaction?.focusStatus==='moving'?'正在聚焦 · 操作鼠标即可中断':state?.interaction?.focusStatus==='arrived'?'已到达观察位置':state?.interaction?.focusStatus==='interrupted'?'聚焦已中断':'单击选择 · 双击聚焦'}} · DEMO</p>
     </section>
     <section class="hud-card" v-else-if="data"><div class="card-heading"><h2>温室环境概况</h2><span>GREENHOUSES</span></div><div class="greenhouse-table"><div class="greenhouse-table-head"><span>生产单元</span><span>温度</span><span>湿度</span></div><div v-for="house in data.greenhouses" :key="house.id" class="greenhouse-reading" :data-entity-id="house.id"><span><button class="entity-text-link" :data-list-entity="house.id" @click="navigateEntity(house.id)">{{house.name}}</button><small>780 叶菜 · 10 番茄</small></span><strong>{{house.temperature}}<small>°C</small></strong><strong>{{house.humidity}}<small>%</small></strong></div></div><div class="co2-strip"><span>棚内 CO₂</span><b>{{data.greenhouses[0].co2}}–{{data.greenhouses[2].co2}} ppm</b></div></section>
     <section class="hud-card data-visual-card" data-testid="data-visual-card"><div class="card-heading"><h2>{{samplePlot?.name??'田块'}} · 数据表现</h2><span>ALL PLOTS · DEMO</span></div>
      <label class="demo-scenario-label" for="data-plot">监测田块</label><select id="data-plot" data-testid="data-plot" :value="state?.dataVisual?.entityId??'plot-02'" @change="setDataPlot"><option v-for="plot in data?.plots??[]" :key="plot.id" :value="plot.id">{{plot.name}}</option></select>
      <div class="data-mode-buttons"><button data-testid="vegetation-natural" :aria-pressed="state?.dataVisual?.mode!=='ndvi'" @click="setMode('natural')">全田自然材质</button><button data-testid="vegetation-ndvi" :aria-pressed="state?.dataVisual?.mode==='ndvi'" @click="setMode('ndvi')">全田地表 NDVI</button></div>
      <div class="ndvi-value"><strong>{{state?.dataVisual?.ndvi?.toFixed(3)??'—'}}</strong><span>{{state?.dataVisual?.quality==='good'?'NDVI · 栅格均值':state?.dataVisual?.quality==='stale'?'采样过期':'暂无有效采样'}}</span></div>
      <div class="ndvi-legend" :style="{background:'linear-gradient(90deg,'+NDVI_STOPS.map(s=>`${s.color} ${(s.value+1)*50}%`).join(',')+')'}"></div><div class="ndvi-scale"><span v-for="stop in NDVI_STOPS" :key="stop.value" :style="{left:(stop.value+1)*50+'%'}">{{stop.value}}</span></div>
      <p class="card-footnote">{{samplePlot?.name??'田块'}}地表 / 土垄 / 叶菜 · 28×32 演示栅格。灰色为无效或过期像元，不代表低 NDVI。</p>
      <svg class="ndvi-chart" viewBox="0 0 270 48" role="img" aria-label="当前田块本次会话NDVI趋势"><path d="M0 46H270" stroke="#8cac9b40"/><polyline :points="ndviPoints" fill="none" stroke="#70dfae" stroke-width="2"/><circle v-if="samplePlot?.ndvi.history.length===1" cx="0" :cy="45-samplePlot.ndvi.history[0]*40" r="2" fill="#70dfae"/></svg>
      <div class="chart-axis"><span>栅格均值 · 本次会话</span><span>{{samplePlot?time(samplePlot.ndvi.timestamp):'等待数据'}}</span></div>
      <label class="demo-scenario-label" for="demo-scenario">模拟观测情景</label><select id="demo-scenario" data-testid="demo-scenario" :value="samplePlot?.scenario??'running'" @change="setScenario"><option value="running">灌溉运行</option><option value="standby">待机</option><option value="fault">设备故障</option><option value="missing">数据缺失</option><option value="stale">数据过期</option></select>
      <div class="stat-line"><span>滴灌观测状态</span><b>{{state?.dataVisual?.flowStatus??'未知'}}</b></div><div class="stat-line"><span>观测流量</span><b>{{state?.dataVisual?.flowM3h?.toFixed(1)??'—'}} m³/h</b></div><p class="card-footnote">半透明管内水流与流光示意供水方向，非真实水流。{{state?.dataVisual?.reducedMotion?'已按系统设置静止显示。':''}}情景切换仅改变当前田块模拟源，其他田块独立运行，不控制真实设备。</p>
     </section>
     <section class="hud-card entity-directory"><div class="card-heading"><h2>设备与温室</h2><span>SELECT ENTITY</span></div><div class="entity-directory-list"><button v-for="entity in state?.interaction?.entities.filter(e=>e.kind==='weather-station'||e.kind==='controller'||e.kind==='greenhouse')??[]" :key="entity.id" class="hud-action" :data-list-entity="entity.id" @click="navigateEntity(entity.id)">{{entity.name}}</button></div></section>
     <section class="hud-card alert-card"><div class="card-heading"><h2>监测提醒</h2><span class="alert-count">{{alerts.length}} 条待关注</span></div><div v-for="alert in alerts" :key="alert.id" class="alert-item" :data-alert="alert.id"><span class="alert-icon">!</span><div><h3>{{alert.title}}</h3><p>{{alert.description}}</p><small>DEMO · {{alert.sourceId}} · {{time(alert.timestamp)}} · 当前有效</small><div class="entity-actions"><button class="hud-action" data-testid="alert-select" @click="navigateEntity(alert.entityId)">查看对象</button><button class="hud-action" data-testid="alert-focus" @click="navigateEntity(alert.entityId,true)">定位查看</button></div></div></div><p v-if="!alerts.length" class="card-footnote">{{stale?'监测数据过期，暂停告警判断':'当前无有效墒情告警'}}</p><p class="card-footnote" role="status">{{navigationMessage}}</p><div class="source-status"><span :class="{'warning-text':stale}"><i class="live-dot"></i>{{stale?'监测数据过期':'模拟数据更新正常'}}</span><time>{{data?time(data.timestamp):'等待采样'}}</time></div><p class="card-footnote">全部监测指标为模拟值；提醒不代表真实农事诊断。</p></section>
    </aside>
   </div>
   <footer class="monitor-footer"><div class="footer-caption"><span>观察视角</span><small>CAMERA PRESETS</small></div><nav class="monitor-shots" aria-label="场景视角"><button v-for="(shot,i) in PARK_SHOTS" :key="shot.id" :data-shot="shot.id" :aria-pressed="!focusing&&state?.shotId===shot.id" @click="goShot(shot.id)"><small>0{{i+1}}</small><span>{{shot.label}}</span></button></nav><button class="hud-action return-home" data-testid="return-overview" @click="showOverview">↖ 返回总览</button></footer>
   <div v-if="state?.runtime==='failed'||state?.map.status==='failed'||state?.error" class="monitor-error" role="alert">{{state?.error??state?.map.lastError?.message??'场景加载失败'}}<button @click="facade()?.retryMap()">重试地图</button></div>
   <div v-if="state?.runtime==='starting'" class="monitor-loading" role="status">正在加载园区场景…</div>
  </template>
 </main>
</template>


