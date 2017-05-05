/**
  * UI
  * A mithril component presenting all DOM aspects of user-interface.
  */
import m from 'mithril';
import Hammer from 'hammerjs';
import Hamster from 'hamsterjs';
import {mix} from '../../mixwith.js/src/mixwith';

//import {Tools} from './tools/Tools';
import {Header} from './Header';
import {StatusBar} from './StatusBar';
import {LayoutContainer} from './layout/LayoutContainer';
import {RegisterComponentMixin} from './RegisterComponentMixin';

export class UI extends mix().with(RegisterComponentMixin) {

  /**
   * Create a UI instance
   * @param Object - the appState, instance of model/AppModel.
   */
  constructor(appState) {
    super();
    this.appState = appState;
  }

  /**
   * mithril lifecycle method
   */
  oncreate(vnode) {
    super.oncreate(vnode);
    this.el = vnode.dom;
    this._setupEventHandlers(this.el);
  }

  /**
   * mithril component render callback
   */
  view(vnode) {
    let srcAttrs = vnode.attrs || {};
    let attrs = Object.assign({class: 'cmap-layout cmap-vbox'}, srcAttrs);
    let childAttrs = {
      appState: this.appState,
    };
    this._logRenders();
    return m('div',
      attrs,
      vnode.children && vnode.children.length ?
        vnode.children : [
          //m(Tools, childAttrs)
          m(Header, childAttrs),
          m('div', { class: 'cmap-layout-viewport cmap-hbox'},
            m(LayoutContainer, {
              appState: this.appState,
              registerComponentCallback: (comp) => this._layoutContainer = comp
            })
          ),
          m(StatusBar, childAttrs)
        ]
    );
  }

  _logRenders() {
    if(! this.count) this.count = 0;
    this.count += 1;
    console.log(`*** mithril render #${this.count} ***`);
  }

  _setupEventHandlers() {
    this._setupMousewheel();
    this._setupGestures();
  }

  /**
   * setup mouse wheel (hamsterjs) handlers.
   */
  _setupMousewheel() {
    const hamster = Hamster(this.el);
    const hamsterHandler = (evt, delta, deltaX, deltaY) => {
      // hamsterjs claims to normalizizing the event object, across browsers,
      // but at least in firefox it is not because deltaY is not on the evt.
      evt.deltaY = deltaY; // workaround
      // add an additional property to make it similar enough to the pinch
      // gesture so event consumers can just implement one 'zoom', if they want.
      evt.center = { x: evt.originalEvent.x, y: evt.originalEvent.y };
      this._dispatchGestureEvt(evt);
    };
    hamster.wheel(hamsterHandler);
  }

  /**
   * setup gesture (hammerjs) handlers.
   */
  _setupGestures() {
    const hammer = Hammer(this.el);
    const hammerHandler = (evt) => this._dispatchGestureEvt(evt);
    const hammerEvents = 'panmove panend pinchmove pinchend tap';
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    hammer.get('pinch').set({ enable: true });
    hammer.on(hammerEvents, hammerHandler);
  }

  /**
    * Custom dispatch of ui events. Layout elements like BioMap and
    * CorrespondenceMap are visually overlapping, and so do not fit cleanly into
    * the js event capture or bubbling phases. Query the dom at the events
    * coordinates, and dispatch the event to child who
    * a) intersects with this point
    * b) wants to handle this event (it can decide whether to based on it's
    *    canvas own scenegraph contents, etc.)
    */
  _dispatchGestureEvt(evt) {
    let hitElements = document.elementsFromPoint(evt.center.x, evt.center.y);
    let filtered = hitElements.filter( el => {
      return (el.mithrilComponent && el.mithrilComponent.handleGesture);
    });
    // dispatch event to all the mithril components, until one returns true;
    // effectively the same as 'stopPropagation' on a normal event bubbling.
    filtered.some( el => el.mithrilComponent.handleGesture(evt) );
  }

  /**
   * Gesture event recapture and force upon the LayoutContainer. This is to
   * prevent the the layout container from missing events after it has partially
   * moved out of the viewport.
   */
  handleGesture(evt) {
    this._layoutContainer.handleGesture(evt);
  }

}
