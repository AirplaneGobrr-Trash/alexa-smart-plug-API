const axios = require("axios").default;

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
        // Cookie: session-id=143-0721757-2562658; session-id-time=2082787201l; ubid-main=133-3854304-2639966; sst-main=Sst1|PQE4FEMD1KJnFnU322ZDbq7rCa9tF-LJ4ORrq51lYW_iLyQHh7lQihs_YaudOEf2zpeVeuAAFgylN-41HacaQ56jAa2ZDcaMl_VtbxJ6pP4paTphgZN2HYDX7H5Ersy0HSTzLv1-1jJU_J9YUqv_91TeIEE-4PW7ZNYn4nn1jBHYTdVCrI7MVrPFXyqM3m827Y7IaTFVay66GdFw4UnAADYi7osln8rSa0rL7s3dgLwYVyih76YOIVizBNPOi1d5q7WG9pjjhRi89zzC95EwMyWwG5DPKVgO4GCrRbrFi6Q1d0E; AMCV_7742037254C95E840A4C98A6%40AdobeOrg=1585540135%7CMCIDTS%7C19880%7CMCMID%7C05284008687270434080342980655488712239%7CMCAAMLH-1718222586%7C9%7CMCAAMB-1718222586%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1717624986s%7CNONE%7CMCSYNCSOP%7C411-19887%7CMCAID%7CNONE%7CvVersion%7C4.4.0; aws-target-visitor-id=1702275292874-590486.45_0; aws-target-data=%7B%22support%22%3A%221%22%7D; regStatus=pre-register; aws-ubid-main=621-1065477-3684365; s_nr=1708838296883-Repeat; s_vnum=2136319751658%26vn%3D5; s_dslv=1708838296883; session-token=/jCinICHVDcyt0CuSYcXxVuLdBMWRInBYXmYL8b4Y8ZBoa6E0d1O/NMvpg0QUJcoPV094sYTR5DSoeR8zdCnQrLa/BrX+VpGAQHvGcJaGzRJcDluWKLHstB9rlgqUmUJB0OnsJ4oneY41reRxDLS2BERU6h84WS/py9OblDEsCJvcQpY8nyayPp8xNOavmnJyg85z3+D/9x3NRCaaAktpUd/ff8S1EtaVZPc8G4tgOK57hgkgd/KpxfrN0CN2LB4TCcCtLdRpkSIj0dq+rjRaqu/B151Yexdffz17ygIypTYX8f9qFXA92KW4YzZRwmuWa64R0k5P62OMGNisZxamEErdPbx6KwoKU4p66qGzAFOlX5PA/daOpSSBuppCuTf; lc-main=en_US; i18n-prefs=USD; x-main=A8J2o3GPtu4wdasjaLqepUdl82UghObgyIF9gD7nQVo@FDfHtX0m3Ss?akrNMKlw; at-main=Atza|IwEBICZT3xwrTDWQjrj-8vdZ9tBss6nrxp0j9_CmF8aJbgVs4taisADX-j0FFkJhe2wjDAQAuwIkn26Dtg3nT9C2bpw0KCmihIxFh7BAosFmo0Fa1puteGIGJEtnS9G9lHLx4Miwu8q867Fx5dfyOOlHYfX-vqVJ5CM93arr_G3RdQcP7plrzxHkZjek-FEhVkWhqh7QKIC0BwEhpTicYBxZsZHCnjFKKP4Db9CGQIPpqYrRpg; sess-at-main="U2jl9sBSpAcCcJopSiQ4yaZXxUrSDwrijZhgVBsfP98="; s_cc=true; s_sq=%5B%5BB%5D%5D; s_ppv=0; skin=noskin; aws_lang=en; AMCVS_7742037254C95E840A4C98A6%40AdobeOrg=1; aws-mkto-trk=id%3A112-TZM-766%26token%3A_mch-aws.amazon.com-1708736752213-59782
        cookie = decodeURI(cookie.replace("Cookie: ", "").split("\n").shift()) // Replace `Cookie: `, new lines and decode string

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

    async getAllDevices(ignoreType = false) {
        const networkDetails = await this.getDevicesAPI()

        let rawDevices = networkDetails
        if (!ignoreType) rawDevices = rawDevices.filter(device => device.providerData.deviceType === 'SMARTPLUG' || device.providerData.deviceType === 'LIGHT')

        const devices = rawDevices.map(device => ({
                id: device?.id,
                name: device?.displayName,
                description: device?.description,
                availability: device?.availability
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

        if (response.data?.deviceStates[0]?.capabilityStates) {
            const capabilityStates = response.data.deviceStates[0].capabilityStates.map(v => JSON.parse(v));
            return capabilityStates.find(v => v.namespace === 'Alexa.PowerController').value === 'ON';
        }
        return null;
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
