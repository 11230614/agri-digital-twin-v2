import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './ui/App.vue';
import CalibrationView from './ui/CalibrationView.vue';
import LeafSampleView from './ui/LeafSampleView.vue';
import SolarSampleView from './ui/SolarSampleView.vue';
import GreenhouseSampleView from './ui/GreenhouseSampleView.vue';
import TomatoSampleView from './ui/TomatoSampleView.vue';
import FieldSampleView from './ui/FieldSampleView.vue';
import UtilitySampleView from './ui/UtilitySampleView.vue';
import InstrumentSampleView from './ui/InstrumentSampleView.vue';
import TreeSampleView from './ui/TreeSampleView.vue';
import ParkSampleView from './ui/ParkSampleView.vue';
import ParkStudyView from './ui/ParkStudyView.vue';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './ui/style.css';

const router=createRouter({history:createWebHashHistory(),routes:[
  {path:'/',redirect:'/samples/park'},
  {path:'/calibration',component:CalibrationView},
  {path:'/samples/leaf',component:LeafSampleView},
  {path:'/samples/solar',component:SolarSampleView},
  {path:'/samples/greenhouse',component:GreenhouseSampleView},
  {path:'/samples/tomato',component:TomatoSampleView},
  {path:'/samples/tree',component:TreeSampleView},
  {path:'/samples/instruments',component:InstrumentSampleView},
  {path:'/samples/utilities',component:UtilitySampleView},
  {path:'/samples/field',component:FieldSampleView},
  {path:'/samples/park',component:ParkSampleView},
  {path:'/diagnostics/park',component:ParkStudyView},
]});
createApp(App).use(createPinia()).use(router).mount('#app');
