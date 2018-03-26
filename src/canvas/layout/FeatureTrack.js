/**
 * FeatureTrack
 * A SceneGraphNode representing a collection of tracks.
 *
 * @extends SceneGraphNodeTrack
 */
import {SceneGraphNodeTrack} from '../node/SceneGraphNodeTrack';
import {Bounds} from '../../model/Bounds';
import {QtlTrack} from './QtlTrack';
import {SceneGraphNodeGroup} from '../node/SceneGraphNodeGroup';
import {QTL} from '../geometry/QTL';
import {ManhattanPlot} from './ManhattanPlot';

export class FeatureTrack extends SceneGraphNodeTrack {

  /**
   * Constructor - sets up a track that's a group of QTL rectangles
   * @param params
   */

  constructor(params) {
    super(params);
    this.model = this.parent.model;
    const b = this.parent.bounds;
    this.trackPos = params.position || 1;

    let left = this.trackPos < 0 ? 10 : this.parent.bbGroup.bounds.right;
    this.bounds = new Bounds({
      allowSubpixel: false,
      top: b.top,
      left: left,
      width: 0,
      height: b.height
    });

    if(this.parent.model.tracks) {
      let tracks = this.trackPos === 1 ? this.parent.tracksLeft : this.parent.tracksRight;
      tracks.forEach((track, order) => {
        // newFeatureTrack is a group with two components, the feature data track, and the feature label track
        let newFeatureTrack = new SceneGraphNodeGroup({parent:this});
        let trackLeft = order === 0 ? 0 : this.children[order-1].bounds.right;
        trackLeft += this.model.config.qtl.padding;
        console.log("trackBreakdow", track,order,trackLeft);
        newFeatureTrack.bounds = new Bounds({
          allowSubpixel: false,
          top: 0,
          left: trackLeft,
          width: this.model.config.qtl.trackMinWidth,
          height: b.height
        });

        newFeatureTrack.model = this.model;

        let featureData = {};
        if(track.type === 'qtl') {
          featureData = new QtlTrack({parent:newFeatureTrack , config: track});
        } else if( track.type = 'manhattan') {
          track.appState = this.parent.appState;
          featureData = new ManhattanPlot({parent:newFeatureTrack, config: track});
        }



        newFeatureTrack.addChild(featureData);
        if(featureData.globalBounds.right > newFeatureTrack.globalBounds.right){
          newFeatureTrack.bounds.right += featureData.bounds.right;
        }

        if(newFeatureTrack.globalBounds.right > this.globalBounds.right){
          console.log('overflow track', newFeatureTrack.globalBounds.right, this.globalBounds.right);
          this.bounds.right =  this.bounds.left + (newFeatureTrack.globalBounds.right - this.globalBounds.left);
          console.log('overflow track post', newFeatureTrack.globalBounds.right, this.globalBounds.right);
        }

        this.addChild(newFeatureTrack);
        console.log('featureTrackTest',this, newFeatureTrack,featureData);

      });
    }

  }

  /**
   *
   */

  get visible() {
    let visible = [];
    console.log('qtlVisible get', this);
    this.children.forEach(child => {
      console.log('qtlVisible get child', child, child.visible);
      visible = visible.concat(child.visible);
    });
    //return visible;
   return visible.concat([{data:this}]); // debugging statement to test track width bounds
  //  //return this.locMap.all();
  }

  /**
   * Debug draw to check track positioning
   * @param ctx
   */

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = .5;
    ctx.fillStyle = '#ADD8E6';
    this.children.forEach(child => {
      let cb = child.globalBounds;
      // noinspection JSSuspiciousNameCombination
      // noinspection JSSuspiciousNameCombination
      ctx.fillRect(
        Math.floor(cb.left),
        Math.floor(cb.top),
        Math.floor(cb.width),
        Math.floor(cb.height)
      );
    });
    //ctx.fillStyle = 'red';
    //let cb = this.globalBounds;
    //ctx.fillRect(
    //  Math.floor(cb.left),
    //  Math.floor(cb.top),
    //  Math.floor(cb.width),
    //  Math.floor(cb.height)
    //);
    ctx.restore();
  }

  /**
   * Get RTree children that are visible in the canvas' current zoom bounds
   * @returns {Array}
   */

  get hitMap() {
    //return [];
    let hits = [];
    let childPos = this.children.map(child => {
      return child.children.map(qtlGroup => {
        return {
          minY: qtlGroup.globalBounds.top,
          maxY: qtlGroup.globalBounds.bottom,
          minX: qtlGroup.globalBounds.left,
          maxX: qtlGroup.globalBounds.right,
          data: qtlGroup
        };
      });
    });
    childPos.forEach(childArray => {
      let children = [];
      childArray.forEach( item => {
        if(item.data.children) children = children.concat(item.data.locMap.all());
      });
        hits = children.length > 0 ? hits.concat(children) : hits.concat(childArray);
      });
      console.log('hits',hits);
      return hits;
  }
}
