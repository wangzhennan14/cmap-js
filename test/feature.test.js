import {expect, assert} from 'chai';
import {Feature, featuresInCommon} from '../src/util/Feature';

describe('Feature test', () => {
  let params = {
    name: 'test feature',
    tags: ['hilite', 'etc'],
    aliases: ['foo', 'feature 123'],
    coordinates: {
      start: 10,
      end: 10
    }
  };

  it('constructor works', () => {
    let f = new Feature(params);
    expect(f).eql(params);
  });

  it('length()', () => {
    let f = new Feature(params);
    expect(f.length).to.equal(0);
    let p1 = Object.assign(params, {
      aliases: [],
      coordinates: { start: 100, end: 142 }
    });
    f = new Feature(p1);
    expect(f.length).to.equal(42);
  });

  it('featuresInCommon()', () => {
    let features1 = [], features2 = [];
    for (var i = 1; i <= 10; i++) {
      let name = `feature ${i}`;
      let p1 = Object.assign(params, { name });
      features1.push(new Feature(p1));
    }
    for (var i = 8; i <= 15; i++) {
      let name = `feature ${i}`;
      let p1 = Object.assign(params, { name });
      features2.push(new Feature(p1));
    }
    let res = featuresInCommon(features1, features2);
    expect(res.length).to.equal(3);
    expect(res.map( feature => feature.name)).eql(
      [
        'feature 8',
        'feature 9',
        'feature 10'
      ]);
  });

  it('featuresInCommon() with aliases', () => {
    let features1 = [], features2 = [];
    for (var i = 1; i <= 10; i++) {
      let name = `feature ${i}`;
      let aliases = [`foo ${i}`, `bar ${i}`];
      let p = Object.assign(params, { name, aliases });
      features1.push(new Feature(p));
    }
    for (var i = 8; i <= 15; i++) {
      let name = `misnamed feature xxx${i}`;
      let aliases = [`foo ${i}`, `bling ${i}`];
      let p = Object.assign(params, { name, aliases });
      features2.push(new Feature(p));
    }
    let res = featuresInCommon(features1, features2);
    expect(res.length).to.equal(3);
    expect(res.map( feature => feature.name)).eql(
      [
        'feature 8',
        'feature 9',
        'feature 10'
      ]);
  });  
});
