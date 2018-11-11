import test from 'ava';
const tjs = require('../dist/tjs.node.common');

test('title', async t => {
    let res = await tjs.google.translate("test").catch(err => console.error(err))
    // console.info("res>>>>>>>>>>>>", res)
    t.is(res.result[0], '测试')
});