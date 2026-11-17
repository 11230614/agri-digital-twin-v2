/** User-confirmed explicit bindings; never infer ownership from an ID suffix. */
export const CONTROLLER_BINDINGS:Record<string,{name:string;plotId:string}>={
 'controller-01':{name:'一号控制柜',plotId:'plot-01'},'controller-02':{name:'二号控制柜',plotId:'plot-02'},'controller-03':{name:'三号控制柜',plotId:'plot-03'},
};
export const WEATHER_BINDINGS:Record<string,{name:string;scope:'park'}>={
 'weather-01':{name:'一号气象站',scope:'park'},'weather-02':{name:'二号气象站',scope:'park'},'weather-03':{name:'三号气象站',scope:'park'},
};
export const GREENHOUSE_NAMES:Record<string,string>={'greenhouse-01':'一号温室','greenhouse-02':'二号温室','greenhouse-03':'三号温室'};
