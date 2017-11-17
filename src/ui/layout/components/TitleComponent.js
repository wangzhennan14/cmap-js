/**
 *
 * Base Component, placeholder for other canvas components
 *
 */

import m from 'mithril';
import PubSub from 'pubsub-js';

import {mapReorder} from '../../../topics';

export let TitleComponent = {
  oninit: function(vnode){
    vnode.state = vnode.attrs;
    vnode.state.left = 0;
    vnode.state.domOrder = vnode.state.titleOrder.indexOf(vnode.state.order);
    vnode.state.leftBound = vnode.state.bioMaps[vnode.state.order].domBounds.left;
    vnode.state.rightBound = vnode.state.bioMaps[vnode.state.order].domBounds.right;
    vnode.state.leftStart = vnode.state.bioMaps[vnode.state.order].domBounds.left;
    vnode.state._gestureRegex = {
      pan: new RegExp('^pan')
    };
  },

  oncreate: function(vnode){
    // register mithrilComponent for gesture handling
    vnode.dom.mithrilComponent = this;
    // register functions to state/dom for gesture handling
    vnode.dom.mithrilComponent.handleGesture = vnode.tag.handleGesture;
    vnode.state._onPan = vnode.tag._onPan;
    vnode.state.zIndex = 0;
    this.vnode = vnode;
  },

  onbeforeupdate: function(vnode){
    vnode.state.bioMaps = vnode.attrs.bioMaps;
    if(this.titleOrder[this.order] != this.domOrder){console.log("order eater",this.order, this.domOrder)};
    if(this.titleOrder[this.domOrder] != this.order){
      this.domOrder = this.titleOrder[this.domOrder];
    }
  },

  onupdate: function(vnode){
    let dispOffset = vnode.state.bioMaps[vnode.state.order].domBounds.left - vnode.state.leftStart;
    if (vnode.state.left != dispOffset && !vnode.state.swap){
      this.left = dispOffset;
      this.dirty=true;
    }
    if( vnode.state.swap){
     this.left = 0;
      this.swap = false;
      this.dirty = true;
      this.left = 0;
    }
    if(vnode.state.order === 0 || vnode.state.order === 1){console.log('zero test', this.left);}
    if(this.dirty){ // trigger redraw on changed canvas that has possibly edited bounds in process of view layout
      this.dirty=false;
      m.redraw();
    }
  },

  view: function(vnode){
    if(!vnode.attrs || !vnode.state.contentBounds) return;
    let bMap = vnode.state.bioMaps[vnode.state.order];
    vnode.state.contentBounds.left = vnode.state.contentBounds.right - vnode.state.contentBounds.width;
    let left =  vnode.state.left + vnode.state.contentBounds.left;
    return  m('div', {
      class: 'swap-div', id: `swap-${vnode.state.domOrder}`,
      style: `display:grid; position:relative; left:${left}px; min-width:${bMap.domBounds.width}px; z-index:${vnode.state.zIndex};`},
      [m('div',{class:'map-title',style:'display:inline-block;'}, [bMap.model.name,m('br'),bMap.model.source.id])
      ]
    );
  },

  handleGesture: function(evt){
    if(evt.type.match(this._gestureRegex.pan)){
      return this._onPan(evt);
    }
    return true;
  },

  _onPan: function(evt){
    //Start pan move zIndex up to prevent interrupting pan early
    console.log('swap pan');
    if(evt.type === 'panstart'){
      this.vnode.state.zIndex = 1000; 
      this.lastPanEvent = null;
      this.left = 0;
    }
    //End pan to set rerrangement
    if(evt.type === 'panend') {
      PubSub.publish(mapReorder,null);
      return;
    }

    //Pan the title
    //Calculate map movement
    let delta = {};
    if(this.lastPanEvent) {
      delta.x = -1 * (this.lastPanEvent.deltaX - evt.deltaX);
    } else {
       delta.x = Math.round(evt.deltaX);
    }
    this.left += delta.x
    
    //Setup maps and swap points
    let selLeftEdge = this.left + this.leftStart;
    let selRightEdge = selLeftEdge + this.bioMaps[this.order].domBounds.width;
    const leftMap = this.domOrder > 0 ? this.titleOrder[this.domOrder-1] : -1;
    const rightMap = this.titleOrder[this.domOrder+1] ? this.titleOrder[this.domOrder+1]: -1;
    const leftSwapBound = leftMap !== -1 ? this.leftBound - this.bioMaps[leftMap].domBounds.width : null;
    const rightSwapBound = rightMap !== -1 ? this.leftBound + this.bioMaps[rightMap].domBounds.width : null;
 
    if(leftMap !== -1 && selLeftEdge < leftSwapBound){ // Swap Left
      this.leftBound -= this.bioMaps[leftMap].domBounds.width;
      this.rightBound -= this.bioMaps[leftMap].domBounds.width;
      
      this.titleOrder[this.domOrder] = this.titleOrder[this.domOrder-1];//= this.titleOrder[rightMap];
      this.titleOrder[this.domOrder -1] = this.order;
      //const swap = this.titleOrder[this.domOrder];
      //this.titleOrder[this.domOrder] = this.titleOrder[leftMap];
      //this.titleOrder[leftMap] = swap;

    } else if(rightMap !== -1 && selLeftEdge > rightSwapBound){ // Swap Right
      this.leftBound += this.bioMaps[rightMap].domBounds.width;
      this.rightBound += this.bioMaps[rightMap].domBounds.width;
      
      this.titleOrder[this.domOrder] = this.titleOrder[this.domOrder+1];//= this.titleOrder[rightMap];
      this.titleOrder[this.domOrder +1] =this.order;
    
    } else if (!(leftMap === -1 && selLeftEdge <= 0) && !(rightMap === -1 && selLeftEdge > this.leftBound) ) { //Move current map and its left/right partner
    
      var movedMap = rightMap;
      
      if(selLeftEdge < this.leftBound || (selLeftEdge == this.leftBound && delta.x < 0)){
         movedMap = leftMap;
      }

      let shiftScale = this.bioMaps[this.order].domBounds.width/this.bioMaps[movedMap].domBounds.width;
      this.bioMaps[this.order].domBounds.left += delta.x;
      this.bioMaps[this.order].domBounds.right += delta.x;
      const mw = this.bioMaps[movedMap].domBounds.width;
      this.bioMaps[movedMap].domBounds.left -= delta.x*shiftScale;
      this.bioMaps[movedMap].domBounds.right = this.bioMaps[movedMap].domBounds.left + mw;
    
    } else { // edge case don't move map
    
      this.left -= delta.x;
    
    }

    this.lastPanEvent = evt;
    m.redraw();
    return true;
  }
}

