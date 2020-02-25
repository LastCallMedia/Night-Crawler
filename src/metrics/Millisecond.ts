import Number from './Number';

export default class Milliseconds extends Number {
  toString(): string {
    return `${Math.round(this.value)}ms`;
  }
}
