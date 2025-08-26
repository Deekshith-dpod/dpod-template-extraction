import { AxiosObj, setAuthToken, setBaseURL, setAgentApiToken } from "../configurations/axios-setup";
import { makeCancellableRequest } from "./CancelApi";

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
        const appflyte_dpod_token = appflyte_details.appflyte_dpod_token;
        const appflyte_agent_api_token = appflyte_details.appflyte_agent_api_token;

        setBaseURL(appflyte_backend_url);
        setAuthToken(appflyte_dpod_token);
        setAgentApiToken(appflyte_agent_api_token)
    }

    getExtractionTasks = async (appflyte_details, fileId, last_evaluated_key) => {
        await this.initialize(appflyte_details);
        const queryObj = [{
            field_name: "payload.file_id",
            field_value: fileId,
            operator: "eq"
        }]
        const filter = encodeURIComponent(JSON.stringify(queryObj))
        const url = `/${this.accountId}/api/collection/${this.accountId}/user/public/cm/v1/${this.schema_id}/extraction_tasks?filters=${filter}&last_evaluated_key=${last_evaluated_key}&page_size=50&include_detail=false`
        const response = await makeCancellableRequest(AxiosObj, { method: 'GET', url });
        return response;
    }

    getDownloadUrl = async (appflyte_details, object_paths) => {
        await this.initialize(appflyte_details);
        const bucket_name = 'dpod-ai';
        const url = `/api/media/${this.accountId}/subscriber/${this.subscriberId}/subscription/${this.subscriptionId}/generate-download-url?bucket_name=${bucket_name}&object_paths=${object_paths}`
        const response = await makeCancellableRequest(AxiosObj, { method: 'POST', url });
        return response;
    }

}

const AppflyteServiceApi = new dpodappFlyteApi();
export default AppflyteServiceApi;