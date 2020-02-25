import Number from './Number';

export default class Milliseconds extends Number {
  toString() {
    return `${Math.round(this.value)}ms`;
  }
}
