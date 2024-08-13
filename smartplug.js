const { default: axios } = require("axios");
const fs = require("fs")

function parseJSONStrings(input) {
    let obj;
    try {
        obj = JSON.parse(input);
    } catch (error) {
        // If parsing fails, return the input as is
        return input;
    }

    if (typeof obj === 'object') {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'string') {
                    try {
                        obj[key] = JSON.parse(obj[key]);
                    } catch (error) {}
                } else if (typeof obj[key] === 'object') {
                    obj[key] = parseJSONStrings(obj[key]);
                }
            }
        }
    }

    return obj;
}

class SmartPlug {
    constructor(cookie, amazonDomain) {
        if (!cookie) {
            throw new Error('No cookie provided.');
        }
        this._cookie = cookie;

        if (!amazonDomain) {
            throw new Error('No Amazon domain provided.');
        }
        this._amazonDomain = amazonDomain;
    }

    async getNetworkDetail() {
        const response = await axios(`https://alexa.${this._amazonDomain}/api/phoenix?includeRelationships=true`, {
            headers: {
                'User-Agent': 'PitanguiBridge/2.2.479076.0-[PLATFORM=Android][MANUFACTURER=][RELEASE=10][BRAND=][SDK=29][MODEL=]',
                'Cookie': this._cookie
            }
        });
        let jsonResponse = {
            networkDetail: parseJSONStrings(response.data.networkDetail)
        }
        // console.log("start", jsonResponse, "end")
        // fs.writeFileSync("out.json", JSON.stringify(jsonResponse))
        return jsonResponse
    }

    async getDevicesAPI() {
        const response = await axios.get(`https://alexa.${this._amazonDomain}/api/behaviors/entities?skillId=amzn1.ask.1p.smarthome`, {
            headers: {
                'User-Agent': 'PitanguiBridge/2.2.479076.0-[PLATFORM=Android][MANUFACTURER=][RELEASE=10][BRAND=][SDK=29][MODEL=]',
                'Cookie': this._cookie
            }
        });
        const jsonResponse = await parseJSONStrings(response.data);
        return jsonResponse
    }

    async getAllDevices() {
        const networkDetails = await this.getDevicesAPI()

        const devices = networkDetails.filter(device => device.providerData.deviceType === 'SMARTPLUG' || device.providerData.deviceType === 'LIGHT')
            .map(device => ({
                id: device.id,
                name: device.displayName,
                description: device.description,
                availability: device.availability
            }));

        return devices;
    }

    async _getApplianceIdFromEntityId(entityId) {
        const networkDetail = (await this.getNetworkDetail()).networkDetail

        const applianceDetails = networkDetail.locationDetails.locationDetails.Default_Location
            .amazonBridgeDetails.amazonBridgeDetails['LambdaBridge_AAA/SonarCloudService'].applianceDetails.applianceDetails;

        if (!applianceDetails) {
            console.log("Cant find appliance details")
            return null
        }

        for (const key in applianceDetails) {
            const applianceDetail = applianceDetails[key];

            if (applianceDetail.entityId === entityId) {
                return applianceDetail.applianceId;
            }
        }

        return null;
    }

    async getState(applianceID) {
        const applianceId = await this._getApplianceIdFromEntityId(applianceID);

        if (applianceId === undefined) {
            console.log("No ID found!")
            return null
        }

        const payload = {
            stateRequests: [{
                entityId: applianceId,
                entityType: 'APPLIANCE'
            }]
        };

        const response = await axios.post(`https://alexa.${this._amazonDomain}/api/phoenix/state`, payload, {
            headers: {
                'Content-Type': 'application/json',
                Cookie: this._cookie
            }
        })

        const capabilityStates = response.data.deviceStates[0].capabilityStates.map(v => JSON.parse(v));
        return capabilityStates.find(v => v.namespace === 'Alexa.PowerController').value === 'ON' ? true : false;
    }


    async setState(applianceID, value) {
        const applianceId = await this._getApplianceIdFromEntityId(applianceID);

        if (applianceId === undefined) {
            console.log("No ID found!")
            return null
        }

        const action = value ? 'turnOn' : 'turnOff';

        const payload = {
            controlRequests: [{
                entityId: applianceID,
                entityType: 'APPLIANCE',
                parameters: {
                    action: action
                }
            }]
        };

        const response = await axios.put(`https://alexa.${this._amazonDomain}/api/phoenix/state`, payload, {
            headers: {
                'Content-Type': 'application/json',
                Cookie: this._cookie
            }
        })

        return response.data
    }
}

module.exports = SmartPlug
