import type {DayPeriod,EnvironmentPreset,Season} from '../app/ports/environment';
import {PARK_ATMOSPHERE,type SkyAppearance} from './park-environment';
export const DEFAULT_ENVIRONMENT:EnvironmentPreset=Object.freeze({season:'summer',period:'day'});
export const SEASON_STYLE:Record<Season,{tree:string;grass:string;mountain:string;strength:number;snow:number}>={
 spring:{tree:'#a2bd67',grass:'#91ad62',mountain:'#92a078',strength:.40,snow:0},
 summer:{tree:'#ffffff',grass:'#ffffff',mountain:'#ffffff',strength:0,snow:0},
 autumn:{tree:'#c58b3f',grass:'#aa9b65',mountain:'#a59a76',strength:.83,snow:0},
 winter:{tree:'#7f8c83',grass:'#8d9685',mountain:'#899795',strength:.72,snow:.86},
};
export const PERIOD_STYLE:Record<DayPeriod,{horizon:string;zenith:string;cloud:string;fog:string;sun:string;sunIntensity:number;hemi:string;ground:string;hemiIntensity:number;environmentIntensity:number;mapBrightness:number;glow:number;direction:[number,number,number]}>={
 day:{horizon:PARK_ATMOSPHERE.horizon,zenith:PARK_ATMOSPHERE.zenith,cloud:'#ffffff',fog:PARK_ATMOSPHERE.fog!.color,sun:'#ffefd5',sunIntensity:3,hemi:'#dcecf7',ground:'#90805f',hemiIntensity:2.6,environmentIntensity:.6,mapBrightness:1,glow:1,direction:[-80,110,60]},
 dusk:{horizon:'#d7a795',zenith:'#485f91',cloud:'#d6a6a0',fog:'#9c8d9c',sun:'#ffc18b',sunIntensity:1.65,hemi:'#a6b4dc',ground:'#665960',hemiIntensity:1.2,environmentIntensity:.28,mapBrightness:.65,glow:1.8,direction:[-120,35,75]},
 night:{horizon:'#283b52',zenith:'#090f26',cloud:'#28374f',fog:'#283c50',sun:'#b5cef7',sunIntensity:1.05,hemi:'#6583af',ground:'#303c46',hemiIntensity:1.0,environmentIntensity:.15,mapBrightness:.23,glow:.10,direction:[40,100,-50]},
};
export function presetSky(period:DayPeriod):SkyAppearance{
 const p=PERIOD_STYLE[period];return {...PARK_ATMOSPHERE,horizon:p.horizon,zenith:p.zenith,cloud:p.cloud,cloudTint:p.cloud,sunDirectionM:p.direction,sunGlow:p.glow,mapBrightness:p.mapBrightness,fog:{...PARK_ATMOSPHERE.fog!,color:p.fog}};
}
