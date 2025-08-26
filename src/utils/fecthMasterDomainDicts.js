import AmeyaSettingsApi from "../api/services/TemplateServiceApi";

const getAllDocumentTypes = async (appflyte_details) => {
    try {
        const response = await AmeyaSettingsApi.getDocumentTypes(appflyte_details, null);
        if (response?.data) {
            const collectionData = response.data.published_collections_detail?.flatMap((collection) => response.data[collection.id]) ?? [];
            return collectionData;
        }
        return [];
    } catch (error) {
        console.error(error);
        return [];
    }
};

export default getAllDocumentTypes;
