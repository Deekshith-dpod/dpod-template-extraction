import axios from "axios";

const AxiosObj = axios.create({ responseType: "json" })
const AxiosExtractionObj = axios.create({ responseType: "json" })
const AxiosSchemaObj = axios.create({ responseType: "json" })

const setBaseURL = (base_url) => {
    if (base_url) {
        AxiosObj.defaults.baseURL = base_url;
        AxiosObj.defaults.headers.common['Content-Type'] = 'application/json';
    }
};

const setExtractionBaseURL = (base_url) => {
    if (base_url) {
        AxiosExtractionObj.defaults.baseURL = base_url;
        AxiosExtractionObj.defaults.headers.common['Content-Type'] = 'application/json';
    }
};

const setGenerateSchemaBaseURL = (base_url) => {
    if (base_url) {
        AxiosSchemaObj.defaults.baseURL = base_url;
        AxiosSchemaObj.defaults.headers.common['Content-Type'] = 'multipart/form-data';
    }
};

const setAuthToken = (token) => {
    if (token) {
        AxiosObj.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete AxiosObj.defaults.headers.common['Authorization'];
    }
};

const setAgentApiToken = (token) => {
    if (token) {
        AxiosExtractionObj.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        AxiosSchemaObj.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete AxiosExtractionObj.defaults.headers.common['Authorization'];
        delete AxiosSchemaObj.defaults.headers.common['Authorization'];
    }
};

export {
    AxiosObj, AxiosExtractionObj, AxiosSchemaObj,
    setBaseURL, setExtractionBaseURL, setGenerateSchemaBaseURL,
    setAuthToken, setAgentApiToken
};
