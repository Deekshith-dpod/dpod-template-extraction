import axios from "axios";
import { AxiosObj, setAuthToken, setBaseURL } from "../configurations/axios-setup";
import UpdateHeaders from "./UpdateHeaders";
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
        setBaseURL(appflyte_backend_url);
        setAuthToken(appflyte_backend_url)
    }

    getUploadedFileUrls = async (appflyte_details, fileIds) => {
        await this.initialize(appflyte_details);
        const url = `/api/media/${this.accountId}/subscriber/${this.subscriberId}/subscription/${this.subscriptionId}/${this.schema_id}/generate-upload-url?fileId=${fileIds}`
        const response = await makeCancellableRequest(AxiosObj, { method: 'GET', url });
        return response;
    }

    getPresignedURL = async (appflyte_details, reqObj) => {
        await this.initialize(appflyte_details);
        const url = `/api/media/${this.accountId}/subscriber/${this.subscriberId}/subscription/${this.subscriptionId}/${this.schema_id}/generate-upload-url`
        const response = await makeCancellableRequest(AxiosObj, { method: 'POST', url, data: reqObj });
        return response;
    }

    uploadFile = async (url, reqBody) => {
        return axios.post(url, reqBody)
    }

    uploadExtractionFile = async (appflyte_details, reqObj) => {
        await this.initialize(appflyte_details);
        const url = `/${this.accountId}/api/collection/${this.accountId}/user/public/cm/v1/${this.schema_id}/extraction_filess`
        const response = await makeCancellableRequest(AxiosObj, { method: 'POST', url, data: reqObj });
        return response;
    }

    updateExtractionFile = async (appflyte_details, reqObj, item_Id, updatekey) => {
        await this.initialize(appflyte_details);
        const { hashHex, etagRandomNumber } = await UpdateHeaders(updatekey);
        const url = `/${this.accountId}/api/collection/${this.accountId}/user/public/cm/v1/${this.schema_id}/extraction_files/${item_Id}`
        const response = await makeCancellableRequest(AxiosObj, {
            method: 'PUT', url, data: reqObj,
            headers: { 'etag-hash': hashHex, 'etag-random-number': etagRandomNumber }
        });
        return response;
    }

    deleteExtractionFile = async (appflyte_details, fileId) => {
        await this.initialize(appflyte_details);
        const url = `/api/media/${this.accountId}/subscriber/${this.subscriberId}/subscription/${this.subscriptionId}/${this.schema_id}/file?fileId=${fileId}`
        const response = await makeCancellableRequest(AxiosObj, { method: 'DELETE', url });
        return response;
    }

    deleteExtractionFileEntry = async (appflyte_details, item_Id) => {
        await this.initialize(appflyte_details);
        const url = `/${this.accountId}/api/collection/${this.accountId}/public/user/cm/v1/${this.schema_id}/extraction_files/${item_Id}`
        const response = await makeCancellableRequest(AxiosObj, { method: 'DELETE', url });
        return response;
    }

    getPresignedURLByFilename = async (appflyte_details, reqObj) => {
        await this.initialize(appflyte_details);
        const url = `/api/media/${this.accountId}/subscriber/${this.subscriberId}/subscription/${this.subscriptionId}/${this.schema_id}/generate-upload-url-by-file`
        const response = await makeCancellableRequest(AxiosObj, { method: 'POST', url, data: reqObj });
        return response;
    }

}

const FilesApi = new dpodappFlyteApi();
export default FilesApi;
