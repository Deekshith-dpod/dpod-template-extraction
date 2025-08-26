import axios from "axios";
import {
    AxiosObj, AxiosExtractionObj, AxiosSchemaObj, setAuthToken,
    setBaseURL, setGenerateSchemaBaseURL, setExtractionBaseURL, setAgentApiToken
} from "../configurations/axios-setup";
import { makeCancellableRequest } from "./CancelApi";
import UpdateHeaders from "./UpdateHeaders";

class dpodappFlyteApi {

    constructor() {
        this.accountId = null;
        this.subscriberId = null;
        this.subscriptionId = null;
        this.schema_id = null;
    }

    async initialize(appflyte_details) {
        this.accountId = appflyte_details.appflyte_account_id;
        this.subscriberId = appflyte_details.appflyte_subscriber_id;
        this.subscriptionId = appflyte_details.appflyte_subscription_id;
        this.schema_id = appflyte_details.appflyte_schema_id;

        const appflyte_backend_url = appflyte_details.appflyte_backend_url;
        const appflyte_extraction_url = appflyte_details.appflyte_extraction_url;
        const appflyte_dpod_token = appflyte_details.appflyte_dpod_token;
        const appflyte_agent_api_token = appflyte_details.appflyte_agent_api_token;

        setBaseURL(appflyte_backend_url);
        setExtractionBaseURL(appflyte_extraction_url)
        setGenerateSchemaBaseURL(appflyte_extraction_url)
        setAuthToken(appflyte_dpod_token);
        setAgentApiToken(appflyte_agent_api_token)
    }

    getConfigSettings = async (appflyte_backend_url) => {
        const response = await axios.get(`${appflyte_backend_url}/api/extraction/extraction-config`)
        return response;
    }

    addTemplateSettings = async (appflyte_details, reqObj) => {
        await this.initialize(appflyte_details);
        const url = `/${this.accountId}/api/collection/${this.accountId}/user/public/cm/v1/${this.schema_id}/extraction_schemas`
        const response = await makeCancellableRequest(AxiosExtractionObj, { method: 'POST', url, data: reqObj });
        return response;
    }

    updateTemplateSettings = async (appflyte_details, reqObj, item_Id, updatekey) => {
        await this.initialize(appflyte_details);
        const { hashHex, etagRandomNumber } = await UpdateHeaders(updatekey);
        const url = `/${this.accountId}/api/collection/${this.accountId}/user/public/cm/v1/${this.schema_id}/extraction_schema/${item_Id}`
        const response = await makeCancellableRequest(AxiosObj, {
            method: 'PUT', url, data: reqObj,
            headers: { 'etag-hash': hashHex, 'etag-random-number': etagRandomNumber }
        });
        return response;
    }

    getTemplateSettings = async (appflyte_details, last_evaluated_key) => {
        await this.initialize(appflyte_details);
        const extraction_document_type_id = appflyte_details?.extraction_document_type_id;

        const queryObj = [{
            field_name: "payload.document_type",
            field_value: extraction_document_type_id,
            operator: "eq"
        }]
        const filter = encodeURIComponent(JSON.stringify(queryObj))
        const url = `/${this.accountId}/api/collection/${this.accountId}/user/public/cm/v1/${this.schema_id}/extraction_schemas?filters=${filter}&last_evaluated_key=${last_evaluated_key}&page_size=50&include_detail=false`
        const response = await makeCancellableRequest(AxiosObj, { method: 'GET', url });
        return response;
    }

    getDocumentTypes = async (appflyte_details, last_evaluated_key) => {
        await this.initialize(appflyte_details);
        const extraction_document_type_id = appflyte_details?.extraction_document_type_id;
        const queryObj = [{
            field_name: "payload.__auto_id__",
            field_value: extraction_document_type_id,
            operator: "eq"
        }]
        const filter = encodeURIComponent(JSON.stringify(queryObj))
        const url = `/${this.accountId}/api/collection/${this.accountId}/user/public/cm/v1/${this.schema_id}/extraction_document_typess?filters=${filter}&last_evaluated_key=${last_evaluated_key}&page_size=50&include_detail=false`
        const response = await makeCancellableRequest(AxiosObj, { method: 'GET', url });
        return response;
    }

    updateMasterTemplateSettings = async (appflyte_details, reqObj, item_Id, updatekey) => {
        await this.initialize(appflyte_details);
        const { hashHex, etagRandomNumber } = await UpdateHeaders(updatekey);
        const url = `/${this.accountId}/api/collection/${this.accountId}/user/public/cm/v1/${this.schema_id}/extraction_master_template/${item_Id}`
        const response = await makeCancellableRequest(AxiosObj, {
            method: 'PUT', url, data: reqObj,
            headers: { 'etag-hash': hashHex, 'etag-random-number': etagRandomNumber }
        });
        return response;
    }

    // getExtractionFiles = async (appflyte_details, last_evaluated_key) => {
    //     await this.initialize(appflyte_details);
    //     const extraction_document_type_id = appflyte_details?.extraction_document_type_id;
    //     const queryObj = [{
    //         field_name: "payload.document_type",
    //         field_value: extraction_document_type_id,
    //         operator: "eq"
    //     }]
    //     const filter = encodeURIComponent(JSON.stringify(queryObj))
    //     const url = `/${this.accountId}/api/collection/${this.accountId}/user/public/cm/v1/${this.schema_id}/extraction_filess?filters=${filter}&last_evaluated_key=${last_evaluated_key}&page_size=50&include_detail=false`
    //     const response = await makeCancellableRequest(AxiosObj, { method: 'GET', url });
    //     return response;
    // }

