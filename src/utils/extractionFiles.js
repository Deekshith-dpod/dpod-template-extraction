import AmeyaSettingsApi from "../api/services/TemplateServiceApi";

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

 //  const tempArr = []
    // let last_evaluated_key = null
    // try {
    //     do {
    //         const response = await AmeyaSettingsApi.getTemplateSettings(appflyte_details, last_evaluated_key);
    //         if (response.data) {
    //             const collectionData = response.data.published_collections_detail.flatMap(collection => response.data[collection.id]);
    //             if (collectionData) {
    //                 tempArr.push(...collectionData)
    //             }
    //         }
    //         last_evaluated_key = response.data.last_evaluated_key != null && response.data.last_evaluated_key !== "" ? encodeURIComponent(JSON.stringify(response.data.last_evaluated_key)) : null
    //     }
    //     while (last_evaluated_key !== null)
    //     return tempArr;
    // }
    // catch (error) {
    //     console.error(error)
    // }



