(function() {
    if (typeof require !== 'undefined') {
        const path = require('path');
        const fs = require('fs');
        window.__resourceRoot = 'file://' + path.resolve(__dirname, '..', 'resources').replace(/\\/g, '/');
        console.log('资源根路径:', window.__resourceRoot);
        
        try {
            const jqueryPath = path.resolve(__dirname, '..', 'resources', 'js', 'jquery.min.js');
            console.log('加载jQuery路径:', jqueryPath);
            const jqueryContent = fs.readFileSync(jqueryPath, 'utf8');
            eval(jqueryContent);
            console.log('jQuery已通过fs加载, $:', typeof $);
        } catch (e) {
            console.error('通过fs加载jQuery失败:', e);
        }
    }
})();