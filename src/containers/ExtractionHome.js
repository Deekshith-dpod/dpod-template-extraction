import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

import ExtractionLayout from './ExtractionLayout';
import getTemplateSettingsData from '../utils/fetchSettingsData';
import { fetchAllExtractionFiles } from '../utils/FileUpload';
import getAllDocumentTypes from '../utils/fecthMasterDomainDicts';
import AmeyaSettingsApi from '../api/services/TemplateServiceApi';
import { useAppContext } from '../context/appcontext';
import getExtractionFile from '../utils/getFileById';

function ExtractionHome(props) {
    const { fileLastEvaluatedKey, setFileLastEvaluatedKey } = useAppContext();

    const [isLoading, setIsLoading] = useState(true);
    const [loadingError, setLoadingError] = useState(null);
    const [appflyteData, setAppflyteData] = useState({});
    const [homePagePreview, setHomePagePreview] = useState(false);

    const [extractionFiles, setExtractionFiles] = useState([]);
    const [selectedExtractionFile, setSelectedExtractionFile] = useState(null);
    const [settingsJsonStatus, setSettingsJsonStatus] = useState(false)
    const [domainDictionaryFields, setDomainDictionaryFields] = useState([]);
    const [domainDictionaryTables, setDomainDictionaryTables] = useState([]);
    const [domainDictionaryGroups, setDomainDictionaryGroups] = useState([]);
    const [extractionSchemaMetaData, setExtractionSchemaMetaData] = useState({});

    const { onCancel, appflyte_backend_url } = props;

    const documentTypeDetails = {
        document_name: '',
        master_document: '',
        __auto_id__: null,
        update_key: null
    }
    const [documentTypeData, setDocumentTypeData] = useState(documentTypeDetails)

    const document_schema_details = {
        data_status: false,
        __auto_id__: null,
        update_key: null,
        document_schema_settings: {},
        document_schema_metadata: {}
    };
    const [documentSchemaData, setDocumentSchemaData] = useState(document_schema_details)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const config_data = await fetchConfig(appflyte_backend_url);
                if (!config_data) {
                    return
                }
                const appflyte_config = {
                    appflyte_backend_url: props.appflyte_backend_url,
                    extraction_file_id: props.extraction_file_id,
                    appflyte_agent_api_token: props.appflyte_agent_api_token,
                    appflyte_project_id: props.appflyte_project_id,
                    extraction_document_type_id: props.extraction_document_type_id,

                    appflyte_account_id: config_data?.appflyte_account_id ?? null,
                    appflyte_subscriber_id: config_data?.appflyte_subscriber_id ?? null,
                    appflyte_subscription_id: config_data?.appflyte_subscription_id ?? null,
                    appflyte_dpod_token: config_data?.appflyte_dpod_token ?? null,
                    appflyte_schema_id: config_data?.appflyte_schema_id ?? null,
                    appflyte_extraction_url: config_data?.appflyte_extraction_url ?? null,
                    extractionVersion: config_data?.extraction_version ?? null,
                    pipeline_id: config_data?.pipeline_id ?? null,
                    validate_schema_status: config_data?.validate_schema_status ?? false,
                };
                await fetchAllData(appflyte_config);
            }
            catch (error) {
                console.log(error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const fetchAllData = async (appflyte_config) => {
        try {

            if (!appflyte_config.extraction_document_type_id) {
                setLoadingError('Document type is missing. Please select a document type before proceeding.');
                return;
            }

            const [loadPdf, documentTypes, extractionFilesData, schemaDocumentType] = await Promise.all([
                loadPdfJs(),
                fetchDocumentTypes(appflyte_config),
                fetchAllExtractionFiles(appflyte_config, fileLastEvaluatedKey),
                fetchDomainDictionarySchema(appflyte_config)
            ])

            if (documentTypes && extractionFilesData && schemaDocumentType) {

                if ((documentTypes || []).length === 0) {
                    setLoadingError('Invalid document type. Please select a valid option before continuing.');
                    return;
                }

                const extractionFilesArray = extractionFilesData?.data ?? [];
                const extractionFilesLastEvaluatedKey = extractionFilesData?.lastEvaluatedKey ?? null;
                setFileLastEvaluatedKey(extractionFilesLastEvaluatedKey);

                if (appflyte_config.extraction_file_id) {
                    const filesDatas = await getExtractionFile(appflyte_config, appflyte_config.extraction_file_id);
                    if (filesDatas && filesDatas.length) {
                        const filesData = filesDatas?.at(-1) ?? {};
                        setSelectedExtractionFile(filesData);
                    }
                }
                setExtractionFiles(extractionFilesArray);
                const document_type = documentTypes?.at(-1) ?? {};
                setDocumentTypeData(prev => ({
                    ...prev,
                    __auto_id__: document_type?.__auto_id__ || null,
                    document_name: document_type?.name || "",
                    update_key: document_type?.update_key || null,
                    master_document: document_type?.master_document_type || ""
                }))
                setHomePagePreview(true)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const fetchConfig = async (backend_url) => {
        try {
            const response = await AmeyaSettingsApi.getConfigSettings(backend_url);
            if (response.status === 200) {
                const config_data = response?.data?.config ?? {};

                const enrichedConfig = {
                    ...config_data,
                    appflyte_agent_api_token: props.appflyte_agent_api_token,
                    appflyte_project_id: props.appflyte_project_id,
                    extraction_document_type_id: props.extraction_document_type_id
                };

                setAppflyteData(enrichedConfig);
                return enrichedConfig;
            } else {
                setLoadingError("Sorry, something went wrong and we couldn't load the page.Please try again later.");
                return null
            }
        } catch (error) {
            console.error("Failed to fetch config:", error);
            return null
        }
    };

    const loadPdfJs = async () => {
        if (!window.pdfjsLib) {
            console.warn('PDF.js is not loaded yet');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                if (window.pdfjsLib) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }
            };
            document.head.appendChild(script);
            return () => document.head.removeChild(script);
        }
    };

    const fetchDocumentTypes = async (appflyte_config) => {
        try {
            const response = await getAllDocumentTypes(appflyte_config);
            const updated_response = response?.length > 0 && response?.map((mt) => ({ ...mt.payload, ...(mt.update_key ? { update_key: mt.update_key } : {}) })) || [];
            return updated_response;
        } catch (error) {
            console.log(error)
            return [];
        }
    }

    const fetchDomainDictionarySchema = async (appflyte_config) => {
        try {
            const response = await getTemplateSettingsData(appflyte_config);
            if (response?.length > 0) {
                const responseData = response?.[0] ?? [];
                const __auto_id__ = responseData?.payload?.__auto_id__ ?? null;
                const update_key = responseData?.update_key ?? null;
                const settings = responseData?.payload?.settings ?? {};
                const document_schema_settings = settings?.document_dictionary?.[0] ?? {};
                if (document_schema_settings) {
                    const documentDictionaryFields = document_schema_settings?.fields ?? [];
                    const documentDictionaryTables = document_schema_settings?.tables ?? [];
                    const documentDictionaryGroups = document_schema_settings?.groups ?? [];
                    setSettingsJsonStatus(true);
                    setDomainDictionaryFields(documentDictionaryFields);
                    setDomainDictionaryTables(documentDictionaryTables);
                    setDomainDictionaryGroups(documentDictionaryGroups);
                }
                setDocumentSchemaData({ ...documentSchemaData, data_status: true, __auto_id__: __auto_id__, update_key: update_key, document_schema_settings: settings })
                const settings_metadata = settings?.metadata ?? {};
                setExtractionSchemaMetaData(settings_metadata);
                const master_domain_dictionary = responseData?.payload?.document_type ?? null;
                return master_domain_dictionary;
            }
            return [];
        } catch (error) {
            console.log(error);
            return []
        }
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: '#007bff' }} />
            </Box>
        );
    }

    if (!isLoading && !homePagePreview) {
        return (<Box>
            <Alert severity="error" sx={{ marginTop: '20px' }}>
                {loadingError
                    ?
                    (<Typography fontWeight={500} fontSize={'16px'}>
                        {loadingError}
                    </Typography>)
                    :
                    (<Typography fontWeight={500} fontSize={'16px'}>
                        Sorry, something went wrong and we couldn't load the page. Please try again later.
                    </Typography>)
                }
            </Alert>
        </Box >
        );
    }

    const commonProps = {
        appflyteData,
        extractionFiles,
        selectedExtractionFile,
        documentTypeData,
        documentSchemaData,
        settingsJsonStatus,
        domainDictionaryFields,
        domainDictionaryTables,
        domainDictionaryGroups,
        extractionSchemaMetaData,
        onCancel,
        setHomePagePreview,
        setExtractionFiles,
        setSelectedExtractionFile,
        setDomainDictionaryFields,
        setDomainDictionaryTables,
        setDomainDictionaryGroups,
        setExtractionSchemaMetaData,
        fetchDomainDictionarySchema
    };

    return (
        <Box sx={{ height: '100vh', width: '100%', backgroundColor: '#F3F5F7', minHeight: '100vh' }}>
            {homePagePreview
                ?
                (<ExtractionLayout {...commonProps} />)
                :
                (<Alert severity="error" sx={{ marginTop: '20px' }}>
                    <Typography fontWeight={500} fontSize={'16px'}>{loadingError}</Typography>
                </Alert>)
            }
        </Box>
    )
}

export default ExtractionHome;