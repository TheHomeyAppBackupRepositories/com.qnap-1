module.exports = {
    async clearLog({ homey, body })
    {
        homey.app.diagLog = "";
        return "OK";
    },
    async getLog({ homey, query })
    {
        return homey.app.diagLog;
    }
};