const fetch = require('node-fetch');

(async () => {
    try {
        const res = await fetch("http://codemate-alb-2021719423.us-east-1.elb.amazonaws.com/api/code/languages");
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text.substring(0, 200));
    } catch (e) {
        console.error("Fetch error:", e);
    }
})();
