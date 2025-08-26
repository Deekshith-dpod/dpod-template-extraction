import AmeyaSettingsApi from "../api/services/TemplateServiceApi";

export const getExtractionFilebyName = async (appflyte_details, file_name) => {
    const tempArr = [];

    try {
        const response = await AmeyaSettingsApi.searchExtractionFiles(appflyte_details, file_name);

        if (response.data) {
            const collectionData = response.data.published_collections_detail?.flatMap(collection => response.data[collection.id]) ?? [];

            if (collectionData.length) {
                tempArr.push(...collectionData);
            }
        }

        return {
            data: tempArr,
            lastEvaluatedKey: response.data?.last_evaluated_key ?? null
        };
    } catch (error) {
        console.error(error);
        return { data: [], lastEvaluatedKey: null };
    }
};


export const getExtractionFilebyId = async (appflyte_details, file_id) => {
    const tempArr = [];
    try {
        const response = await AmeyaSettingsApi.getExtractionFile(appflyte_details, file_id);
        if (response.data) {
            const collectionData = response.data.published_collections_detail?.flatMap(collection => response.data[collection.id]) ?? [];
            if (collectionData.length) {
                tempArr.push(...collectionData);
            }
        }
        return tempArr;
    } catch (error) {
        console.error(error);
        return [];
    }
};



