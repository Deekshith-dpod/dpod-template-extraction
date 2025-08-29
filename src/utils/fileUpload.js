import moment from "moment";
import FilesApi from "../api/services/FileServiceApi";
import getExtractionFilesData from "./fetchExtractionFiles";

export const saveInBackend = async (appflyte_details, fileName, fileUrl, fileId) => {
    try {
        const reqObj = {
            collection_item: {
                "file_name": fileName,
                "file_id": fileId,
                "file_url": fileUrl,
                "project_id": appflyte_details?.appflyte_project_id,
                "document_type": appflyte_details?.extraction_document_type_id,
                "uploaded_on": moment().format("YYYY-MM-DD HH:MM:SS"),
                "training_status": "Draft",
                "uploaded_via": "API"
            }
        }
        const upload_reponse = await FilesApi.uploadExtractionFile(appflyte_details, JSON.stringify(reqObj));
        return upload_reponse
    } catch (error) {
        return error
    }
}

const uploadFile = async (appflyte_details, blob, reqBody) => {
    try {
        const resData = await FilesApi.getPresignedURL(appflyte_details, JSON.stringify(reqBody))
        if (resData.status === 200) {
            const urlFields = JSON.parse(resData.data.url_fields)
            let formData = new FormData();

            formData.append('key', urlFields.key);
            formData.append('AWSAccessKeyId', urlFields.AWSAccessKeyId);
            formData.append('policy', urlFields.policy);
            formData.append('signature', urlFields.signature);
            formData.append('file', blob);

            const resUpload = await FilesApi.uploadFile(resData.data.url, formData)
            if (resUpload.status === 200 || resUpload.status === 204) {
                return resData?.data?.file_id
            }
            return null
        }
        return null
    } catch (e) {
        console.log('Err ' + e)
        return null
    }
}

const uploadAndAppendForPost = async (appflyte_details, file) => {
    try {
        const reqBodyFile = {
            file_context: 'extraction_files',
            content_type: file?.name?.split('.')[1],
            file_type: '',
            file_name: file?.name,
        }

        const uploadedFileId = await uploadFile(appflyte_details, file, reqBodyFile)
        if (uploadedFileId) {
            const uploadedFileUrl = await FilesApi.getUploadedFileUrls(appflyte_details, uploadedFileId)
            if (uploadedFileUrl.status === 200) {
                return { fileId: uploadedFileId, fileUrl: uploadedFileUrl?.data?.[0]?.download_url }
            }
            return { fileId: null, fileUrl: null }
        }
        return { fileId: null, fileUrl: null }
    }
    catch (err) {
        console.log("ERROR: ", err);
        return { fileId: null, fileUrl: null }
    }
}

export const handleDocumentUpload = async (appflyte_details, file) => {
    try {
        const uploadResponse = await uploadAndAppendForPost(appflyte_details, file);

        if (uploadResponse.fileUrl && uploadResponse.fileId) {
            return {
                status: 200,
                fileUrl: uploadResponse.fileUrl,
                fileId: uploadResponse.fileId,
                fileName: file?.name
            };
        }
        return { status: 404 };
    } catch (err) {
        console.log("ERROR: ", err);
        return { status: 404 };
    }
};

export const fetchAllExtractionFiles = async (appflyte_details, fileLastEvaluatedKey) => {
    try {
        const response = await getExtractionFilesData(appflyte_details, fileLastEvaluatedKey);
        if (response?.data?.length > 0) {
            return response;
        }
        return { data: [], lastEvaluatedKey: null };
    } catch (error) {
        console.log(error)
        return { data: [], lastEvaluatedKey: null };
    }
}