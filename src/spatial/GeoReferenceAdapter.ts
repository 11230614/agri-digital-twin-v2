import { Cartesian3, Cartographic, Ellipsoid, Matrix4, Transforms, Math as CesiumMath } from 'cesium';
import { FARM_GEO_ORIGIN } from '../config/farm-geo-origin';
import type { GeoPoint, Vec3 } from '../shared/contracts/spatial';

export class GeoReferenceAdapter {
  private readonly toEarth: Matrix4;
  private readonly toFarm: Matrix4;
  constructor(origin: GeoPoint = FARM_GEO_ORIGIN) {
    this.validateGeo(origin);
    const enu = Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(origin.longitudeDeg, origin.latitudeDeg, origin.ellipsoidHeightM));
    const axes = new Matrix4(1,0,0,0, 0,0,-1,0, 0,1,0,0, 0,0,0,1);
    this.toEarth = Matrix4.multiply(enu, axes, new Matrix4());
    this.toFarm = Matrix4.inverseTransformation(this.toEarth, new Matrix4());
  }
  getFarmToEcef(): Matrix4 { return Matrix4.clone(this.toEarth); }
  getEcefToFarm(): Matrix4 { return Matrix4.clone(this.toFarm); }
  private validateGeo(g: GeoPoint): void {
    if (![g.longitudeDeg,g.latitudeDeg,g.ellipsoidHeightM].every(Number.isFinite) || Math.abs(g.longitudeDeg)>180 || Math.abs(g.latitudeDeg)>90) throw new Error('无效 WGS84 经纬度');
  }
  private convert(p: Vec3, matrix: Matrix4, vector = false): Vec3 {
    if (!p.every(Number.isFinite)) throw new Error('无效坐标');
    const f = vector ? Matrix4.multiplyByPointAsVector : Matrix4.multiplyByPoint;
    const q = f(matrix,new Cartesian3(...p),new Cartesian3());
    return [q.x,q.y,q.z];
  }
  farmToEcef(p: Vec3): Vec3 { return this.convert(p,this.toEarth); }
  ecefToFarm(p: Vec3): Vec3 { return this.convert(p,this.toFarm); }
  farmVectorToEcef(p: Vec3): Vec3 { return this.convert(p,this.toEarth,true); }
  ecefVectorToFarm(p: Vec3): Vec3 { return this.convert(p,this.toFarm,true); }
  geodeticToFarm(g: GeoPoint): Vec3 {
    this.validateGeo(g);
    const c = Cartesian3.fromDegrees(g.longitudeDeg,g.latitudeDeg,g.ellipsoidHeightM);
    return this.ecefToFarm([c.x,c.y,c.z]);
  }
  farmToGeodetic(p: Vec3): GeoPoint {
    const e = this.farmToEcef(p);
    const c = Ellipsoid.WGS84.cartesianToCartographic(new Cartesian3(...e), new Cartographic());
    if (!c) throw new Error('无效地理位置');
    return { longitudeDeg: CesiumMath.toDegrees(c.longitude), latitudeDeg: CesiumMath.toDegrees(c.latitude), ellipsoidHeightM: c.height };
  }
}
