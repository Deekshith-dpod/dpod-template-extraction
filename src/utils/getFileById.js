import AmeyaSettingsApi from "../api/services/TemplateServiceApi";

const getExtractionFile = async (appflyte_details, file_id) => {
    try {
        const tempArr = [];
        let last_evaluated_key = null;
        do {
            const response = await AmeyaSettingsApi.getExtractionFileById(appflyte_details, file_id, last_evaluated_key);
            if (response.data) {
                if (response.data.published_collections_detail?.length > 0) {
                    const collectionData = response.data.published_collections_detail.flatMap((collection) => response.data[collection.id] || []);
                    if (collectionData.length > 0) {
                        tempArr.push(...collectionData);
                    }
                    return tempArr;
                }
            }
            last_evaluated_key = response.data.last_evaluated_key != null && response.data.last_evaluated_key !== "" ? encodeURIComponent(JSON.stringify(response.data.last_evaluated_key)) : null;
        } while (last_evaluated_key !== null);

        return tempArr;
    } catch (error) {
        console.log(error);
        return [];
    }
};

export default getExtractionFile;