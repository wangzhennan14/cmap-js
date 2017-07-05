/**
  * QTL - A feature with a length and width drawn as part of a group of similar
  * features
  *
  */
import {SceneGraphNodeBase} from '../node/SceneGraphNodeBase';
import {Bounds} from '../../model/Bounds';

export class QTL extends SceneGraphNodeBase {

  constructor({parent, bioMap, featureModel,fill}) {
    super({parent, tags: [featureModel.name]});
    this.model = featureModel;
    this.featureMap = bioMap;
    this.lineWidth = 1.0;
    this.pixelScaleFactor = this.featureMap.view.pixelScaleFactor;
    //min and max location in pixels
    this.startLoc = this._translateScale(this.featureMap.view.visible.start) * this.pixelScaleFactor;
    this.stopLoc = this._translateScale(this.featureMap.view.visible.stop) * this.pixelScaleFactor;
    this.fill = fill || 'darkBlue'; 
    // Calculate start/end position, then
    // Iterate across QTLs in group and try to place QTL region where it can
    // minimize stack width in parent group 
    let y1 = this._translateScale(this.model.coordinates.start) * this.pixelScaleFactor;
    let y2 = this._translateScale(this.model.coordinates.stop) * this.pixelScaleFactor;
    let leftLoc = 0;
    let leftArr = [];
    this.parent.locMap.search({
      minY: this.model.coordinates.start,
      maxY: this.model.coordinates.stop,
      minX: 0,
      maxX:1000
    }).forEach(overlap => {
      if(overlap.data){
        if(overlap.data.bounds.right > leftLoc){
          leftLoc = overlap.data.bounds.right+1;
        }
        leftArr.push(overlap.data.bounds.left);
      }
    });
    leftArr = leftArr.sort((a,b)=>{return a-b;});
    for( let i = 0; i < leftArr.length; ++i){
      if( leftArr[i] !== i*11){
        leftLoc = i*11;
        break;
      }
    }

    this.bounds = new Bounds({
      allowSubpixel: false,
      top: y1,
      left: leftLoc,
      width: 10,
      height: y2-y1
    });
  }

  draw(ctx) {
    // Get start and stop of QTL on current region, if it isn't located in
    // current view, don't draw, else cutoff when it gets to end of currently
    // visible region.
    let y1 = this._translateScale(this.model.coordinates.start) * this.pixelScaleFactor;
    let y2 = this._translateScale(this.model.coordinates.stop) * this.pixelScaleFactor;
    if (y2 < this.startLoc || y1 > this.stopLoc) return;
    if (y1 < this.startLoc) y1 = this.startLoc;
    if (y2 > this.stopLoc) y2 = this.stopLoc;
    //setup bounds and draw
    this.bounds = new Bounds({
      top: y1,
      height: y2-y1,
      left: this.bounds.left,
      width: 10
    });
    let gb = this.globalBounds || {};
    ctx.fillStyle = this.fill;
    ctx.fillRect(
      Math.floor(gb.left),
      Math.floor(gb.top),
      Math.floor(10),
      Math.floor(gb.height)
    );

    // Draw any children
    this.children.forEach( child => child.draw(ctx));
  }

  _translateScale(point){
    let coord = this.featureMap.view.base;
    let vis = this.featureMap.view.visible;
    return (coord.stop - coord.start)*(point-vis.start)/(vis.stop-vis.start)+coord.start;
  }
}
