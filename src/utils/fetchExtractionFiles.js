import AmeyaSettingsApi from "../api/services/TemplateServiceApi";

// const getExtractionFilesData = async (appflyte_details) => {
//     const tempArr = []
//     let last_evaluated_key = null

//     try {
//         do {
//             const response = await AmeyaSettingsApi.getExtractionFiles(appflyte_details, last_evaluated_key);
//             if (response.data) {
//                 const collectionData = response.data.published_collections_detail?.flatMap(collection => response.data[collection.id]) ?? [];
//                 if (collectionData) {
//                     tempArr.push(...collectionData)
//                 }
//             }
//             last_evaluated_key = response.data.last_evaluated_key != null && response.data.last_evaluated_key !== "" ? encodeURIComponent(JSON.stringify(response.data.last_evaluated_key)) : null
//         }
//         while (last_evaluated_key !== null)
//         return tempArr;
//     }
//     catch (error) {
//         console.error(error)
//     }
// }


const getExtractionFilesData = async (appflyte_details, fileLastEvaluatedKey) => {
    const tempArr = [];
    const page_size = 50;

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




