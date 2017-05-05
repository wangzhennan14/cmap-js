/**
  * QtlTrack 
  * A SceneGraphNode representing a collection of QTLs.
  */
import {SceneGraphNodeTrack} from './SceneGraphNodeTrack';
import { Group } from './SceneGraphNodeGroup';
import {Bounds} from '../model/Bounds';
import {QTL} from './QTL';
import {FeatureMark} from './FeatureMark';
import {MapBackbone} from './MapBackbone';

export class  QtlTrack extends SceneGraphNodeTrack {

  constructor(params) {
    super(params);
    console.log('mapTrack',this.parent);
    const b = this.parent.bounds;
    const backboneWidth = b.width * 0.25;
    this.bounds = new Bounds({
      allowSubpixel: false,
      top: b.height * 0.025,
      left: this.parent.backbone.bounds.left - 10,
      width: backboneWidth*.75,
      height: b.height * 0.95
    });
    this.mapCoordinates = this.parent.mapCoordinates;
    this.backbone = new MapBackbone({ parent: this});	
    this.addChild(this.backbone);

    let qtlGroup = new Group({parent:this});
    this.addChild(qtlGroup);
    this.qtlGroup = qtlGroup;

    qtlGroup.bounds = this.bounds;
    //console.log('QTL set', this.parent.model.features.filter(model => {
    //  return model.length > 1 }))
    this.filteredFeatures = this.parent.model.features.filter( model => {
      return model.length > 1;
    });
    console.log('filtered features', this.filteredFeatures);
    let fmData = [];
    this.qtlMarks = this.filteredFeatures.map( model => {
      let fm = new QTL ({
        featureModel: model,
        parent: qtlGroup,
        bioMap: this.parent.model
      });
      qtlGroup.addChild(fm);
        let loc = {
          minY: model.coordinates.start,
        maxY: model.coordinates.stop,
        minX: fm.globalBounds.left,
        maxX: fm.globalBounds.right,
        data:fm
        };
      qtlGroup.locMap.insert(loc);

      fmData.push(loc);
      return fm;
    });

    this.locMap.load(fmData);
    console.log('visible qtls',this.visible);
  }

  get visible(){
    return this.locMap.all();
    //return this.locMap.search({
    //  minX: this.bounds.left,
    //  maxX: this.bounds.right,
    //  minY: this.mapCoordinates.visible.start,
    //  maxY: this.mapCoordinates.visible.stop
    //});
  }

  get hitMap(){
    return [];
    let bbGb = this.backbone.globalBounds;
    return this.children.map( child =>{
      return {
        minY: child.globalBounds.bottom,
        maxY: child.globalBounds.top,
        minX: bbGb.left ,
        maxX: bbGb.right ,
        data: child
      }
    });
  }
}
