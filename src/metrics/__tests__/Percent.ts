import Percent from "../Percent";

describe('Percent', function() {
    const m = new Percent('foo', 1, 2);
    it('Should set the displayName', function() {
        expect(m.displayName).toEqual('foo');
    });
    it('Should set the value', function() {
        expect(m.level).toEqual(1);
    });
    it('Should set the value', function() {
        expect(m.value).toEqual(2);
    });
    it('Should format it as a percentage', function() {
        expect(m.toString()).toEqual('200%');
    });
});
