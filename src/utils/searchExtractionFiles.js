import AmeyaSettingsApi from "../api/services/TemplateServiceApi";

const searchExtractionFiles = async (appflyte_details, file_name) => {
    try {
        const tempArr = [];
        let last_evaluated_key = null;
        do {
            const response = await AmeyaSettingsApi.searchExtractionFiles(appflyte_details, file_name);
            if (response.data) {
                const collectionData = response.data.published_collections_detail.flatMap(collection => response.data[collection.id]);
                if (collectionData) {
                    tempArr.push(...collectionData)
                }
            }
            last_evaluated_key = response.data.last_evaluated_key != null && response.data.last_evaluated_key !== "" ? encodeURIComponent(JSON.stringify(response.data.last_evaluated_key)) : null
        } while (last_evaluated_key !== null);
        return tempArr;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export default searchExtractionFiles;