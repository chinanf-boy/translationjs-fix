
(async () =>{
    const tjs = require('../dist/tjs.node.common');

    console.log(await tjs.google.translate("test").catch(err => console.error(err)))
})();
