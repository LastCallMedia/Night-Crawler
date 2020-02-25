import Number from './Number';

export default class Percent extends Number {
  toString() {
    return `${Math.round(this.value * 100)}%`;
  }
}
