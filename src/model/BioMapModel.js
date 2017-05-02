/**
 * BioMap data model
 */
export class BioMapModel {

  constructor({name, uniqueName, features, coordinates = { start: 0, stop: 0} }) {
    this.uniqueName = uniqueName;
    this.name = name;
    this.coordinates = Object.freeze(coordinates); // object w/ start and end props
    this.features = features;
  }

  get length() {
    return this.coordinates.stop - this.coordinates.start;
  }
}
