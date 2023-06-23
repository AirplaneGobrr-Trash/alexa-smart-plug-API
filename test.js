const SmartPlugBuilder = require("./smartplug")
const { cookies, domain } = require("./config")
const smartplug = new SmartPlugBuilder(cookies, domain);

(async ()=>{
    const devices = await smartplug.getAllDevices()
    console.log(devices)
    let out = await smartplug.setState(devices[0].id, true)
    console.log(out)
    let state = await smartplug.getState(devices[0].id)
    console.log(state)
})();