import AmeyaSettingsApi from "../api/services/TemplateServiceApi";
const getExtractionFilesData = async (appflyte_details, fileLastEvaluatedKey) => {
    const tempArr = [];
    const page_size = 100;

    try {
        const response = await AmeyaSettingsApi.getExtractionFiles(appflyte_details, fileLastEvaluatedKey, page_size);
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



export default getExtractionFilesData;