    getExtractionFiles = async (appflyte_details, last_evaluated_key, page_size) => {
        await this.initialize(appflyte_details);
        // const extraction_document_type_id = appflyte_details?.extraction_document_type_id;
        // const queryObj = [{
        //     field_name: "payload.document_type",
        //     field_value: extraction_document_type_id,
        //     operator: "eq"
        // }]
        // const filter = encodeURIComponent(JSON.stringify(queryObj))
        const url = `/${this.accountId}/api/collection/${this.accountId}/user/public/cm/v1/${this.schema_id}/extraction_filess?filters=null&last_evaluated_key=${last_evaluated_key}&page_size=${page_size}&include_detail=false`
        const response = await makeCancellableRequest(AxiosObj, { method: 'GET', url });
        return response;
    }

    searchExtractionFiles = async (appflyte_details, file_name) => {
        await this.initialize(appflyte_details);
        const queryObj = [{
            field_name: "payload.file_name",
            field_value: file_name,
            operator: "eq"
        }]
        const filter = encodeURIComponent(JSON.stringify(queryObj))
        const url = `/${this.accountId}/api/collection/${this.accountId}/user/public/cm/v1/${this.schema_id}/extraction_filess?filters=${filter}&last_evaluated_key=null&page_size=50&include_detail=false`
        const response = await makeCancellableRequest(AxiosObj, { method: 'GET', url });
        return response;
    }

    getExtractionFile = async (appflyte_details, file_id) => {
        await this.initialize(appflyte_details);
        const queryObj = [{
            field_name: "payload.__auto_id__",
            field_value: file_id,
            operator: "eq"
        }]
        const filter = encodeURIComponent(JSON.stringify(queryObj))
        const url = `/${this.accountId}/api/collection/${this.accountId}/user/public/cm/v1/${this.schema_id}/extraction_filess?filters=${filter}&last_evaluated_key=null&page_size=50&include_detail=false`
        const response = await makeCancellableRequest(AxiosObj, { method: 'GET', url });
        return response;
    }


    // Extraction Handling Api's
    startExtraction = async (appflyte_details, reqObj, pipeline_id) => {
        await this.initialize(appflyte_details);
        const url = `/user/subscriber/${this.subscriberId}/subscription/${this.subscriptionId}/function/pipeline/event/execute?pipeline_id=${pipeline_id}`
        const response = await makeCancellableRequest(AxiosExtractionObj, { method: 'POST', url, data: reqObj });
        return response;
    }

    getPipelineStatus = async (appflyte_details, pipeline_exec_id) => {
        await this.initialize(appflyte_details);
        const url = `/user/subscriber/${this.subscriberId}/subscription/${this.subscriptionId}/function/pipeline/event/status?pipeline_exec_id=${pipeline_exec_id}`
        const response = await makeCancellableRequest(AxiosExtractionObj, { method: 'GET', url });
        return response;
    }

    fetchLayout = async (appflyte_details, reqObj, source_filename) => {
        await this.initialize(appflyte_details);
        const url = `/user/subscriber/${this.subscriberId}/subscription/${this.subscriptionId}/function/extraction/event/fetch-layout?source_filename=${encodeURIComponent(source_filename)}`
        const response = await makeCancellableRequest(AxiosExtractionObj, { method: 'POST', url, data: reqObj });
        return response;
    }

    fetchLayoutV1 = async (appflyte_details, reqObj, source_filename) => {
        await this.initialize(appflyte_details);
        const url = `/user/subscriber/${this.subscriberId}/subscription/${this.subscriptionId}/function/extraction/event/fetch-entities-v2?source_filename=${encodeURIComponent(source_filename)}`
        const response = await makeCancellableRequest(AxiosExtractionObj, { method: 'POST', url, data: reqObj });
        return response;
    }

    // Schema Handling Api's
    generateSchema = async (appflyte_details, reqObj) => {
        await this.initialize(appflyte_details);
        const url = `/user/subscriber/${this.subscriberId}/subscription/${this.subscriptionId}/function/schema/event/generate-schema`
        const response = await makeCancellableRequest(AxiosSchemaObj, { method: 'POST', url, data: reqObj });
        return response;
    }

    validateSchema = async (appflyte_details, reqObj) => {
        await this.initialize(appflyte_details);
        const url = `/user/subscriber/${this.subscriberId}/subscription/${this.subscriptionId}/function/schema/event/validate-schema`
        const response = await makeCancellableRequest(AxiosSchemaObj, { method: 'POST', url, data: reqObj });
        return response;
    }

    getfieldDetails = async (appflyte_details, reqObj) => {
        await this.initialize(appflyte_details);
        const url = `/user/subscriber/${this.subscriberId}/subscription/${this.subscriptionId}/function/schema/event/getfieldDetails`
        const response = await makeCancellableRequest(AxiosSchemaObj, { method: 'POST', url, data: reqObj });
        return response;
    }
}

const AmeyaSettingsApi = new dpodappFlyteApi();
export default AmeyaSettingsApi;