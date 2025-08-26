import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import moment from 'moment/moment';
import { ReactSVG } from 'react-svg';
import { JSONTree } from 'react-json-tree';
import * as XLSX from 'xlsx';
import { renderAsync } from 'docx-preview';

import "@fontsource/inter";
import { useTheme } from '@mui/material/styles';
import {
    Box, Button, CircularProgress, FormControl, InputAdornment, LinearProgress, MenuItem,
    Modal, Select, TextField, Typography, Stack, IconButton, Autocomplete, Collapse,
    Pagination
} from '@mui/material';
import { ExpandLess, ExpandMore, KeyboardArrowUp, KeyboardArrowDown, ArrowBackIos, ArrowBack, Search, FilterAlt, FilterAltOff } from '@mui/icons-material';
import { getStyles } from './styles';
import { getComponentsStyles } from '../styles/ComponentsStyles';
import "./styles.css"

import aliasIcon from "../styles/icons/aliase.svg";
import trashIcon from "../styles/icons/trash.svg";
import addIcon from "../styles/icons/add.svg";
import addUnfillIcon from "../styles/icons/add_unfill.svg";
import uploadFileIcon from "../styles/icons/upload_file.svg";
import addFieldIcon from "../styles/icons/addField.svg";
import addTableIcon from "../styles/icons/addTable.svg";
import editIcon from "../styles/icons/edit.svg";
import fileViewIcon from "../styles/icons/fileViewIcon.svg";
import jsonViewIcon from "../styles/icons/jsonViewIcon.svg";
import hideIcon from "../styles/icons/hideIcon.svg";
import viewIcon from "../styles/icons/viewIcon.svg";
import extraction_result from "../styles/icons/extraction_data.svg";

import FilesApi from '../api/services/FileServiceApi';
import { cancelAllApis } from '../api/services/CancelApi';
import AmeyaSettingsApi from '../api/services/TemplateServiceApi';

import { performOCR } from './PdfOCR';
import { apiErrorHandler } from '../utils/apiErrorHandler';
import { generateSearchKeysNew } from '../utils/PdfSearch';
import { lowercaseStrings } from '../utils/lowercaseStrings';
import { addProgrammaticAnnotation } from '../utils/PdfDraw';
import { handleConstructFieldData, handleNewFieldAdd } from '../utils/documentTypeFields';
import { fetchAllExtractionFiles, handleDocumentUpload, saveInBackend, searchExtractionFiles } from '../utils/fileUpload';
import { convertFloatsToStrings, handleExtractionFields, handleExtractionGroups, handleExtractionTables, lightTheme } from '../utils/index';
import AppflyteServiceApi from '../api/services/AppflyteServiceApi';
import axios from 'axios';
import ExtractionResult from './ExtractionResult';
import { documentStyles } from './utils';
import { useAppContext } from '../context/appcontext';
import { getAllExtarctionTasks } from '../utils/data';

function ExtractionLayout(props) {

    const { appflyteData, setHomePagePreview, extractionFiles, documentTypeData, settingsJsonStatus,
        setExtractionFiles, documentSchemaData, selectedExtractionFile, setSelectedExtractionFile,
        domainDictionaryFields, domainDictionaryTables, domainDictionaryGroups, extractionSchemaMetaData,
        setDomainDictionaryFields, setDomainDictionaryTables, setDomainDictionaryGroups, setExtractionSchemaMetaData,
        fetchDomainDictionarySchema, onCancel, onSave
    } = props;

    const appflyte_details = useMemo(() => ({
        appflyte_account_id: appflyteData.appflyte_account_id,
        appflyte_subscriber_id: appflyteData.appflyte_subscriber_id,
        appflyte_subscription_id: appflyteData.appflyte_subscription_id,
        appflyte_schema_id: appflyteData.appflyte_schema_id,
        appflyte_backend_url: appflyteData.appflyte_backend_url,
        appflyte_extraction_url: appflyteData.appflyte_extraction_url,
        appflyte_dpod_token: appflyteData.appflyte_dpod_token,
        appflyte_agent_api_token: appflyteData.appflyte_agent_api_token,
        appflyte_project_id: appflyteData.appflyte_project_id,
        pipeline_id: appflyteData.pipeline_id,
        document_type_id: appflyteData.extraction_document_type_id,
        extraction_document_type_id: appflyteData.extraction_document_type_id
    }), [appflyteData]);

    const theme = useTheme();
    const styles = getStyles(theme);
    const componentStyle = getComponentsStyles();
    const { fileLastEvaluatedKey, setFileLastEvaluatedKey } = useAppContext();

    const canvasRef = useRef(null);
    const pdfCanvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    const renderTaskRef = useRef(null);
    const searchIconRef = useRef(null);
    const isRendered = useRef(false);
    const contentRef = useRef(null);
    const relativeRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fileLoading, setFileLoading] = useState(false);
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const [extractionLoading, setExtractionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [dataLoading, setDataloading] = useState(false);

    const [filter, setFilter] = useState(false);
    const [valueChanging, setValueChanging] = useState(false);
    const [revalidateStatus, setRevalidateStatus] = useState(false);
    const [extractionVersion] = useState(() => appflyteData.extraction_version || "v1");
    const [validateSchema] = useState(() => { return String(appflyteData.validate_schema_status).toLowerCase() === 'true'; })

    const [groupOpenIndex, setGroupOpenIndex] = useState(null);
    const [tableOpenIndex, setTableOpenIndex] = useState(null);
    const [groupTableOpenIndex, setGroupTableOpenIndex] = useState(null);
    const [editableIndex, setEditableIndex] = useState(null);
    const [editgroupIndex, setEditGroupIndex] = useState(null);
    const [editGrouptableIndex, setEditGrouptableIndex] = useState(null);

    const aliasModalDetails = {
        modalstatus: false, field_alias: [], data_type: '',
        field_name: '', group_name: '', table_name: '', field_type: '',
        field_index: null, group_index: null, table_index: null
    };
    const [aliasModalData, setAliasModalData] = useState(aliasModalDetails);
    const [fieldDescriptions, setFieldDescription] = useState('');

    const [fileDoc, setFileDoc] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [selectedFileData, setSelectedFileData] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState(null);
    const [selectedFileUrl, setSelectedFileUrl] = useState(null);

    const [docxPages, setDocxPages] = useState([]);
    const [serachKeyData, setSerachKeysData] = useState(['Description']);
    const [pageTextItems, setPageTextItems] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [content, setContent] = useState('');
    const [sheetNames, setSheetNames] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState(null);
    const visibleRows = 100;

    const [annotations, setAnnotations] = useState({});
    const [selectedAnnotation, setSelectedAnnotation] = useState(null);
    const [hoveredTextItem, setHoveredTextItem] = useState(null);

    const scale = 1.0;
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPolygon, setCurrentPolygon] = useState([]);
    const wordSelectionModalDetails = { modalstatus: false, draw_data: '' };
    const [wordSelectionModalData, setWordSelectionModalData] = useState(wordSelectionModalDetails);

    const [drawFieldSelection, setDrawFieldSelection] = useState(null);
    const [drawGroupSelection, setDrawGroupSelection] = useState(null);
    const [drawTableSelection, setDrawTableSelection] = useState(null);
    const [drawTableFieldSelection, setDrawTableFieldSelection] = useState(null);

    const [domainDictionaryTableFields, setDomainDictionaryTableFields] = useState([]);
    const [domainDictionaryGroupFields, setDomainDictionaryGroupFields] = useState([]);
    const [domainDictionaryGroupTables, setDomainDictionaryGroupTables] = useState([]);
    const [domainDictionaryGroupTableFields, setDomainDictionaryGroupTableFields] = useState([]);
    const [extractionResponse, setExtractionResponse] = useState(null);

    const initialExtractionResponse = { files: [{ mapped_fields: {}, tables: [], groups: [], other: {} }] };
    const [extractionResponseData, setExtractionResponseData] = useState(initialExtractionResponse);
    const [filepage, setFilePage] = useState(0);

    const [previewType, setPreviewType] = useState('file_preview');
    const [drawAddAlias, setDrawAddAlias] = useState(false);
    const [drawAddGroup, setDrawAddGroup] = useState(false);
    const [drawAddTable, setDrawAddTable] = useState(false);

    useEffect(() => {
        if (contentRef.current && content) {
            isRendered.current = true;
        }
    }, [content]);

    useEffect(() => {
        if (!documentTypeData.__auto_id__) {
            setHomePagePreview(true);
        }
    }, [documentTypeData.__auto_id__]);

    useEffect(() => {
        return () => {
            if (renderTaskRef.current) renderTaskRef.current.cancel();
        };
    }, []);

    const handleReset = async () => {
        await cancelAllApis()
        setFileDoc(null);
        setSelectedFileData(null)
        setSelectedFileName(null);
        setSelectedFileUrl(null);
        setAnnotations({});
        setSelectedAnnotation(null);
        setSerachKeysData([]);
        setPageTextItems([]);
        setRevalidateStatus(false)
        setHomePagePreview(true);
        setFilter(false)
        setContent('');
        setExtractionResponse({});
        setSheetNames([]);
        setSelectedSheet(null);
        setDocxPages([])
        isRendered.current = false;

        if (onCancel && typeof onCancel === 'function') {
            onCancel();
        } else {
            console.warn('onCancel is not a valid function');
        }
    }

    // -----------------------------------| File Handling |-------------------------------------//
    const handleFileUpload = async (file_data) => {
        setLoading(true)
        try {
            if (file_data?.length === 0) {
                alert('Please select file and try again')
                return
            }
            const upload_response = await handleDocumentUpload(appflyte_details, file_data[0]);
            if (upload_response.status === 200) {
                const save_response = await saveInBackend(appflyte_details, upload_response.fileName, upload_response.fileUrl, upload_response.fileId);
                if (save_response.status === 200) {
                    const responseData = save_response.data || {};
                    setExtractionFiles(prev => [...prev, responseData]);
                    setSelectedExtractionFile(responseData);
                    return;
                } else {
                    alert('Failed to save file, try again')
                    return [];
                }
            } else {
                alert('Failed to upload file, try again')
                return [];
            }
        } catch (error) {
            console.log(error)
            apiErrorHandler(error)
            return [];
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpadte = async (file, update_type) => {
        try {
            let reqObj = {}

            if (update_type === 'valid_schema') {
                reqObj = {
                    id: file?.payload?.__auto_id__,
                    fields: [
                        { path: '$.document_type_id', value: documentTypeData.__auto_id__ },
                        { path: '$.document_type_name', value: documentTypeData.master_document }
                    ]
                };
            }

            if (update_type === "extraction") {
                reqObj = {
                    id: file?.payload?.__auto_id__,
                    fields: [
                        { path: '$.training_status', value: 'Trained' },
                        { path: '$.trained_date', value: moment().format("DD-MM-YYYY HH:mm:ss") }
                    ]
                };
            }

            const response = await FilesApi.updateExtractionFile(appflyte_details, reqObj, file?.payload?.__auto_id__, file?.update_key);
            if (response.status === 200) {
                const all_files = await fetchAllExtractionFiles(appflyte_details);
                const filtred_response = all_files?.filter(item => item?.payload?.project_id === appflyte_details.appflyte_project_id)
                setExtractionFiles(filtred_response);
                return filtred_response;
            }
        } catch (error) {
            console.log(error)
            apiErrorHandler(error)
            return
        }
    }

    // -----------------------------------| Domain Dictionary Group |-------------------------------------//
    const handleDomainDictionaryItemAdd = (field_type) => {
        let newField = {};
        if (field_type === "field") {
            newField = { name: "", description: "", type: "string", alias: [], source_label: "", view: false };
        }
        else if (field_type === "tables") {
            newField = {
                name: "Table Name",
                description: "",
                fields: [{
                    name: "",
                    description: "",
                    type: "string",
                    alias: [],
                    source_label: "",
                    view: false
                }]
            }
        }
        else if (field_type === "groups") {
            newField = {
                name: "Group Name",
                description: "",
                fields: [{ name: "", description: "", type: "string", alias: [], source_label: "", view: false }],
                tables: [{
                    name: "Table Name",
                    fields: [{
                        name: "",
                        description: "",
                        type: "string",
                        alias: [],
                        source_label: "",
                        view: false
                    }]
                }]
            }
        }

        const fieldSetters = {
            field: [domainDictionaryFields, setDomainDictionaryFields],
            tables: [domainDictionaryTables, setDomainDictionaryTables],
            groups: [domainDictionaryGroups, setDomainDictionaryGroups],
        };
        const [fields, setFields] = fieldSetters[field_type] || [];
        if (fields && setFields) {
            setFields([...fields, newField]);
        }
    }

    const handleDomainDictionaryItemDelete = (field_type, index) => {
        const fieldSetters = {
            field: [domainDictionaryFields, setDomainDictionaryFields],
            tables: [domainDictionaryTables, setDomainDictionaryTables],
            groups: [domainDictionaryGroups, setDomainDictionaryGroups],
        };

        const [fields, setFields] = fieldSetters[field_type] || [];
        if (fields && setFields) {
            const updatedFields = fields.filter((_, i) => i !== index);
            setFields(updatedFields);
        }
    };

    const handleDomainDictionaryFieldTypeName = (field_type, index, name) => {
        setValueChanging(true)
        const fieldSetters = { field: [domainDictionaryFields, setDomainDictionaryFields], };
        const [fields, setFields] = fieldSetters[field_type] || [];
        if (fields && setFields) {
            const updatedFields = [...fields];
            updatedFields[index] = { ...updatedFields[index], name };
            setFields(updatedFields);
        }
        setValueChanging(false)
    }

    const handleDomainDictionaryFieldType = (field_type, index, type) => {
        const fieldSetters = { field: [domainDictionaryFields, setDomainDictionaryFields] };
        const [fields, setFields] = fieldSetters[field_type] || [];
        if (fields && setFields) {
            const updatedFields = [...fields];
            updatedFields[index] = { ...updatedFields[index], type };
            setFields(updatedFields);
        }
    }

    const handleDomainDictionaryGroupName = (index, group_name) => {
        const domain_dictionary_groups = [...domainDictionaryGroups]
        domain_dictionary_groups[index].name = group_name
        setDomainDictionaryGroups(domain_dictionary_groups)
    }

    const handleDomainDictionaryGroupNameSearch = (index, group_name) => {
        setEditGroupIndex(null)
        const domain_dictionary_groups = [...domainDictionaryGroups]
        domain_dictionary_groups[index].name = group_name
    }

    const hanldeGroupTableSelection = (type, value) => {
        setDrawTableSelection(value)
        if (type === "table") {
            const selectedTableIndex = domainDictionaryTables.findIndex(item => item?.name === value?.name);
            const selectedTable = domainDictionaryTables[selectedTableIndex];
            const selectedTableFields = selectedTable?.fields || [];
            setDomainDictionaryTableFields(selectedTableFields);
        } else {
            const selectedGroupTableIndex = domainDictionaryGroupTables.findIndex(item => item?.name === value?.name);
            const selectedGroupTable = domainDictionaryGroupTables[selectedGroupTableIndex];
            const selectedGroupTableFields = selectedGroupTable?.fields || [];
            setDomainDictionaryGroupTableFields(selectedGroupTableFields);
        }
    }

    const handleGroupSelection = (value) => {
        setDrawGroupSelection(value)
        const selectedGroupIndex = domainDictionaryGroups.findIndex(item => item?.name === value?.name);
        const selectedGroup = domainDictionaryGroups[selectedGroupIndex];
        const selectedGroupFields = selectedGroup?.fields || [];
        const selectedGroupTables = selectedGroup?.tables || [];
        setDomainDictionaryGroupFields(selectedGroupFields)
        setDomainDictionaryGroupTables(selectedGroupTables);
    }

    // -----------------------------------| Domain Dictionary Table |-------------------------------------//
    const handleDomainDictionaryTableName = (index, table_name) => {
        const domain_dictionary_tables = [...domainDictionaryTables]
        domain_dictionary_tables[index].name = table_name
        setDomainDictionaryTables(domain_dictionary_tables)
    }

    const handleDomainDictionaryTableFieldName = (index, fieldIdx, field_name) => {
        setValueChanging(true)
        const domain_dictionary_tables = [...domainDictionaryTables]
        domain_dictionary_tables[index].fields[fieldIdx].name = field_name
        setDomainDictionaryTables(domain_dictionary_tables)
        setValueChanging(false)
    }

    const handleDomainDictionaryTableFieldType = (index, fieldIdx, field_type) => {
        const domain_dictionary_tables = [...domainDictionaryTables]
        domain_dictionary_tables[index].fields[fieldIdx].type = field_type
        setDomainDictionaryTables(domain_dictionary_tables)
    }

    const handleDeleteDomainDictionaryTableField = (index, fieldIdx) => {
        const domain_dictionary_tables = [...domainDictionaryTables]
        domain_dictionary_tables[index]?.fields?.splice(fieldIdx, 1)
        setDomainDictionaryTables(domain_dictionary_tables)
    }

    const handleAddDomainDictionaryTableField = (index) => {
        const domain_dictionary_tables = [...domainDictionaryTables]
        const newField = { name: "", type: "string", alias: [], source_label: "", view: false };
        domain_dictionary_tables[index]?.fields?.push(newField)
        setDomainDictionaryTables(domain_dictionary_tables)
    }

    // -----------------------------------| Domain Dictionary Group Field |-------------------------------------//
    const handleAddDomainDictionaryGroupField = (index) => {
        setValueChanging(true)
        const domain_dictionary_groups = [...domainDictionaryGroups]
        const newField = { name: "", type: "string", alias: [], view: false };
        domain_dictionary_groups[index]?.fields?.push(newField)
        setDomainDictionaryGroups(domain_dictionary_groups)
        setValueChanging(false)
    }

    const handleDomainDictionaryGroupFieldName = (index, fieldIdx, field_name) => {
        setValueChanging(true)
        const domain_dictionary_groups = [...domainDictionaryGroups]
        domain_dictionary_groups[index].fields[fieldIdx].name = field_name
        setDomainDictionaryGroups(domain_dictionary_groups)
        setValueChanging(false)
    }

    const handleDomainDictionaryGroupFieldType = (index, fieldIdx, field_type) => {
        const domain_dictionary_groups = [...domainDictionaryGroups]
        domain_dictionary_groups[index].fields[fieldIdx].type = field_type
        setDomainDictionaryGroups(domain_dictionary_groups)
    }

    const handleDeleteDomainDictionaryGroupField = (index, fieldIdx) => {
        const domain_dictionary_groups = [...domainDictionaryGroups]
        domain_dictionary_groups[index]?.fields?.splice(fieldIdx, 1)
        setDomainDictionaryGroups(domain_dictionary_groups)
    }

    // -----------------------------------| Domain Dictionary Group Table |--------------------------------------//
    const handleDomainDictionaryGroupTableAdd = (index) => {
        const domain_dictionary_groups = [...domainDictionaryGroups]
        const newField = {
            name: "Table Name",
            description: "Table Description",
            fields: [{
                name: "",
                discription: "",
                type: "string",
                alias: [],
                source_label: "",
                view: false
            }]
        }
        domain_dictionary_groups[index].tables.push(newField)
        setDrawGroupSelection(domain_dictionary_groups)
    }

    const handleDomainDictionaryGroupTableName = (index, tableIndex, tableName) => {
        setValueChanging(true)
        const domain_dictionary_groups = [...domainDictionaryGroups]
        domain_dictionary_groups[index].tables[tableIndex].name = tableName
        setDrawGroupSelection(domain_dictionary_groups)
        setValueChanging(false)
    }

    const handleDomainDictionaryGroupTableDelete = (index, tableIndex) => {
        const domain_dictionary_groups = [...domainDictionaryGroups]
        domain_dictionary_groups[index]?.tables?.splice(tableIndex, 1)
        setDomainDictionaryGroups(domain_dictionary_groups)
    }

    // -----------------------------------| Domain Dictionary Group Table Field |-------------------------------- //
    const handleDomainDictionaryGroupTableFieldAdd = (index, tableIndex) => {
        const domain_dictionary_groups = [...domainDictionaryGroups]
        const newField = {
            name: "",
            discription: "",
            type: "string",
            alias: [],
            source_label: "",
            view: false
        }
        domain_dictionary_groups[index].tables[tableIndex].fields.push(newField)
        setDomainDictionaryGroups(domain_dictionary_groups)
    }

    const handleDomainDictionaryGroupTableFieldName = (index, tableIndex, tableFieldIdx, field_name) => {
        setValueChanging(true)
        const domain_dictionary_groups = [...domainDictionaryGroups]
        domain_dictionary_groups[index].tables[tableIndex].fields[tableFieldIdx].name = field_name
        setDomainDictionaryGroups(domain_dictionary_groups)
        setValueChanging(false)
    }

    const handleDomainDictionaryGroupTableFieldType = (index, tableIndex, tableFieldIdx, field_type) => {
        const domain_dictionary_groups = [...domainDictionaryGroups]
        domain_dictionary_groups[index].tables[tableIndex].fields[tableFieldIdx].type = field_type
        setDomainDictionaryGroups(domain_dictionary_groups)
    }

    const handleDomainDictionaryGroupTableFieldDelete = (index, tableIndex, tableFieldIdx) => {
        const domain_dictionary_groups = [...domainDictionaryGroups]
        domain_dictionary_groups[index].tables[tableIndex].fields.splice(tableFieldIdx, 1)
        setDomainDictionaryGroups(domain_dictionary_groups)
    }

    // -----------------------------------| Domain Dictionary Alias |-------------------------------- //
    const handleDomainDictionaryAliasModalOpen = (data_type, field_index, field_name, field_description, field_type, field_alias,
        group_index, group_name, table_index, table_name) => {

        setAliasModalData({
            ...aliasModalData,
            modalstatus: true,
            data_type: data_type,

            field_index: field_index,
            field_name: field_name,
            field_type: field_type ?? 'string',
            field_alias: field_alias,

            group_index: group_index,
            group_name: group_name,

            table_index: table_index,
            table_name: table_name
        });
        setFieldDescription(field_description)
    }

    const handleDomainDictionaryAliasModalClose = () => {
        setAliasModalData(aliasModalDetails);
        setSerachKeysData(prev => [...prev]);
    }

    const handleDomainDictionaryAliasAdd = () => {
        const updatedAliasData = [...aliasModalData.field_alias];
        updatedAliasData.push('')
        setAliasModalData({ ...aliasModalData, field_alias: updatedAliasData })
    }

    const handleDomainDictionaryAliasDelete = (Index) => {
        const updatedAliasData = [...aliasModalData.field_alias];
        updatedAliasData.splice(Index, 1)
        setAliasModalData({ ...aliasModalData, field_alias: updatedAliasData })
    }

    const handleDomainDictionaryAliasValue = (index, value) => {
        const currentAliases = aliasModalData?.field_alias || [];
        const updatedAliasData = [...currentAliases];
        updatedAliasData[index] = value;
        setAliasModalData({ ...aliasModalData, field_alias: updatedAliasData });
    }

    const handleDomainDictionaryAliasSave = () => {

        const { data_type, group_index, field_index, field_alias, table_index } = aliasModalData || {};
        const cleaned_field_alias = [...new Set(field_alias.map(s => s.trim()).filter(Boolean))];

        if (data_type === "fields") {
            if (field_index == null || field_alias == null) return;
            const domain_dictionary_fields = [...domainDictionaryFields];
            domain_dictionary_fields[field_index].alias = cleaned_field_alias;
            domain_dictionary_fields[field_index].description = fieldDescriptions;
            setDomainDictionaryFields(domain_dictionary_fields);
            setAliasModalData(aliasModalDetails);
        }

        if (data_type === "tables") {
            if (field_index == null || field_alias == null || table_index == null) return;
            const domain_dictionary_tables = [...domainDictionaryTables]
            domain_dictionary_tables[table_index].fields[field_index].alias = cleaned_field_alias;
            domain_dictionary_tables[table_index].fields[field_index].description = fieldDescriptions;
            setDomainDictionaryTables(domain_dictionary_tables);
            setAliasModalData(aliasModalDetails);
        }

        if (data_type === "groups") {
            if (field_index == null || field_alias == null || group_index == null) return;
            const domain_dictionary_groups = [...domainDictionaryGroups]
            domain_dictionary_groups[group_index].fields[field_index].alias = cleaned_field_alias;
            domain_dictionary_groups[group_index].fields[field_index].description = fieldDescriptions;
            setDomainDictionaryGroups(domain_dictionary_groups);
            setAliasModalData(aliasModalDetails);
        }

        if (data_type === "group_tables") {
            if (field_index == null || field_alias == null || group_index == null || table_index) return;
            const domain_dictionary_groups = [...domainDictionaryGroups]
            domain_dictionary_groups[group_index].tables[table_index].fields[field_index].alias = cleaned_field_alias;
            domain_dictionary_groups[group_index].tables[table_index].fields[field_index].description = fieldDescriptions;
            setDomainDictionaryGroups(domain_dictionary_groups);
            setAliasModalData(aliasModalDetails);
        }
    }

    const hanldeDrawAddTable = (type) => {
        if (!drawGroupSelection) {
            alert('Please select the group and try again');
            return;
        }
        if (type === "alias") {
            setDrawAddTable(false);
            setDrawAddAlias(true);
        }
        else {
            setDrawAddAlias(false);
            setDrawAddTable(true);
        }
    }

    const handleDrawEntityCancel = async () => {
        setWordSelectionModalData(wordSelectionModalDetails)
        setDrawAddAlias(false)
        setDrawAddGroup(false)
        setDrawAddTable(false)
        setDrawFieldSelection(null)
        setDrawGroupSelection(null)
        setDrawTableSelection(null)
        setDrawTableFieldSelection(null)
        setDomainDictionaryGroupTables([])
        setDomainDictionaryGroupTableFields([])
        setDomainDictionaryGroupFields([])
        setDomainDictionaryTableFields([])
        setSerachKeysData(prev => [...prev]);
    }

    const handleDrawEntitySave = async () => {
        //  Adding fields
        if (!drawAddAlias && !drawAddGroup && !drawAddTable) {
            const input = wordSelectionModalData.draw_data?.toLowerCase();
            const isMatch = domainDictionaryFields?.some(item => item?.name?.toLowerCase() === input);
            if (isMatch) {
                const proceed = confirm("This field already exists. Do you want to proceed?");
                if (!proceed) {
                    return;
                }
            }
            const item_index = domainDictionaryFields.length;
            await handleGetFieldDetails('fields', wordSelectionModalData.draw_data, item_index)
        }

        // Adding alias for field 
        else if (drawAddAlias && !drawAddGroup && !drawAddTable) {
            if (!drawFieldSelection) {
                alert('Please select the field and try again')
                return
            }
            const domain_dictionary_fields = domainDictionaryFields?.map(item => item.name === drawFieldSelection?.name
                ? { ...item, alias: [...(item.alias || []), wordSelectionModalData.draw_data || ''] } : item);
            setDomainDictionaryFields(domain_dictionary_fields)
        }

        // Table
        // Adding field for table 
        else if (drawAddTable && !drawAddAlias && !drawAddGroup) {
            if (!drawTableSelection) {
                alert('Please select the table and try again')
                return
            }
            const selectedTableIndex = domainDictionaryTables.findIndex(item => item?.name === drawTableSelection?.name)
            if (selectedTableIndex >= 0) {
                const selectedTable = domainDictionaryTables[selectedTableIndex];
                const input = wordSelectionModalData.draw_data?.toLowerCase();
                const isMatch = selectedTable.fields?.some(item => item?.name?.toLowerCase() === input);
                if (isMatch) {
                    const proceed = confirm("This field already exists. Do you want to proceed?");
                    if (!proceed) {
                        return;
                    }
                }
                const item_index = selectedTable.fields?.length || 0;
                await handleGetFieldDetails('tables', wordSelectionModalData.draw_data, item_index, selectedTableIndex)
            }
        }

        // Adding Alias For Table Field
        else if (drawAddTable && drawAddAlias && !drawAddGroup) {
            if (!drawTableSelection || !drawFieldSelection) {
                alert('Please select the field and try again')
                return
            }
            const selectedTableIndex = domainDictionaryTables.findIndex(item => item?.name === drawTableSelection?.name);
            if (selectedTableIndex >= 0) {
                const selectedTable = domainDictionaryTables[selectedTableIndex];
                const updatedFields = (selectedTable.fields || []).map(field => {
                    if (field.name === drawFieldSelection?.name) {
                        const newAliasSet = new Set([...(field.alias || []), wordSelectionModalData.draw_data]);
                        return { ...field, alias: Array.from(newAliasSet) };
                    }
                    return field;
                });
                const updatedTable = { ...selectedTable, fields: updatedFields };
                const updatedTables = [...domainDictionaryTables.slice(0, selectedTableIndex), updatedTable, ...domainDictionaryTables.slice(selectedTableIndex + 1)];
                setDomainDictionaryTables(updatedTables);
            }
        }

        // Groups
        // Adding field for group 
        else if (drawAddGroup && !drawAddAlias && !drawAddTable) {
            if (!drawGroupSelection) {
                alert('Please select the group and try again')
                return
            }
            const selectedGroupIndex = domainDictionaryGroups.findIndex(item => item?.name === drawGroupSelection?.name)
            if (selectedGroupIndex >= 0) {
                const selectedGroup = domainDictionaryGroups[selectedGroupIndex];
                const input = wordSelectionModalData.draw_data?.toLowerCase();
                const isMatch = selectedGroup.fields?.some(item => item?.name?.toLowerCase() === input);
                if (isMatch) {
                    const proceed = confirm("This field already exists. Do you want to proceed?");
                    if (!proceed) {
                        return;
                    }
                }
                const item_index = selectedGroup.fields?.length || 0;
                await handleGetFieldDetails('group_fields', wordSelectionModalData.draw_data, item_index, 0, selectedGroupIndex)
            }
        }

        // Adding alias for group field
        else if (drawAddAlias && drawAddGroup && !drawAddTable) {
            if (!drawGroupSelection || !drawFieldSelection) {
                alert('Please select field and try again')
                return
            }

            const newAlias = wordSelectionModalData.draw_data;
            const fieldNameToUpdate = drawFieldSelection?.name;

            const updatedGroups = domainDictionaryGroups.map(group => {
                if (group.name !== drawGroupSelection.name) return group;
                const updatedFields = (group.fields || []).map(field => {
                    if (field.name !== fieldNameToUpdate) return field;
                    return { ...field, alias: [...(field.alias || []), newAlias] };
                });
                return { ...group, fields: updatedFields };
            });
            setDomainDictionaryGroups(updatedGroups);
        }

        // Adding field for group table
        else if (drawAddGroup && !drawAddAlias && drawAddTable) {
            if (!drawGroupSelection || !drawTableSelection) {
                alert('Please select the table and try again')
                return
            }
            const selectedGroupIndex = domainDictionaryGroups.findIndex(group => group?.name === drawGroupSelection?.name);
            if (selectedGroupIndex >= 0) {
                const selectedGroup = domainDictionaryGroups[selectedGroupIndex];
                const selectedTableIndex = (selectedGroup.tables || []).findIndex(table => table?.name === drawTableSelection?.name);
                if (selectedTableIndex >= 0) {
                    const selectedTable = selectedGroup.tables[selectedTableIndex];
                    const input = wordSelectionModalData.draw_data?.toLowerCase();
                    const isMatch = selectedTable.fields?.some(item => item?.name?.toLowerCase() === input);
                    if (isMatch) {
                        const proceed = confirm("This field already exists. Do you want to proceed?");
                        if (!proceed) {
                            return;
                        }
                    }
                    const fieldIndex = selectedTable.fields?.length || 0;
                    await handleGetFieldDetails('group_table_fields', wordSelectionModalData.draw_data, fieldIndex, selectedTableIndex, selectedGroupIndex);
                }
            }
        }

        // Adding alias for group table field
        else if (drawAddAlias && drawAddGroup && drawAddTable) {
            if (!drawGroupSelection || !drawTableSelection || !drawTableFieldSelection) {
                alert('Please select field and try again')
                return
            }

            const newAlias = wordSelectionModalData.draw_data;
            const fieldNameToUpdate = drawTableFieldSelection?.name;

            const updatedGroups = domainDictionaryGroups.map(group => {
                if (group.name !== drawGroupSelection.name) return group;

                const updatedTables = (group.tables || []).map(table => {
                    if (table.name !== drawTableSelection.name) return table;
                    const updatedFields = (table.fields || []).map(field => {
                        if (field.name !== fieldNameToUpdate) return field;
                        return { ...field, alias: [...(field.alias || []), newAlias] };
                    });
                    return { ...table, fields: updatedFields };
                });
                return { ...group, tables: updatedTables };
            });
            setDomainDictionaryGroups(updatedGroups);
        }
        await handleDrawEntityCancel();
    }

    // -----------------------------------| Settings Handling |-------------------------------- //
    const handleTemplateSave = async () => {
        setIsLoading(true)
        try {
            const documentDictionaryFieldsObj = domainDictionaryFields?.length > 0 ? domainDictionaryFields.map((field) => {
                return {
                    "name": field.name || "",
                    "description": field.discription || "",
                    "type": field.type || "",
                    "source_label": field.source_label || "",
                    "alias": field.alias || []
                };
            }) : [];

            const documentDictionaryTablesObj = domainDictionaryTables?.length > 0 ? domainDictionaryTables.map((table) => {
                const fields = (table.fields || []).map((field) => ({
                    name: field.name || "",
                    description: field.description || "",
                    type: field.type || "",
                    source_label: field.source_label || "",
                    alias: field.alias || [],
                }));
                return {
                    name: table.name || "",
                    description: table.description || "",
                    fields
                };
            }) : [];

            const documentDictionaryGroupsObj = domainDictionaryGroups?.length > 0 ? domainDictionaryGroups.map((group) => {
                const fields = (group.fields || []).map((field) => ({
                    name: field.name || "",
                    description: field.description || "",
                    type: field.type || "",
                    source_label: field.source_label || "",
                    alias: field.alias || [],
                }));

                const tables = (group.tables || []).map((table) => ({
                    name: table.name || "",
                    description: table.discription || "",
                    fields: (table.fields || []).map((field) => ({
                        name: field.name || "",
                        description: field.discription || "",
                        type: field.type || "",
                        source_label: field.source_label || "",
                        alias: field.alias || [],
                    })),
                }));

                return {
                    name: group.name || "",
                    description: group.description || "",
                    fields,
                    tables,
                };
            }) : [];


            const reqObj = {
                "document_dictionary": [{
                    "fields": documentDictionaryFieldsObj,
                    "groups": documentDictionaryGroupsObj,
                    "tables": documentDictionaryTablesObj
                }],
                "metadata": extractionSchemaMetaData
            }

            if (validateSchema) {
                const validation_response = await handleSchemaValidation(reqObj, selectedFileUrl, selectedFileName)
                if (validation_response?.is_valid) {
                    const templateSettingsRes = await templateSettingsSave(reqObj);
                    if (templateSettingsRes.status === 200) {
                        alert('Configuration saved successfully');
                        handleFileUpadte(selectedFileData, 'extraction')
                        onSave()
                        await fetchDomainDictionarySchema(appflyteData)
                    } else {
                        alert('Failed to save confiuration, try again');
                    }
                } else {
                    alert(validation_response?.issues?.map((issue) => issue).join('\n'));
                }
            }
            else {
                const templateSettingsRes = await templateSettingsSave(reqObj);
                if (templateSettingsRes.status === 200) {
                    alert('Configuration saved successfully');
                    handleFileUpadte(selectedFileData, 'extraction')
                    onSave()
                    await fetchDomainDictionarySchema(appflyteData)
                } else {
                    alert('Failed to save confiuration, try again');
                }
            }
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
        }
    }

    const templateSettingsSave = async (settings_data) => {
        try {
            if (documentSchemaData.data_status && documentSchemaData.__auto_id__ && documentSchemaData.update_key) {
                const settingsObject = {
                    id: documentSchemaData.__auto_id__,
                    fields: [
                        { path: '$.settings', value: settings_data },
                        { path: '$.document_type', value: documentTypeData.__auto_id__ }
                    ]
                };

                const convertedData = convertFloatsToStrings(settingsObject);

                const response = await AmeyaSettingsApi.updateTemplateSettings(appflyte_details, JSON.stringify(convertedData, null, 2), documentSchemaData.__auto_id__, documentSchemaData.update_key)
                return response
            } else {
                const settingsObject = {
                    collection_item: {
                        project_id: appflyte_details.appflyte_project_id,
                        created_on: moment().format("DD-MM-YYYY HH:mm:ss"),
                        settings: settings_data,
                        document_type: documentTypeData.__auto_id__
                    }
                };

                const convertedData = convertFloatsToStrings(settingsObject);
                const response = await AmeyaSettingsApi.addTemplateSettings(appflyte_details, JSON.stringify(convertedData, null, 2))
                return response
            }
        } catch (error) {
            console.log(error)
        }
    }

    // -----------------------------|Extraction Handling|-----------------------------------//
    const handleSchemaGeneration = async (file_url, file_name) => {
        try {
            const response_file = await fetch(file_url);
            if (!response_file.ok) {
                throw new Error('Failed to fetch file from URL');
            }
            const blob = await response_file.blob();
            const file = new File([blob], file_name, { type: blob.type });
            const formData = new FormData();
            formData.append('files', file);
            formData.append('document_type', documentTypeData.master_document);
            const response = await AmeyaSettingsApi.generateSchema(appflyte_details, formData);
            if (response.status === 200) {
                const response_data = response?.data ?? {};
                return response_data;
            }
        } catch (error) {
            console.log(error)
            return
        }
    }

    const handleSchemaValidation = async (schema_data, file_url, file_name) => {
        try {
            const response_file = await fetch(file_url);
            if (!response_file.ok) {
                throw new Error('Failed to fetch file from URL');
            }
            const blob = await response_file.blob();
            const blob_file = new File([blob], file_name, { type: blob.type });
            const formData = new FormData();
            formData.append('files', blob_file);
            formData.append('document_type', documentTypeData.master_document);
            formData.append('document_schema', JSON.stringify(schema_data));

            const response = await AmeyaSettingsApi.validateSchema(appflyte_details, formData);
            if (response.status === 200) {
                const response_data = response?.data ?? {};
                return response_data;
            }
        } catch (error) {
            console.log(error)
            return false
        }
    }

    const handleGetFieldDetails = async (item_type, field_name, item_index, table_index, group_index) => {
        try {
            const cleanedFieldName = field_name?.trim();
            if (!cleanedFieldName) return;

            const schema_data = {
                document_dictionary: [{
                    fields: domainDictionaryFields,
                    groups: domainDictionaryGroups,
                    tables: domainDictionaryTables
                }],
                metadata: extractionSchemaMetaData
            };

            const formData = new FormData();
            formData.append('field_name', cleanedFieldName);
            formData.append('document_type', documentTypeData.master_document);
            formData.append('document_schema', JSON.stringify(schema_data));

            const response = await AmeyaSettingsApi.getfieldDetails(appflyte_details, formData);


            if (response.status === 200) {
                const responseData = response?.data ?? {};
                responseData.alias = []

                const domainMap = {
                    fields: domainDictionaryFields,
                    tables: domainDictionaryTables,
                    group_fields: domainDictionaryGroups,
                    group_table_fields: domainDictionaryGroups
                };

                const updateFns = {
                    fields: setDomainDictionaryFields,
                    tables: setDomainDictionaryTables,
                    group_fields: setDomainDictionaryGroups,
                    group_table_fields: setDomainDictionaryGroups
                };

                const updatedResponse = await handleNewFieldAdd(domainMap[item_type], responseData, item_type, item_index, table_index, group_index);

                updateFns[item_type](updatedResponse);
            }
        } catch (error) {
            console.error("Error in handleGetFieldDetails:", error);
        }
    };

    const handleDataExtraction = async (fileUrl, file_name, file_id, template_schema_data) => {
        const pollInterval = 3000;
        // const timeout = 30000;
        try {

            const commonInputs = {
                pdf_parser_block: { file_path: fileUrl },
            };

            const reqObj = {
                inputs: {
                    ...commonInputs,
                    ...(extractionVersion === "v1"
                        ?
                        {
                            entity_extraction_block: {
                                filter: ["CARDINAL", "DATE", "ORG", "MONEY", "EMAIL", "PHONE", "PERSON"],
                                file_id: file_id,
                                pdf_filename: file_name,
                                document_type: documentTypeData.master_document,
                                document_type_id: documentTypeData.__auto_id__,
                                project_id: appflyte_details.appflyte_project_id
                            }
                        }
                        :
                        {
                            entity_extraction_block_v2: {
                                filter: ["DATE", "TIME", "ADDRESS", "EMAIL", "PHONE"],
                                file_id: file_id,
                                pdf_filename: file_name,
                                schema: template_schema_data,
                                document_type: documentTypeData.master_document,
                                document_type_id: documentTypeData.__auto_id__,
                                project_id: appflyte_details.appflyte_project_id,
                                upload_via: 'API'
                            }
                        }
                    )
                }
            };

            const extractionResponse = await AmeyaSettingsApi.startExtraction(appflyte_details, JSON.stringify(reqObj), appflyte_details.pipeline_id);
            if (extractionResponse?.status !== 200) {
                console.error("Extraction initiation failed.");
                // alert("Extraction initiation failed.")
                return false;
            }

            const pipeline_exec_id = extractionResponse.data?.pipeline_exec_id;
            if (!pipeline_exec_id) {
                // alert("Pipeline execution failed.")
                console.error("Missing pipeline execution ID.");
                return false;
            }

            await new Promise(resolve => setTimeout(resolve, 3000));

            const pollPipelineStatus = () => {
                return new Promise((resolve) => {
                    let elapsedTime = 0;
                    let shouldContinue = true;
                    const intervalId = setInterval(async () => {

                        if (!shouldContinue) {
                            return;
                        }

                        elapsedTime += pollInterval;

                        try {
                            const statusRes = await AmeyaSettingsApi.getPipelineStatus(appflyte_details, pipeline_exec_id);

                            if (statusRes?.status === 200) {
                                const pipeline_status = statusRes.data?.status;

                                if (pipeline_status === "completed") {
                                    clearInterval(intervalId);
                                    console.log("Pipeline completed.");
                                    resolve(true);
                                } else if (pipeline_status === "failed") {
                                    clearInterval(intervalId);
                                    // alert("Pipeline failed try again.")
                                    console.error("Pipeline failed.");
                                    resolve(false);
                                }
                            } else {
                                shouldContinue = false;
                            }

                            if (statusRes === null) {
                                shouldContinue = false;
                            }
                        } catch (error) {
                            clearInterval(intervalId);
                            console.error("Error during pipeline polling:", error);
                            apiErrorHandler(error)
                            resolve(false);
                        }

                        // if (elapsedTime >= timeout) {
                        //     clearInterval(intervalId);
                        //     alert("Pipeline timeout  try again.")
                        //     console.error("Pipeline timeout: failed after 30 seconds.");
                        //     resolve(false);
                        // }
                    }, pollInterval);
                });
            };

            return await pollPipelineStatus();
        } catch (error) {
            console.error("Unhandled error in handleDataExtraction:", error);
            apiErrorHandler(error);
            return false;
        }
    };

    const handleFetchLayout = async (template_schema_data, source_filename) => {
        try {
            let entityResponse = null;
            const updatedSchemaData = await lowercaseStrings(template_schema_data);
            if (extractionVersion === "v1") {
                entityResponse = await AmeyaSettingsApi.fetchLayout(appflyte_details, JSON.stringify(updatedSchemaData), source_filename);
            } else {
                entityResponse = await AmeyaSettingsApi.fetchLayoutV1(appflyte_details, JSON.stringify(updatedSchemaData), source_filename);
            }
            if (entityResponse.status === 200) {
                const entityResponseData = entityResponse?.data ?? {};
                return entityResponseData;
            }
            return null;
        } catch (error) {
            console.log(error)
            apiErrorHandler(error)
            return null
        }
    }

    const handleExtractionResult = async (schemaResponse, entityResponse) => {
        try {
            const extractionSchema = schemaResponse?.document_dictionary?.[0] ?? {};
            const { fields: schemaFields = [], tables: schemaTables = [], groups: schemaGroups = [] } = extractionSchema;

            const extractionEntities = entityResponse?.files?.[0] ?? {};
            const { mapped_fields: entityFields = {}, tables: entityTables = [], groups: entityGroups = [] } = extractionEntities;

            const updatedFields = await handleExtractionFields(schemaFields, entityFields);
            const updatedTables = await handleExtractionTables(schemaTables, entityTables);
            const updatedGroups = await handleExtractionGroups(schemaGroups, entityGroups);

            setDomainDictionaryFields(updatedFields);
            setDomainDictionaryTables(updatedTables)
            setDomainDictionaryGroups(updatedGroups);
            setExtractionResponse(entityResponse);
            setFilter(false)
            return
        }
        catch (error) {
            console.log(error)
        }
    }

    const handleResponsePreview = (result) => {
        const transformedFiles = result.files.map(file => {
            const { mapped_fields, tables, groups, ...other } = file;
            return {
                mapped_fields: mapped_fields ?? {},
                tables: tables ?? [],
                groups: groups ?? [],
                other,
            };
        });
        setExtractionResponseData({ files: transformedFiles });
    }

    const handleExtraction = async (fileUrl, fileName, file_id, selectedFile) => {
        setExtractionLoading(true)
        try {
            if (settingsJsonStatus || revalidateStatus) {
                const schemaData = {
                    "document_dictionary": [{
                        "fields": domainDictionaryFields,
                        "groups": domainDictionaryGroups,
                        "tables": domainDictionaryTables
                    }],
                    "metadata": extractionSchemaMetaData
                }

                if (validateSchema) {
                    const validationResult = await handleSchemaValidation(schemaData, fileUrl, fileName);
                    if (validationResult?.is_valid) {
                        handleFileUpadte(selectedFile, 'valid_schema');

                        const extractionResult = await handleDataExtraction(fileUrl, fileName, file_id, schemaData);
                        if (extractionResult) {
                            const layoutResponse = await handleFetchLayout(schemaData, fileName);
                            if (layoutResponse) {
                                const response = extractionVersion === "v1" ? (layoutResponse?.pages ?? {}) : (layoutResponse ?? {});
                                setExtractionResponse(response);
                                await handleExtractionResult(schemaData, response)
                                handleSearchKeyGeneration(response)
                                handleResponsePreview(response)
                                return true;
                            }
                            return false
                        }
                    }
                    else {
                        alert('Invalid document. Please check the file and try again.');
                        setFileDoc(null);
                        setSelectedFileName(null);
                        setSelectedFileData(null)
                        setSelectedFileUrl(null);
                        setAnnotations({});
                        setSelectedAnnotation(null);
                        setSerachKeysData([]);
                        setPageTextItems([]);
                        setRevalidateStatus(false)
                    }
                }
                else {
                    const extractionResult = await handleDataExtraction(fileUrl, fileName, file_id, schemaData);
                    if (extractionResult) {
                        const layoutResponse = await handleFetchLayout(schemaData, fileName);
                        if (layoutResponse) {
                            const response = extractionVersion === "v1" ? (layoutResponse?.pages ?? {}) : (layoutResponse ?? {});
                            setExtractionResponse(response);
                            await handleExtractionResult(schemaData, response)
                            handleSearchKeyGeneration(response)
                            handleResponsePreview(response)
                            return true;
                        }
                        return false
                    }
                }
                return false;
            }
            else {
                if (extractionVersion === "v1") {
                    const [schemaResponse, extractionResponse] = await Promise.all([
                        handleSchemaGeneration(fileUrl, fileName),
                        handleDataExtraction(fileUrl, fileName, file_id)
                    ]);
                    if (schemaResponse && extractionResponse) {
                        const extractionMetadata = schemaResponse?.metadata ?? {};
                        setExtractionSchemaMetaData(extractionMetadata)

                        const extractionDictionary = schemaResponse?.document_dictionary ?? [];
                        const { updatedFields, updatedTables, updatedGroups } = await handleConstructFieldData(extractionDictionary);
                        setDomainDictionaryFields(updatedFields);
                        setDomainDictionaryTables(updatedTables)
                        setDomainDictionaryGroups(updatedGroups);

                        const response = await handleFetchLayout(schemaResponse, fileName);
                        if (response) {
                            const pages = response?.pages ?? {};
                            await handleExtractionResult(schemaResponse, pages)
                            handleSearchKeyGeneration(pages)
                            handleResponsePreview(pages)
                            return true
                        }
                        return false
                    } else {
                        alert('Extraction request failed. Please try again.');
                        return false
                    }
                }
                else {
                    const schemaResponse = await handleSchemaGeneration(fileUrl, fileName);
                    if (schemaResponse) {
                        const extractionMetadata = schemaResponse?.metadata ?? {};
                        setExtractionSchemaMetaData(extractionMetadata)

                        const extractionResponse = await handleDataExtraction(fileUrl, fileName, file_id, schemaResponse);
                        if (extractionResponse) {
                            const response = await handleFetchLayout(schemaResponse, fileName);
                            if (response) {
                                await handleExtractionResult(schemaResponse, response)
                                handleSearchKeyGeneration(response)
                                handleResponsePreview(response)
                                return true
                            }
                            return false
                        }
                    } else {
                        alert('Extraction request failed. Please try again.');
                        return false
                    }
                }
            }
        } catch (error) {
            console.error('Error in handleExtraction:', error);
            apiErrorHandler(error)
            return false
        } finally {
            setExtractionLoading(false)
        }
    }

    const fetchExistingExtraction = async (fileId) => {
        setExtractionLoading(true)
        try {
            const subscriber_id = appflyteData.appflyte_subscriber_id;
            const subscription_id = appflyteData.appflyte_subscription_id;
            const file_path = `subscriber/${subscriber_id}/subscription_id/${subscription_id}/extracted/${fileId}.json`;

            const response = await AppflyteServiceApi.getDownloadUrl(appflyte_details, file_path);
            if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
                const responseData = response.data[0] ?? {};
                const file_url = Object.values(responseData)[0] ?? null;
                const fileResponse = await axios.get(file_url);

                if (fileResponse.status !== 200) {
                    return false
                }

                const jsonData = fileResponse.data ?? {};
                const schemaData = {
                    "document_dictionary": [{
                        "fields": domainDictionaryFields,
                        "groups": domainDictionaryGroups,
                        "tables": domainDictionaryTables
                    }],
                    "metadata": extractionSchemaMetaData
                }

                setExtractionResponse(jsonData);
                await handleExtractionResult(schemaData, jsonData)
                handleSearchKeyGeneration(jsonData)
                handleResponsePreview(jsonData)
                return true;
            }
            return false;
        } catch (error) {
            console.log(error)
            return false
        } finally {
            setExtractionLoading(false)
        }
    }

    // ------------------------------[pdf]--------------------------
    const renderPDFPage = useCallback(async (pdf, pageNum) => {
        try {
            const page = await pdf.getPage(pageNum);
            const container = containerRef.current;
            if (!container) {
                console.error('Container ref missing');
                return;
            }

            const containerWidth = container.clientWidth || container.getBoundingClientRect().width;
            const defaultViewport = page.getViewport({ scale: 1 });
            const dynamicScale = containerWidth / defaultViewport.width;
            const cappedScale = Math.min(dynamicScale, 3);

            const viewport = page.getViewport({ scale: cappedScale });
            const canvas = pdfCanvasRef.current;
            const annotationCanvas = canvasRef.current;

            if (!canvas || !annotationCanvas) {
                console.error('Canvas refs missing');
                return;
            }

            const devicePixelRatio = window.devicePixelRatio || 1;
            [canvas, annotationCanvas].forEach(c => {
                c.width = viewport.width * devicePixelRatio;
                c.height = viewport.height * devicePixelRatio;
                c.style.width = `${viewport.width}px`;
                c.style.height = `${viewport.height}px`;
            });

            container.style.height = `${viewport.height}px`;
            container.style.width = '';

            const context = canvas.getContext('2d');
            context.scale(devicePixelRatio, devicePixelRatio);
            const annotationContext = annotationCanvas.getContext('2d');
            annotationContext.scale(devicePixelRatio, devicePixelRatio);

            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
                renderTaskRef.current = null;
            }
            renderTaskRef.current = page.render({ canvasContext: context, viewport });
            try {
                await renderTaskRef.current.promise;
            } catch (error) {
                if (error.name === 'RenderingCancelledException') {
                    console.log(`Rendering cancelled for page ${pageNum}`);
                    return;
                }
                throw error;
            }
            renderTaskRef.current = null;

            let textItems = [];
            let isOcr = false;
            try {
                const textContent = await page.getTextContent();
                textItems = textContent.items.map(item => ({
                    str: item.str.trim(),
                    x: item.transform[4] * cappedScale,
                    y: viewport.height - (item.transform[5] * cappedScale) - (item.height * cappedScale),
                    width: item.width * cappedScale,
                    height: (item.height || 12) * cappedScale,
                    fontName: item.fontName || 'unknown',
                    dir: item.dir || 'ltr',
                    originalY: item.transform[5],
                })).filter(item => item.str);
                const noTextFound = textItems.length === 0 || textItems.every(item => !item.str);
                if (noTextFound) {
                    setIsOcrProcessing(true);
                    console.log(`No text found, performing OCR for page ${pageNum}`);
                    isOcr = true;
                    try {
                        textItems = await performOCR(page, renderTaskRef, cappedScale, viewport);
                    } catch (ocrError) {
                        console.warn('OCR failed, proceeding with extracted text', ocrError);
                    } finally {
                        setIsOcrProcessing(false);
                    }
                }
            } catch (error) {
                setIsOcrProcessing(true);
                console.warn(`Text extraction failed, using OCR for page ${pageNum}`, error);
                isOcr = true;
                try {
                    textItems = await performOCR(page, renderTaskRef, cappedScale, viewport);
                } catch (ocrError) {
                    console.warn('OCR failed, proceeding without text', ocrError);
                } finally {
                    setIsOcrProcessing(false);
                }
            }
            setPageTextItems(textItems.map(item => ({
                ...item,
                isOcr
            })));
            return textItems;
        } catch (error) {
            console.error('Error in renderPDFPage:', error);
        }
    }, []);

    useEffect(() => {
        if (fileType === 'pdf' && fileDoc && pageNumber && previewType) {
            renderPDFPage(fileDoc, pageNumber)
        }
    }, [scale, fileType, fileDoc, pageNumber, previewType, renderPDFPage, loading]);

    // --------------------------------[Excel]----------------------
    const waitForContentRef = (timeout = 10000) => {
        return new Promise((resolve) => {
            if (contentRef.current && contentRef.current.innerHTML && contentRef.current.innerHTML.trim() !== '') {
                resolve(contentRef.current);
                return;
            }

            let checkCount = 0;
            const maxChecks = timeout / 100;

            const checkContentRef = () => {
                checkCount++;
                if (contentRef.current && contentRef.current.innerHTML && contentRef.current.innerHTML.trim() !== '') {
                    resolve(contentRef.current);
                    return;
                }
                if (checkCount >= maxChecks) {
                    resolve(null);
                    return;
                }
                setTimeout(checkContentRef, 100);
            };
            setTimeout(checkContentRef, 100);
        });
    };

    const extractTextFromExcel = useCallback(async (uri) => {
        if (fileType === "xlsx") {
            try {
                if (!uri) {
                    console.error('Invalid URI:', uri);
                    return [];
                }

                let contentElement = await waitForContentRef();
                if (!contentElement) {
                    console.warn('contentRef not available');
                    return [];
                }

                const textItems = [];
                const container = containerRef.current;
                if (!container) {
                    console.warn('containerRef not set');
                    return [];
                }

                const containerRect = container.getBoundingClientRect();
                const scrollTop = container.scrollTop;
                const scrollLeft = container.scrollLeft;
                const scale = 1;

                const selectors = fileType === 'xlsx' ? 'td:not(.merged)' : 'p, td, h1, h2, h3, h4, h5, h6, li, span, div';
                const renderedElements = contentElement.querySelectorAll(selectors);

                if (renderedElements.length === 0) {
                    console.warn('No rendered elements found');
                    return [];
                }

                renderedElements.forEach((element) => {
                    const text = element.textContent?.trim();
                    if (text) {
                        try {
                            const rect = element.getBoundingClientRect();
                            const x = (rect.left - containerRect.left + scrollLeft) / scale;
                            const y = (rect.top - containerRect.top + scrollTop) / scale;
                            const width = rect.width / scale;
                            const height = rect.height / scale;

                            if (width > 0 && height > 0 && x >= 0 && y >= 0) {
                                const style = getComputedStyle(element);
                                textItems.push({
                                    str: text,
                                    x,
                                    y,
                                    width,
                                    height,
                                    fontName: style.fontFamily || 'Calibri',
                                    fontWeight: style.fontWeight,
                                    fontStyle: style.fontStyle,
                                    fontSize: style.fontSize,
                                    color: style.color,
                                    dir: style.direction || 'ltr',
                                    originalY: y,
                                    element: element.tagName.toLowerCase(),
                                    domElement: element
                                });
                            }
                        } catch (error) {
                            console.warn('Error processing element', element.tagName, error);
                        }
                    }
                });

                return textItems;
            } catch (error) {
                console.error('Error extracting text from non-PDF:', error);
                return [];
            }
        }
    }, [fileType]);

    useEffect(() => {
        if (content && fileType === 'xlsx' && selectedFileUrl) {
            const attemptExtract = async (attempts = 5, delay = 1000) => {
                await new Promise(resolve => setTimeout(resolve, 500));
                for (let i = 0; i < attempts; i++) {
                    const textItems = await extractTextFromExcel(selectedFileUrl);
                    if (textItems.length > 0) {
                        setPageTextItems(textItems);
                        return;
                    }
                    if (i < attempts - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
                setPageTextItems([]);
            };
            attemptExtract();
        }
    }, [content, fileType, selectedFileUrl, extractTextFromExcel]);

    const parseExcelFile = async (uri, selectedSheetName) => {
        try {
            const response = await fetch(uri, { method: 'GET', mode: 'cors' });
            if (!response.ok) {
                throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });
            const sheetName = selectedSheetName || workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }).slice(0, visibleRows);
            const merges = worksheet['!merges'] || [];
            const colWidths = worksheet['!cols'] || [];
            const rowHeights = worksheet['!rows'] || [];

            setSheetNames(workbook.SheetNames);
            if (!selectedSheetName) setSelectedSheet(workbook.SheetNames[0]);

            const maxCols = jsonData.reduce((max, row) => Math.max(max, row.length), 0);
            const columnLetters = Array.from({ length: maxCols }, (_, i) => XLSX.utils.encode_col(i));

            const htmlContent = `
                    <div class="excel-table-wrapper">
                        <table class="document-content xlsx">
                            <thead>
                                <tr>
                                    <th class="corner" style="width: 50px;"></th> 
                                        ${columnLetters.map((letter, colIndex) =>
                `<th class="column-header" style="width: ${colWidths[colIndex]?.wpx || 100}px;">${letter}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${jsonData.map((row, rowIndex) => {
                    const rowHeight = rowHeights[rowIndex]?.hpx || 24;
                    return `
                                         <tr style="height: ${rowHeight}px;">
                                            <th class="row-header" style="width: 50px;">${rowIndex + 1}</th>
                                            ${columnLetters.map((_, colIndex) => {
                        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                        const cellObj = worksheet[cellRef] || {};
                        const cellValue = row[colIndex] || '';
                        const cellStyle = cellObj.s || {};
                        const width = colWidths[colIndex]?.wpx || 100;
                        const isMerged = merges.find(merge =>
                            rowIndex >= merge.s.r && rowIndex <= merge.e.r &&
                            colIndex >= merge.s.c && colIndex <= merge.e.c
                        );
                        const style = {
                            fontWeight: cellStyle.font?.bold ? 'bold' : 'normal',
                            fontStyle: cellStyle.font?.italic ? 'italic' : 'normal',
                            fontSize: cellStyle.font?.sz ? `${cellStyle.font.sz}pt` : '10pt',
                            color: cellStyle.font?.color?.rgb ? `#${cellStyle.font.color.rgb.slice(2)}` : '#000000',
                            backgroundColor: cellStyle.fill?.fgColor?.rgb ? `#${cellStyle.fill.fgColor.rgb.slice(2)}` : '#ffffff',
                            textAlign: cellStyle.alignment?.horizontal || 'left',
                            verticalAlign: cellStyle.alignment?.vertical || 'middle',
                            width: `${width}px`,
                            minWidth: `${width}px`,
                            height: `${rowHeight}px`
                        };
                        const mergeAttrs = isMerged ? `colspan="${isMerged.e.c - isMerged.s.c + 1}" rowspan="${isMerged.e.r - isMerged.s.r + 1}" class="merged"` : '';
                        if (isMerged && (rowIndex !== isMerged.s.r || colIndex !== isMerged.s.c)) return '';
                        const styleStr = Object.entries(style).map(([k, v]) => `${k}: ${v}`).join(';');
                        return `<td ${mergeAttrs} style="${styleStr}">${cellValue}</td>`;
                    }).join('')}
                                        </tr>`;
                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;

            return { htmlContent, jsonData };
        } catch (error) {
            console.error('Error parsing Excel file:', error);
            throw error;
        }
    };

    const loadExcelDocument = async () => {
        setLoading(true);
        try {
            const response = await fetch(selectedFileUrl, { method: 'GET', mode: 'cors' });
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`);
            }
            const { htmlContent } = await parseExcelFile(selectedFileUrl, selectedSheet);
            setContent(htmlContent);
            setTotalPages(1);
            setPageNumber(1);
        } catch (error) {
            console.error('Error rendering excel document:', error);
            setContent('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (fileType === 'xlsx' && selectedFileUrl && containerRef.current) {
            loadExcelDocument();
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (canvas && container) {
                const updateCanvasSize = () => {
                    const containerRect = container.getBoundingClientRect();
                    const devicePixelRatio = window.devicePixelRatio || 1;
                    canvas.width = containerRect.width * devicePixelRatio;
                    canvas.height = containerRect.height * devicePixelRatio;
                    canvas.style.width = `${containerRect.width}px`;
                    canvas.style.height = `${containerRect.height}px`;
                    const ctx = canvas.getContext('2d');
                    ctx.scale(devicePixelRatio, devicePixelRatio);
                };
                updateCanvasSize();
                const resizeObserver = new ResizeObserver(updateCanvasSize);
                resizeObserver.observe(container);
                return () => resizeObserver.disconnect();
            }
        }
    }, [fileType, selectedFileUrl, selectedSheet]);

    // --------------------------[Word File]---------------------------------
    function extractWordTextItems(container) {
        const textItems = [];
        const elements = container.querySelectorAll('p, span, td, li, h1, h2, h3, h4, h5, h6');

        const containerRect = container.getBoundingClientRect();
        const scrollTop = container.scrollTop;
        const scrollLeft = container.scrollLeft;
        const scale = 1;

        const measureWord = (word, style) => {
            const tempSpan = document.createElement('span');
            tempSpan.style.position = 'absolute';
            tempSpan.style.visibility = 'hidden';
            tempSpan.style.whiteSpace = 'nowrap';
            tempSpan.style.fontFamily = style.fontFamily;
            tempSpan.style.fontWeight = style.fontWeight;
            tempSpan.style.fontStyle = style.fontStyle;
            tempSpan.style.fontSize = style.fontSize;
            tempSpan.textContent = word;

            document.body.appendChild(tempSpan);
            const wordRect = tempSpan.getBoundingClientRect();
            document.body.removeChild(tempSpan);

            return wordRect;
        };

        elements.forEach(element => {
            try {
                const fullText = element.textContent.trim();
                if (!fullText) return;

                const style = getComputedStyle(element);
                const elementRect = element.getBoundingClientRect();

                const words = fullText.split(/\s+/);
                let currentXOffset = 0;

                words.forEach(word => {
                    if (!word) return;

                    const wordRect = measureWord(word, style);

                    const width = Math.ceil(wordRect.width / scale);
                    const height = Math.ceil(wordRect.height / scale);
                    const x = (elementRect.left + currentXOffset - containerRect.left + scrollLeft) / scale;
                    const y = (elementRect.top - containerRect.top + scrollTop) / scale;

                    if (width > 0 && height > 0 && x >= 0 && y >= 0) {
                        textItems.push({
                            str: word,
                            x,
                            y,
                            width,
                            height,
                            fontName: style.fontFamily || 'Inter',
                            fontWeight: style.fontWeight,
                            fontStyle: style.fontStyle,
                            fontSize: style.fontSize,
                            color: style.color,
                            dir: style.direction || 'ltr',
                            domElement: element,
                            element: element.tagName.toLowerCase(),
                        });
                    }
                    currentXOffset += width + 2;
                });
            } catch (error) {
                console.warn('Error processing element', element.tagName, error);
            }
        });
        return textItems;
    }

    const loadWordDocument = async () => {
        const response = await fetch(selectedFileUrl, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            throw new Error('Failed to fetch file: ' + response.statusText);
        }
        const fileBlob = await response.blob();
        if (fileBlob && contentRef.current) {
            contentRef.current.innerHTML = '';
            await renderAsync(fileBlob, contentRef.current, null, { breakPages: true });
            const wrapper = contentRef.current.querySelector('div.docx-wrapper');
            if (!wrapper) throw new Error('Document wrapper not found');
            const pages = Array.from(wrapper.children);

            setDocxPages(pages);
            setTotalPages(pages.length);
            setPageNumber(1);

            contentRef.current.innerHTML = '';
            if (pages.length > 0) {
                contentRef.current.appendChild(pages[0]);
                const textItems = extractWordTextItems(pages[0]);
                setPageTextItems(textItems);
            }
        }
    };

    useEffect(() => {
        if (previewType === 'file_preview' && fileType === 'docx' && selectedFileUrl) {
            setDocxPages([]);
            setPageNumber(1);
            setPageTextItems([]);
            if (contentRef.current) {
                contentRef.current.innerHTML = '';
            }
            loadWordDocument();
        }
    }, [previewType, fileType, selectedFileUrl]);

    useEffect(() => {
        if (fileType === 'docx' && fileDoc?.uri) {
            loadWordDocument();
        }
    }, [fileType, fileDoc, selectedFileUrl]);

    useEffect(() => {
        if (fileType === 'docx' && docxPages.length > 0 && contentRef.current) {
            contentRef.current.innerHTML = '';
            const pageIndex = pageNumber - 1;
            if (docxPages[pageIndex]) {
                contentRef.current.appendChild(docxPages[pageIndex]);
                const textItems = extractWordTextItems(docxPages[pageIndex]);
                setPageTextItems(textItems);
            }
        }
    }, [pageNumber, docxPages, fileType]);

    const handlePageScroll = async (event) => {
        if (searchTerm) return;
        const listboxNode = event.currentTarget;
        if (!loadingMore && fileLastEvaluatedKey && listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 10) {
            setLoadingMore(true);
            const { data: newFiles, lastEvaluatedKey: newKey } = await fetchAllExtractionFiles(appflyte_details, fileLastEvaluatedKey);
            setExtractionFiles(prev => [...prev, ...newFiles]);
            setFileLastEvaluatedKey(newKey);
            setLoadingMore(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm || searchTerm.trim() === "") {
            setIsSearching(false);
            setSearchResults([]);
            setSearchTerm(null);
            return;
        }

        setDataloading(true);
        setIsSearching(true);

        const localMatches = extractionFiles.filter(file =>
            file?.payload?.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (localMatches.length > 0) {
            setSearchResults(localMatches);
            setDataloading(false);
            return;
        }

        const { data } = await searchExtractionFiles(appflyte_details, searchTerm);
        if (data && data.length > 0) {
            setSearchResults(data);
        } else {
            setIsSearching(false);
            setSearchResults([]);
            setSearchTerm(null);
        }
        setDataloading(false);
    };

    const handleExtractionFileSelection = async (selectedFile, type) => {
        setFileLoading(true);
        try {

            setExtractionResponse({});
            setSheetNames([]);
            setSelectedSheet(null);
            setDocxPages([])
            setContent('');
            setAnnotations({});
            setSelectedAnnotation(null);
            setPageTextItems([]);
            isRendered.current = false;

            if (!window.pdfjsLib) {
                console.warn('PDF.js is still loading. Please try again shortly.');
                return;
            }

            const { file_url: fileUrl = '', file_name: fileName = '', file_id: fileId } = selectedFile.payload;
            if (!fileUrl || typeof fileUrl !== 'string') {
                alert('Invalid file, please try again.');
                console.error('Invalid fileUrl:', fileUrl);
                return;
            }

            const cleanedUrl = new URL(fileUrl).origin + new URL(fileUrl).pathname;
            let fileExtension = fileName.split('.').pop()?.toLowerCase();

            if (!fileExtension) {
                console.error('No file extension found for fileName:', fileName);
                alert('Invalid file, please try again.');
                return;
            }

            if (!["docx", "xlsx", "pdf"].includes(fileExtension)) {
                return;
            }

            if (type === 'init') {
                const extractionTasks = await getAllExtarctionTasks(appflyte_details, fileId);
                const taskData = (extractionTasks || []).find(t => t?.payload?.file_id === fileId);

                if (taskData) {
                    const extractionResponse = await fetchExistingExtraction(fileId);
                    if (!extractionResponse) {
                        await handleExtraction(cleanedUrl, fileName, fileId, selectedFile);
                    }
                } else {
                    await handleExtraction(cleanedUrl, fileName, fileId, selectedFile);
                }
            } else {
                await handleExtraction(cleanedUrl, fileName, fileId, selectedFile);
            }

            setFileType(fileExtension);
            setSelectedFileName(fileName);
            setSelectedFileData(selectedFile);
            setSelectedFileUrl(cleanedUrl);

            if (fileExtension === 'docx' || fileExtension === 'xlsx') {
                setFileDoc({ uri: cleanedUrl, fileType: fileExtension });
                setTotalPages(1);
                setPageNumber(1);
            }

            if (fileExtension === "pdf") {
                const pdfDoc = await window.pdfjsLib.getDocument(cleanedUrl).promise;
                setTotalPages(pdfDoc.numPages);
                setPageNumber(1);
                setFileDoc(pdfDoc);
            }
            setRevalidateStatus(true);
        } catch (error) {
            console.log('Error in handleExtractionFileSelection:', error);
        } finally {
            setFileLoading(false);
        }
    }

    useEffect(() => {
        if (selectedExtractionFile) {
            if (!settingsJsonStatus) {
                setDomainDictionaryFields([])
                setDomainDictionaryGroupTables([])
                setDomainDictionaryGroups([])
            }
            handleExtractionFileSelection(selectedExtractionFile, 'init');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedExtractionFile]);

    const resizeCanvas = useCallback(() => {
        if (canvasRef.current && relativeRef.current) {
            const { offsetWidth, offsetHeight } = relativeRef.current;
            canvasRef.current.width = offsetWidth;
            canvasRef.current.height = offsetHeight;
        }
    }, []);

    useEffect(() => {
        if (fileType === 'docx' && pageTextItems.length > 0) {
            resizeCanvas();
        }
    }, [pageTextItems, resizeCanvas]);

    const handleAddNewFile = async (event) => {
        setLoading(true)
        try {
            const file = event.target.files[0];
            if (!file) {
                alert('Please select a file.');
                return;
            }

            const file_selected = Array.from(event.target.files);
            if (file_selected) {
                setRevalidateStatus(false);
                const upload_response = await handleDocumentUpload(appflyte_details, file_selected[0]);
                if (upload_response.status === 200) {
                    const save_response = await saveInBackend(appflyte_details, upload_response.fileName, upload_response.fileUrl, upload_response.fileId);
                    if (save_response.status === 200) {
                        const responseData = save_response.data || {};
                        setExtractionFiles(prev => [...prev, responseData]);
                        setSelectedExtractionFile(responseData);
                    } else {
                        alert('Failed to save file, try again')
                    }
                } else {
                    alert('Failed to upload file, try again')
                }
            }
        } catch (error) {
            console.log('error', error)
        } finally {
            setLoading(false)
        }
    }

    const findKeywordCoordinates = async (keywordList, options = {}) => {
        const {
            color = '#C30E2E',
            padding = 4,
            caseSensitive = false,
            maxDistance = 20,
            maxXDistance = 20,
            // maxBoxWidth = 150,
            // maxBoxHeight = 100,
            maxBoxWidth = 800,
            maxBoxHeight = 100,
            fuzzyMatchThreshold = 0.9,
            onAnnotationAdded = () => { },
        } = options;

        try {
            const annotations_data = [];
            const notFoundKeywords = new Set(keywordList);

            const normalizeText = (text) => {
                return caseSensitive ? text : text.toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
            };
            const wordPositions = pageTextItems.map((item, index) => ({
                text: normalizeText(item.str),
                originalText: item.str,
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height || 12,
                index,
                confidence: item.confidence || 100,
            }));

            const calculateBoundingBox = (positions, keyword) => {
                const xStart = Math.min(...positions.map(p => p.x));
                const xEnd = Math.max(...positions.map(p => p.x + p.width));
                const yStart = Math.min(...positions.map(p => p.y));
                const yEnd = Math.max(...positions.map(p => p.y + p.height));
                const width = xEnd - xStart;
                const height = yEnd - yStart;

                if (width > maxBoxWidth || height > maxBoxHeight) {
                    console.warn(`Bounding box for "${keyword}" is too large: width=${width}, height=${height}`);
                    return null;
                }

                return [
                    { x: xStart - padding, y: yStart - padding },
                    { x: xEnd + padding, y: yStart - padding },
                    { x: xEnd + padding, y: yEnd + padding },
                    { x: xStart - padding, y: yEnd + padding },
                ];
            };

            const isSimilar = (text1, text2) => {
                const maxLen = Math.max(text1.length, text2.length);
                if (maxLen === 0) return 1.0;
                const distance = Array(text2.length + 1)
                    .fill(null)
                    .map(() => Array(text1.length + 1).fill(null));

                for (let i = 0; i <= text1.length; i++) distance[0][i] = i;
                for (let j = 0; j <= text2.length; j++) distance[j][0] = j;

                for (let j = 1; j <= text2.length; j++) {
                    for (let i = 1; i <= text1.length; i++) {
                        const indicator = text1[i - 1] === text2[j - 1] ? 0 : 1;
                        distance[j][i] = Math.min(distance[j][i - 1] + 1, distance[j - 1][i] + 1, distance[j - 1][i - 1] + indicator);
                    }
                }

                return 1 - distance[text2.length][text1.length] / maxLen;
            };

            const searchKeyword = (keyword, isMultiWord = false) => {
                const matches = [];
                const searchText = normalizeText(keyword);
                const isSpecialCharKeyword = keyword.includes('/') || keyword.includes('-');
                const fullRegex = new RegExp(searchText.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&'), caseSensitive ? '' : 'i');

                for (const item of wordPositions) {
                    const isExactMatch = fullRegex.test(item.text);
                    const isFuzzyMatch = item.confidence < 95 && isSimilar(item.text, searchText) >= fuzzyMatchThreshold;
                    if (isExactMatch || isFuzzyMatch) {
                        const coordinates = calculateBoundingBox([item], keyword);
                        if (coordinates) {
                            matches.push({
                                text: caseSensitive ? item.originalText : keyword,
                                label: 'KEYWORD',
                                color,
                                coordinates,
                                indices: [item.index],
                            });
                        }
                    }
                }

                if (isMultiWord && !isSpecialCharKeyword && matches.length === 0) {
                    const parts = searchText.split(/\s+/).filter(part => part);
                    for (let i = 0; i < wordPositions.length; i++) {
                        let partIndex = 0;
                        const matchedPositions = [];
                        let j = i;

                        while (partIndex < parts.length && j < wordPositions.length) {
                            const item = wordPositions[j];
                            const isAligned = !matchedPositions.length || (
                                Math.abs(item.y - matchedPositions[0].y) < maxDistance &&
                                Math.abs((item.x + (matchedPositions.length > 0 ? item.width : 0)) -
                                    (matchedPositions[matchedPositions.length - 1].x + matchedPositions[matchedPositions.length - 1].width)) < maxXDistance
                            );

                            const itemWords = item.text.split(/\s+/);
                            let partsMatched = 0;
                            for (let k = partIndex; k < parts.length && k - partIndex < itemWords.length; k++) {
                                const partRegex = new RegExp(parts[k].replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&'), caseSensitive ? '' : 'i');
                                const isPartFuzzyMatch = item.confidence < 95 && isSimilar(itemWords[k - partIndex], parts[k]) >= fuzzyMatchThreshold;
                                if (partRegex.test(itemWords[k - partIndex]) || isPartFuzzyMatch) {
                                    partsMatched++;
                                } else {
                                    break;
                                }
                            }

                            if (partsMatched > 0) {
                                matchedPositions.push(item);
                                partIndex += partsMatched;
                            } else if (isAligned) {
                                const partRegex = new RegExp(parts[partIndex].replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&'), caseSensitive ? '' : 'i');
                                const isPartFuzzyMatch = item.confidence < 95 && isSimilar(item.text, parts[partIndex]) >= fuzzyMatchThreshold;
                                if (partRegex.test(item.text) || isPartFuzzyMatch) {
                                    matchedPositions.push(item);
                                    partIndex++;
                                }
                            }

                            if (partIndex < parts.length && !partsMatched) {
                                for (let k = Math.max(0, i - 2); k < i; k++) {
                                    const prevItem = wordPositions[k];
                                    const prevAligned = Math.abs(prevItem.y - (matchedPositions[0]?.y || item.y)) < maxDistance &&
                                        Math.abs((prevItem.x + prevItem.width) - (matchedPositions[matchedPositions.length - 1]?.x || item.x)) < maxXDistance;
                                    const partRegex = new RegExp(parts[partIndex].replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&'), caseSensitive ? '' : 'i');
                                    const isPartFuzzyMatch = prevItem.confidence < 95 && isSimilar(prevItem.text, parts[partIndex]) >= fuzzyMatchThreshold;
                                    if (prevAligned && (partRegex.test(prevItem.text) || isPartFuzzyMatch)) {
                                        matchedPositions.push(prevItem);
                                        partIndex++;
                                        break;
                                    }
                                }
                            }

                            j++;

                            if (partIndex === parts.length) {
                                // console.log(`Matched "${keyword}" with positions:`, matchedPositions);
                                const coordinates = calculateBoundingBox(matchedPositions, keyword);
                                if (coordinates) {
                                    matches.push({
                                        text: keyword,
                                        label: 'KEYWORD',
                                        color,
                                        coordinates,
                                        indices: matchedPositions.map(p => p.index).sort((a, b) => a - b),
                                    });
                                }
                                i = j - 1;
                                break;
                            }
                        }
                    }
                }

                return matches;
            };

            const matchedKeywords = new Set();
            const correctedKeywordList = keywordList.map(keyword => {
                if (keyword.toLowerCase() === 'due dale') return 'Due date';
                return keyword;
            });

            for (const keyword of correctedKeywordList) {
                if (matchedKeywords.has(keyword)) {
                    console.log(`Skipping duplicate keyword "${keyword}"`);
                    continue;
                }
                const isMultiWord = keyword.includes(' ') && !keyword.includes('/') && !keyword.includes('-');
                const matches = searchKeyword(keyword, isMultiWord);

                if (matches.length > 0) {
                    notFoundKeywords.delete(keyword);
                    matchedKeywords.add(keyword);
                    for (const match of matches) {
                        const annotation = await addProgrammaticAnnotation(match, match.coordinates, pageNumber);
                        annotations_data.push(annotation);
                        onAnnotationAdded(annotation);
                    }
                } else {
                    console.log(`Keyword "${keyword}" not found in pageTextItems`);
                }
            }

            setAnnotations(prev => ({
                ...prev,
                [pageNumber]: [...(prev[pageNumber] || []).filter(ann => ann.label !== 'KEYWORD'), ...annotations_data],
            }));

            return { annotations_data, notFoundKeywords: Array.from(notFoundKeywords) };
        } catch (error) {
            console.error('Error in findKeywordCoordinates:', error);
            return { annotations_data: [], notFoundKeywords: keywordList };
        }
    };

    const defaultTextSearch = async () => {
        if (serachKeyData?.length > 0 && fileDoc && !valueChanging) {
            await findKeywordCoordinates(serachKeyData)
        } else {
            await findKeywordCoordinates([])
        }
    }

    useEffect(() => {
        defaultTextSearch()
    }, [pageTextItems, serachKeyData])

    const handleSearchKeyGeneration = (extraction_data) => {
        const searchKeys = generateSearchKeysNew(extraction_data);
        setSerachKeysData(searchKeys);
    }

    const changePage = useCallback(async (newPageNumber) => {
        if ((fileType !== 'pdf' && fileType !== 'docx') || !fileDoc || newPageNumber < 1 || newPageNumber > totalPages) {
            return;
        }

        if (fileType === "pdf") {
            setPageNumber(newPageNumber);
            setSelectedAnnotation(null);
            await renderPDFPage(fileDoc, newPageNumber);
        }

        if (fileType === "docx") {
            setPageNumber(newPageNumber);
        }

    }, [fileDoc, totalPages, renderPDFPage]);

    const drawPolygon = useCallback((ctx, polygon, color, isSelected = false) => {
        if (polygon.length < 2) return;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 1; i < polygon.length; i++) {
            ctx.lineTo(polygon[i].x, polygon[i].y);
        }
        if (polygon.length > 2) ctx.closePath();
        ctx.strokeStyle = isSelected ? '#000' : color;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
        polygon.forEach(point => {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.fill();
        });
        ctx.restore();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const currentPageAnnotations = annotations[pageNumber] || [];
        currentPageAnnotations.forEach(annotation => {
            drawPolygon(ctx, annotation.polygon, annotation.color, selectedAnnotation?.id === annotation.id);
        });

        if (isDrawing && currentPolygon.length > 0) {
            drawPolygon(ctx, currentPolygon, '#ff6b6b');
        }

        if (hoveredTextItem) {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
            ctx.fillRect(hoveredTextItem.x, hoveredTextItem.y, hoveredTextItem.width, hoveredTextItem.height);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.strokeRect(hoveredTextItem.x, hoveredTextItem.y, hoveredTextItem.width, hoveredTextItem.height);
        }
    }, [hoveredTextItem, annotations, pageNumber, selectedAnnotation, isDrawing, currentPolygon, drawPolygon]);

    const redrawAnnotations = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const currentPageAnnotations = annotations[pageNumber] || [];
        currentPageAnnotations.forEach(annotation => {
            drawPolygon(ctx, annotation.polygon, annotation.color, selectedAnnotation?.id === annotation.id);
        });

        if (isDrawing && currentPolygon.length > 0) {
            drawPolygon(ctx, currentPolygon, '#ff6b6b');
        }
    }, [annotations, pageNumber, selectedAnnotation, drawPolygon, pageTextItems]);

    useEffect(() => {
        if (fileType === 'xlsx' && selectedFileUrl && containerRef.current) {
            const canvas = canvasRef.current;
            const container = containerRef.current;

            if (canvas && container) {
                const updateCanvasSize = () => {
                    const containerRect = container.getBoundingClientRect();
                    const devicePixelRatio = window.devicePixelRatio || 1;
                    canvas.width = containerRect.width * devicePixelRatio;
                    canvas.height = containerRect.height * devicePixelRatio;
                    canvas.style.width = `${containerRect.width}px`;
                    canvas.style.height = `${containerRect.height}px`;
                    const ctx = canvas.getContext('2d');
                    ctx.scale(devicePixelRatio, devicePixelRatio);
                    redrawAnnotations();
                };

                updateCanvasSize();
                const resizeObserver = new ResizeObserver(updateCanvasSize);
                resizeObserver.observe(container);

                const handleScroll = () => {
                    updateCanvasSize();
                };
                container.addEventListener('scroll', handleScroll);

                return () => {
                    resizeObserver.disconnect();
                    container.removeEventListener('scroll', handleScroll);
                };
            }
        }
        if (fileType === 'pdf' || fileType === "docx") {
            redrawAnnotations();
        }
    }, [fileType, selectedFileUrl, redrawAnnotations]);

    const handleCanvasMouseMove = (e) => {
        setIsDrawing(true);
        try {
            if (!containerRef.current || !pageTextItems.length) return;

            const canvas = canvasRef.current;
            if (!canvas || !pageTextItems.length) return;

            setCurrentPolygon([]);

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const hoveredItem = pageTextItems.find(item => {
                return (
                    x >= item.x &&
                    x <= item.x + item.width &&
                    y >= item.y &&
                    y <= item.y + item.height
                );
            });

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            currentPolygon.forEach(({ x, y, width, height }) => {
                ctx.beginPath();
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.rect(x, y, width, height);
                ctx.stroke();
            });

            if (hoveredItem) {
                setHoveredTextItem(hoveredItem);
                ctx.beginPath();
                ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
                ctx.fillRect(hoveredItem.x, hoveredItem.y, hoveredItem.width, hoveredItem.height);
                ctx.strokeStyle = 'blue';
                ctx.strokeRect(hoveredItem.x, hoveredItem.y, hoveredItem.width, hoveredItem.height);
            } else {
                setHoveredTextItem(null);
            }
        } catch (error) {
            console.log('error', error);
        } finally {
            setIsDrawing(false);
        }
    };

    const handleCanvasClick = () => {
        if (!hoveredTextItem) return;
        const selectedPolygon = {
            x: hoveredTextItem.x,
            y: hoveredTextItem.y,
            width: hoveredTextItem.width,
            height: hoveredTextItem.height,
        };
        setCurrentPolygon([...currentPolygon, selectedPolygon]);
        setWordSelectionModalData({
            ...wordSelectionModalData,
            modalstatus: true,
            draw_data: hoveredTextItem.str,
        });
    };

    const handleFilter = () => {
        setFilter(prev => !prev);
    }

    const renderExcelContent = () => (
        <Box sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <style dangerouslySetInnerHTML={{ __html: documentStyles }} />
            <Box
                ref={contentRef}
                className="document-content xlsx"
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    position: 'relative',
                    border: '1px solid #d9d9d9',
                    backgroundColor: '#f9f9f9',
                    height: 'calc(100% - 40px)',
                }}
            >
                <div
                    style={{
                        transformOrigin: 'top left',
                        width: '100%',
                        height: '100%',
                    }}
                    dangerouslySetInnerHTML={{ __html: content || '' }}
                    data-testid="document-content"
                />
            </Box>

            <div className="excel-tabs">
                {sheetNames.map((sheet, index) => (
                    <div
                        key={index}
                        className={`excel-tab ${sheet === selectedSheet ? 'active' : ''}`}
                        onClick={async () => {
                            console.log('frjkfjrjk')
                            setSelectedSheet(sheet);
                            const { htmlContent } = await parseExcelFile(selectedFileUrl, sheet);
                            setContent(htmlContent);
                        }}
                    >
                        {sheet}
                    </div>
                ))}
                <div style={{ flex: 1, borderBottom: '1px solid #c7c7c7' }} />
            </div>
        </Box>
    );

    const renderContent = () => {
        if (fileType === 'pdf') {
            return <canvas ref={pdfCanvasRef} className="pdf-canvas" />;
        }
        else if (fileType === 'xlsx') {
            return renderExcelContent();
        }
        return null;
    };

    const handleCanvasBlur = () => {
        defaultTextSearch()
        // setHoveredTextItem(null);
        window.getSelection().removeAllRanges();
    }

    return (
        <Box sx={styles.mainContainer} >

            {(fileLoading || loading || extractionLoading || isLoading || isOcrProcessing) && (<Box sx={{ top: '0', left: '0', width: '100%', position: 'fixed', zIndex: '9999' }}>
                <LinearProgress sx={{ height: 7, '& .MuiLinearProgress-bar': { backgroundColor: '#007bff' } }} />
            </Box>)}

            <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', padding: '10px' }}>

                <Box sx={styles.headerContainer}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">

                        <Box display={'flex'} alignItems={'center'}>
                            <IconButton onClick={handleReset}>
                                <ArrowBack sx={{ color: '#0B51C5' }} />
                            </IconButton>
                            <Typography sx={{ ...styles.headingText }}>
                                {documentTypeData?.document_name?.replace(/\b\w/g, char => char.toUpperCase())}                                    </Typography>
                            <ArrowBackIos sx={{ fontSize: 16, ml: 1 }} />
                            <Typography sx={styles.headingText}>Train Document</Typography>
                        </Box>

                        < Box display="flex" alignItems="center">

                            {revalidateStatus &&
                                (<Button
                                    sx={{ ...styles.validateBtn }}
                                    onClick={() => handleExtractionFileSelection(selectedExtractionFile, 're-test')}
                                    disabled={fileLoading || loading || extractionLoading || isLoading || isOcrProcessing}
                                >
                                    <Typography sx={styles.btnText}>RUN TEST</Typography>
                                </Button>)
                            }

                            <Button
                                sx={{ ...styles.saveBtn, marginLeft: '10px' }}
                                onClick={handleTemplateSave}
                                disabled={fileLoading || loading || extractionLoading || isLoading || isOcrProcessing}
                            >
                                <Typography sx={styles.btnText}>SAVE</Typography>
                            </Button>
                            <Button
                                onClick={handleReset}
                                sx={{ ...styles.cancelBtn, marginLeft: '10px' }}
                            >
                                <Typography sx={styles.btnText}>CANCEL</Typography>
                            </Button>
                        </Box>

                    </Box>
                </Box>

                <Box sx={styles.bodyContainer}>

                    <Box sx={styles.settingsViewContainer}>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ ...styles.subHeadingText, marginBottom: '6px' }}>Document Type</Typography>
                            {(domainDictionaryFields?.length > 0 || domainDictionaryTables?.length > 0 || domainDictionaryGroups?.length > 0) &&
                                revalidateStatus === true && (
                                    <IconButton onClick={handleFilter}>
                                        {!filter ? (<FilterAlt sx={{ color: '#0B51C5' }} />) : (<FilterAltOff sx={{ color: '#0B51C5' }} />)}
                                    </IconButton>
                                )}
                        </Box>
                        <Typography sx={styles.paraText}>{documentTypeData.document_name}</Typography>


                        <Box marginTop={'20px'}>
                            <Box
                                sx={{
                                    display: "flex", alignItems: "center", gap: "5px",
                                    width: revalidateStatus ? 'calc(100% - 8%)' : '100%', marginLeft: revalidateStatus ? '8%' : 0
                                }}
                            >
                                <Typography sx={{ ...styles.paraText, fontWeight: 600, lineHeight: 1, display: "flex", alignItems: "center" }}>
                                    Fields
                                </Typography>

                                <Box
                                    sx={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: 'pointer' }}
                                    onClick={() => handleDomainDictionaryItemAdd('field')}
                                >
                                    <ReactSVG
                                        src={addIcon}
                                        beforeInjection={(svg) => {
                                            svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height}; display: block;`);
                                        }}
                                    />
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                                {(() => {
                                    const visibleFields = (domainDictionaryFields ?? []).filter(field => !filter || field.view === true);
                                    return visibleFields.length > 0 ? (
                                        visibleFields.map((field, fieldIdx) => (
                                            <Box key={fieldIdx} sx={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '15px', gap: '5px' }}>
                                                {revalidateStatus &&
                                                    <Box sx={{ flexBasis: '5%', minWidth: 24 }}>
                                                        <ReactSVG
                                                            src={(field?.view ?? false) ? viewIcon : hideIcon}
                                                            beforeInjection={(svg) => {
                                                                svg.setAttribute(
                                                                    'style',
                                                                    `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`
                                                                );
                                                            }}
                                                        />
                                                    </Box>
                                                }

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <FormControl sx={{ flexBasis: '50%', minWidth: 120 }}>
                                                        <TextField
                                                            value={field.name}
                                                            size="small"
                                                            sx={{
                                                                width: '100%',
                                                                ...styles.textInput,
                                                                '& .MuiOutlinedInput-root': {
                                                                    ...componentStyle.textField['& .MuiOutlinedInput-root'],
                                                                    backgroundColor: (revalidateStatus && ((field?.view ?? false)) === false) ? '#f5f5f5' : '#FFFFFF'
                                                                },
                                                            }}
                                                            placeholder='Field Name'
                                                            onChange={(e) => handleDomainDictionaryFieldTypeName('field', fieldIdx, e.target.value)}
                                                            InputProps={{
                                                                readOnly: false,
                                                                style: styles.paraText,
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormControl sx={{ flexBasis: '30%', minWidth: 100 }}>
                                                        <Select
                                                            value={field.type || "string"}
                                                            onChange={(e) => handleDomainDictionaryFieldType('field', fieldIdx, e.target.value)}
                                                            size="small"
                                                            sx={{
                                                                ...styles.textInput,
                                                                ...componentStyle.selectField,
                                                                backgroundColor: (revalidateStatus && ((field?.view ?? false)) === false) ? '#f5f5f5' : 'inherit'
                                                            }}
                                                        >
                                                            {['string', 'date', 'number'].map(type => (
                                                                <MenuItem key={type} value={type}>
                                                                    <Typography sx={styles.paraText}>
                                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                                    </Typography>
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                    <Box
                                                        sx={{ cursor: "pointer", flexBasis: '5%', minWidth: 24 }}
                                                        onClick={() => handleDomainDictionaryAliasModalOpen('fields', fieldIdx, field?.name, field?.description, field?.type, field.alias)}
                                                    >
                                                        <ReactSVG
                                                            src={aliasIcon}
                                                            beforeInjection={(svg) => {
                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                            }}
                                                        />
                                                    </Box>
                                                    <Box
                                                        sx={{ cursor: "pointer", flexBasis: '5%', minWidth: 24 }}
                                                        onClick={() => handleDomainDictionaryItemDelete('field', fieldIdx)}
                                                    >
                                                        <ReactSVG
                                                            src={trashIcon}
                                                            beforeInjection={(svg) => {
                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )))
                                        :
                                        (<Typography sx={{ width: revalidateStatus ? 'calc(100% - 8%)' : '100%', ml: revalidateStatus ? '8%' : 0, ...styles.paraText }}>
                                            No Fields Available
                                        </Typography>);
                                })()}
                            </Box>

                        </Box>


                        <Box marginTop={'15px'} >
                            <Box
                                sx={{
                                    display: "flex", alignItems: "center", gap: "5px",
                                    width: revalidateStatus ? 'calc(100% - 8%)' : '100%', marginLeft: revalidateStatus ? '8%' : 0
                                }}
                            >
                                <Typography sx={{ ...styles.paraText, fontWeight: 600, lineHeight: 1, display: "flex", alignItems: "center", }}>
                                    Tables
                                </Typography>

                                <Box
                                    sx={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: 'pointer' }}
                                    onClick={() => handleDomainDictionaryItemAdd('tables')}
                                >
                                    <ReactSVG
                                        src={addIcon}
                                        beforeInjection={(svg) => {
                                            svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height}; display: block;`);
                                        }}
                                    />
                                </Box>
                            </Box>

                            <Box display="flex" alignItems="center" flexWrap="wrap" marginTop={'10px'}>
                                <Box display="flex" flexDirection="column" gap={2} width={'100%'}>
                                    {domainDictionaryTables?.length > 0 ?
                                        domainDictionaryTables?.map((item, index) => (
                                            <Box key={index} >
                                                <Box sx={{
                                                    backgroundColor: '#EEEEEE', borderRadius: '5px',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '0px 15px', marginLeft: revalidateStatus ? '8%' : 0
                                                }}>
                                                    {editableIndex === index ? (
                                                        <TextField
                                                            sx={{
                                                                ...styles.textInput,
                                                                width: '180px',
                                                                backgroundColor: 'white',
                                                                borderRadius: '4px', ...componentStyle.textField
                                                            }}

                                                            value={item.name}
                                                            variant="outlined"
                                                            onChange={(e) => handleDomainDictionaryTableName(index, e.target.value)}
                                                            size="small"
                                                            autoFocus
                                                            onBlur={(e) => {
                                                                if (searchIconRef.current && e.relatedTarget === searchIconRef.current) {
                                                                    return;
                                                                }
                                                                setEditableIndex(null);
                                                            }}
                                                            InputProps={{
                                                                readOnly: false,
                                                                style: styles.paraText,
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography sx={{ ...styles.paraText, width: '180px' }}>
                                                            {item.name}
                                                        </Typography>
                                                    )}

                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Box
                                                            sx={{ marginLeft: '10px', cursor: "pointer", marginTop: '5px' }}
                                                            onClick={() => setEditableIndex(index)}
                                                        >
                                                            <ReactSVG src={editIcon} beforeInjection={(svg) => {
                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                            }} />
                                                        </Box>
                                                        <Box
                                                            sx={{ marginLeft: '10px', cursor: "pointer", marginTop: '5px' }}
                                                            onClick={() => handleDomainDictionaryItemDelete('tables', index)}
                                                        >
                                                            <ReactSVG src={trashIcon} beforeInjection={(svg) => {
                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                            }} />
                                                        </Box>
                                                        <IconButton onClick={() => setTableOpenIndex(tableOpenIndex === index ? null : index)}>
                                                            {tableOpenIndex === index ? <ExpandLess /> : <ExpandMore />}
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                <Collapse in={tableOpenIndex === index} timeout="auto" unmountOnExit sx={{ backgroundColor: '#FFFFFF' }}>
                                                    <Box component="form" display="flex" flexDirection="column" width={'100%'}>
                                                        {(() => {
                                                            const visibleFields = (item?.fields ?? []).filter(field => !filter || field.view === true);
                                                            return visibleFields.length > 0 ? (
                                                                visibleFields.map((field, fieldIdx) => (
                                                                    <Box key={fieldIdx} sx={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: '10px', gap: '5px' }}>
                                                                        {revalidateStatus && <Box sx={{ flexBasis: '5%', minWidth: 24 }}>
                                                                            <ReactSVG
                                                                                src={(field?.view ?? false) ? viewIcon : hideIcon}
                                                                                beforeInjection={(svg) => {
                                                                                    svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                                }}
                                                                            />
                                                                        </Box>}
                                                                        <FormControl sx={{ flexBasis: '50%', minWidth: 120 }}>
                                                                            <TextField
                                                                                value={field.name}
                                                                                size="small"
                                                                                sx={{
                                                                                    width: '100%',
                                                                                    ...styles.textInput,
                                                                                    '& .MuiOutlinedInput-root': {
                                                                                        ...componentStyle.textField['& .MuiOutlinedInput-root'],
                                                                                        backgroundColor: (revalidateStatus && (field?.view ?? false) === false) ? '#f5f5f5' : '#FFFFFF'
                                                                                    },
                                                                                }}
                                                                                placeholder='Field Name'
                                                                                onChange={(e) => handleDomainDictionaryTableFieldName(index, fieldIdx, e.target.value)}
                                                                                onBlur={() => handleGetFieldDetails('tables', field.name, fieldIdx, index)}
                                                                                InputProps={{
                                                                                    readOnly: false,
                                                                                    style: styles.paraText
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormControl sx={{ flexBasis: '30%', minWidth: 100 }}>
                                                                            <Select
                                                                                value={field.type || "string"}
                                                                                onChange={(e) => handleDomainDictionaryTableFieldType(index, fieldIdx, e.target.value)}
                                                                                size="small"
                                                                                sx={{
                                                                                    ...styles.textInput,
                                                                                    ...componentStyle.selectField,
                                                                                    backgroundColor: (revalidateStatus && (field?.view ?? false) === false) ? '#f5f5f5' : 'inherit'
                                                                                }}
                                                                            >
                                                                                {['string', 'date', 'number'].map(type => (
                                                                                    <MenuItem key={type} value={type}>
                                                                                        <Typography sx={styles.paraText}>
                                                                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                                                                        </Typography>
                                                                                    </MenuItem>
                                                                                ))}
                                                                            </Select>
                                                                        </FormControl>
                                                                        <Box sx={{ cursor: "pointer", flexBasis: '5%', minWidth: 24 }}
                                                                            onClick={() => handleDomainDictionaryAliasModalOpen('tables', fieldIdx, field?.name, field?.description, field?.type, field?.alias, index, item.name, index, item.name)}
                                                                        >
                                                                            <ReactSVG src={aliasIcon} beforeInjection={(svg) => {
                                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                            }} />
                                                                        </Box>
                                                                        <Box sx={{ cursor: "pointer", flexBasis: '5%', minWidth: 24 }}
                                                                            onClick={() => handleDeleteDomainDictionaryTableField(index, fieldIdx)}
                                                                        >
                                                                            <ReactSVG src={trashIcon} beforeInjection={(svg) => {
                                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                            }} />
                                                                        </Box>
                                                                    </Box>
                                                                )))
                                                                :
                                                                (<Typography sx={{ width: "100%", marginTop: '10px', textAlign: 'center', ...styles.paraText }}>No Fields Available</Typography>)
                                                        })()}

                                                        <Box sx={{ display: "flex", alignItems: "center", marginTop: '10px', marginLeft: revalidateStatus ? '8%' : 0 }}>
                                                            <Box
                                                                onClick={() => handleAddDomainDictionaryTableField(index)}
                                                                sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                                            >
                                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                    <ReactSVG
                                                                        src={addFieldIcon}
                                                                        beforeInjection={(svg) => {
                                                                            svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height}; display: block;`);
                                                                        }}
                                                                    />
                                                                </Box>
                                                                <Typography sx={{ ...styles.paraText, color: "#0B51C5", lineHeight: 1, display: "flex", alignItems: "center" }}>
                                                                    Add Field
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                    </Box>
                                                </Collapse>
                                            </Box>
                                        )) :
                                        (<Typography sx={{ width: revalidateStatus ? "calc(100% - 10%)" : '100%', marginLeft: revalidateStatus ? '10%' : 0, ...styles.paraText }}>No Tables Available</Typography>)
                                    }
                                </Box>
                            </Box>
                        </Box>

                        <Box marginTop={'15px'}>
                            <Box
                                sx={{
                                    display: "flex", alignItems: "center", gap: "5px",
                                    width: revalidateStatus ? 'calc(100% - 8%)' : '100%', marginLeft: revalidateStatus ? '8%' : 0
                                }}
                            >
                                <Typography sx={{ ...styles.paraText, fontWeight: 600, lineHeight: 1, display: "flex", alignItems: "center" }}>
                                    Groups
                                </Typography>

                                <Box
                                    sx={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: 'pointer' }}
                                    onClick={() => handleDomainDictionaryItemAdd('groups')}
                                >
                                    <ReactSVG
                                        src={addIcon}
                                        beforeInjection={(svg) => {
                                            svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height}; display: block;`);
                                        }}
                                    />
                                </Box>
                            </Box>

                            <Box display="flex" alignItems="center" flexWrap="wrap" marginTop={'10px'}>
                                <Box display="flex" flexDirection="column" gap={2} width={'100%'}>
                                    {domainDictionaryGroups?.length > 0 ?
                                        domainDictionaryGroups?.map((item, index) => (
                                            <Box key={index} >
                                                <Box sx={{
                                                    backgroundColor: '#EEEEEE', borderRadius: '5px',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '0px 15px', marginLeft: revalidateStatus ? '8%' : 0
                                                }}>
                                                    {editgroupIndex === index ? (
                                                        <TextField
                                                            sx={{
                                                                ...styles.textInput,
                                                                width: '180px',
                                                                backgroundColor: 'white',
                                                                borderRadius: '4px', ...componentStyle.textField
                                                            }}
                                                            value={item.name}
                                                            variant="outlined"
                                                            onChange={(e) => handleDomainDictionaryGroupName(index, e.target.value)}
                                                            size="small"
                                                            autoFocus
                                                            onBlur={(e) => {
                                                                if (searchIconRef.current && e.relatedTarget === searchIconRef.current) {
                                                                    return;
                                                                }
                                                                setEditGroupIndex(null);
                                                            }}
                                                            InputProps={{
                                                                readOnly: false,
                                                                style: styles.paraText,
                                                                // endAdornment: (
                                                                //     <InputAdornment position="end">
                                                                //         <Search
                                                                //             ref={searchIconRef}
                                                                //             tabIndex={-1}
                                                                //             style={{
                                                                //                 cursor: 'pointer',
                                                                //                 height: '20px',
                                                                //                 width: '20px',
                                                                //                 outline: 'none',
                                                                //                 boxShadow: 'none',
                                                                //             }}
                                                                //             onClick={() => handleDomainDictionaryGroupNameSearch(index, item.name)}
                                                                //         />
                                                                //     </InputAdornment>
                                                                // ),
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography sx={{ ...styles.paraText, width: '180px' }}>
                                                            {item.name}
                                                        </Typography>
                                                    )}

                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Box
                                                            sx={{ marginLeft: '10px', cursor: "pointer", marginTop: '5px' }}
                                                            onClick={() => setEditGroupIndex(index)}
                                                        >
                                                            <ReactSVG src={editIcon} beforeInjection={(svg) => {
                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                            }} />
                                                        </Box>
                                                        <Box
                                                            sx={{ marginLeft: '10px', cursor: "pointer", marginTop: '5px' }}
                                                            onClick={() => handleDomainDictionaryItemDelete('groups', index)}
                                                        >
                                                            <ReactSVG src={trashIcon} beforeInjection={(svg) => {
                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                            }} />
                                                        </Box>
                                                        <IconButton onClick={() => setGroupOpenIndex(groupOpenIndex === index ? null : index)}>
                                                            {groupOpenIndex === index ? <ExpandLess /> : <ExpandMore />}
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                <Collapse in={groupOpenIndex === index} timeout="auto" unmountOnExit sx={{ backgroundColor: '#FFFFFF' }}>
                                                    <Box component="form" display="flex" flexDirection="column" width={'100%'}>
                                                        {(() => {
                                                            const visibleFields = (item?.fields ?? []).filter(field => !filter || field.view === true);
                                                            return visibleFields.length > 0 ? (
                                                                visibleFields.map((field, fieldIdx) => (
                                                                    <Box key={fieldIdx} sx={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: '10px', gap: '5px' }}>
                                                                        {revalidateStatus && <Box sx={{ flexBasis: '5%', minWidth: 24 }}>
                                                                            <ReactSVG
                                                                                src={(field?.view ?? false) ? viewIcon : hideIcon}
                                                                                beforeInjection={(svg) => {
                                                                                    svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                                }}
                                                                            />
                                                                        </Box>}
                                                                        <FormControl sx={{ flexBasis: '50%', minWidth: 120 }}>
                                                                            <TextField
                                                                                value={field.name}
                                                                                size="small"
                                                                                sx={{
                                                                                    width: '100%',
                                                                                    ...styles.textInput,
                                                                                    '& .MuiOutlinedInput-root': {
                                                                                        ...componentStyle.textField['& .MuiOutlinedInput-root'],
                                                                                        backgroundColor: (revalidateStatus && (field?.view ?? false) === false) ? '#f5f5f5' : '#FFFFFF'
                                                                                    }
                                                                                }}
                                                                                placeholder='Field Name'
                                                                                onChange={(e) => handleDomainDictionaryGroupFieldName(index, fieldIdx, e.target.value)}
                                                                                InputProps={{
                                                                                    readOnly: false,
                                                                                    style: styles.paraText,
                                                                                    // endAdornment: (
                                                                                    //     <InputAdornment position="end">
                                                                                    //         <Search style={{ cursor: 'pointer', height: '20px', width: '20px' }}
                                                                                    //             onClick={() => handleGetFieldDetails('group_fields', field.name, fieldIdx, 0, index)}
                                                                                    //         />
                                                                                    //     </InputAdornment>
                                                                                    // )
                                                                                }}
                                                                            />

                                                                        </FormControl>
                                                                        <FormControl sx={{ flexBasis: '30%', minWidth: 100 }}>
                                                                            <Select
                                                                                value={field.type || "string"}
                                                                                onChange={(e) => handleDomainDictionaryGroupFieldType(index, fieldIdx, e.target.value)}
                                                                                size="small"
                                                                                sx={{
                                                                                    ...styles.textInput,
                                                                                    ...componentStyle.selectField,
                                                                                    backgroundColor: (revalidateStatus && (field?.view ?? false) === false) ? '#f5f5f5' : 'inherit'
                                                                                }}
                                                                            >
                                                                                {['string', 'date', 'number'].map(type => (
                                                                                    <MenuItem key={type} value={type}>
                                                                                        <Typography sx={styles.paraText}>
                                                                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                                                                        </Typography>
                                                                                    </MenuItem>
                                                                                ))}
                                                                            </Select>
                                                                        </FormControl>
                                                                        <Box sx={{ cursor: "pointer", flexBasis: '5%', minWidth: 24 }}
                                                                            onClick={() => handleDomainDictionaryAliasModalOpen('groups', fieldIdx, field?.name, field?.description, field?.type, field?.alias, index, item.name)}
                                                                        >
                                                                            <ReactSVG src={aliasIcon} beforeInjection={(svg) => {
                                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                            }} />
                                                                        </Box>
                                                                        <Box sx={{ cursor: "pointer", flexBasis: '5%', minWidth: 24 }}
                                                                            onClick={() => handleDeleteDomainDictionaryGroupField(index, fieldIdx)}
                                                                        >
                                                                            <ReactSVG src={trashIcon} beforeInjection={(svg) => {
                                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                            }} />
                                                                        </Box>
                                                                    </Box>
                                                                )))
                                                                :
                                                                (<Typography sx={{ width: "100%", marginTop: '10px', textAlign: 'center', ...styles.paraText }}>No Fields Available</Typography>)
                                                        })()}

                                                        <Box sx={{ display: "flex", alignItems: "center", marginTop: '10px', marginLeft: revalidateStatus ? '8%' : 0 }}>
                                                            <Box
                                                                onClick={() => handleAddDomainDictionaryGroupField(index)}
                                                                sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                                            >
                                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                    <ReactSVG
                                                                        src={addFieldIcon}
                                                                        beforeInjection={(svg) => {
                                                                            svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height}; display: block;`);
                                                                        }}
                                                                    />
                                                                </Box>
                                                                <Typography sx={{ ...styles.paraText, color: "#0B51C5", lineHeight: 1, display: "flex", alignItems: "center" }}>
                                                                    Add Field
                                                                </Typography>
                                                            </Box>
                                                            <Box
                                                                onClick={() => handleDomainDictionaryGroupTableAdd(index)}
                                                                sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", marginLeft: '20px' }}
                                                            >
                                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                    <ReactSVG
                                                                        src={addTableIcon}
                                                                        beforeInjection={(svg) => {
                                                                            svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height}; display: block;`);
                                                                        }}
                                                                    />
                                                                </Box>
                                                                <Typography sx={{ ...styles.paraText, color: "#0B51C5", lineHeight: 1, display: "flex", alignItems: "center" }}>
                                                                    Add Table
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        {/* Tables Handling */}
                                                        <Box display="flex" alignItems="center" flexWrap="wrap" marginTop={'20px'} >
                                                            <Box display="flex" flexDirection="column" gap={2} width={'100%'}>
                                                                {item?.tables?.length > 0 ?
                                                                    item?.tables?.map((table, tableIndex) =>
                                                                    (<Box key={tableIndex}>
                                                                        <Box sx={{
                                                                            backgroundColor: '#EEEEEE', borderRadius: '5px',
                                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                            padding: '0px 15px',
                                                                            marginLeft: revalidateStatus ? '12%' : '4%',
                                                                            width: revalidateStatus ? 'calc(100% - 12%)' : 'calc(100% - 4%)'
                                                                        }}>
                                                                            {editGrouptableIndex === index ? (
                                                                                <TextField
                                                                                    sx={{
                                                                                        ...styles.textInput,
                                                                                        width: '180px',
                                                                                        backgroundColor: 'white',
                                                                                        borderRadius: '4px', ...componentStyle.textField
                                                                                    }}
                                                                                    value={table.name}
                                                                                    variant="outlined"
                                                                                    onChange={(e) => handleDomainDictionaryGroupTableName(index, tableIndex, e.target.value)}
                                                                                    size="small"
                                                                                    autoFocus
                                                                                    onBlur={(e) => {
                                                                                        if (searchIconRef.current && e.relatedTarget === searchIconRef.current) {
                                                                                            return;
                                                                                        }
                                                                                        setEditGrouptableIndex(null);
                                                                                    }}
                                                                                    InputProps={{
                                                                                        readOnly: false,
                                                                                        style: styles.paraText,
                                                                                        // endAdornment: (
                                                                                        //     <InputAdornment position="end">
                                                                                        //         <Search
                                                                                        //             ref={searchIconRef}
                                                                                        //             tabIndex={-1}
                                                                                        //             style={{
                                                                                        //                 cursor: 'pointer',
                                                                                        //                 height: '20px',
                                                                                        //                 width: '20px',
                                                                                        //                 outline: 'none',
                                                                                        //                 boxShadow: 'none',
                                                                                        //             }}
                                                                                        //             onClick={() => handleDomainDictionaryGroupTableNameSearch(index, tableIndex, table.name)}
                                                                                        //         />
                                                                                        //     </InputAdornment>
                                                                                        // ),
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <Typography sx={{ ...styles.paraText, width: '180px' }}>
                                                                                    {table.name}
                                                                                </Typography>
                                                                            )}


                                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                <Box
                                                                                    sx={{ marginLeft: '10px', cursor: "pointer", marginTop: '5px' }}
                                                                                    onClick={() => setEditGrouptableIndex(index)}
                                                                                >
                                                                                    <ReactSVG src={editIcon} beforeInjection={(svg) => {
                                                                                        svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                                    }} />
                                                                                </Box>
                                                                                <Box
                                                                                    sx={{ marginLeft: '10px', cursor: "pointer", marginTop: '5px' }}
                                                                                    onClick={() => handleDomainDictionaryGroupTableDelete(index, tableIndex)}
                                                                                >
                                                                                    <ReactSVG src={trashIcon} beforeInjection={(svg) => {
                                                                                        svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                                    }} />
                                                                                </Box>
                                                                                <IconButton onClick={() => setGroupTableOpenIndex(groupTableOpenIndex === tableIndex ? null : tableIndex)}>
                                                                                    {groupTableOpenIndex === tableIndex ? <ExpandLess /> : <ExpandMore />}
                                                                                </IconButton>
                                                                            </Box>
                                                                        </Box>

                                                                        <Collapse in={groupTableOpenIndex === tableIndex} timeout="auto" unmountOnExit sx={{ backgroundColor: '#FFFFFF' }}>
                                                                            <Box component="form" display="flex" flexDirection="column" width={'100%'}>
                                                                                {(() => {
                                                                                    const visibleFields = (table?.fields ?? []).filter(field => !filter || field.view === true);
                                                                                    return visibleFields.length > 0 ? (
                                                                                        visibleFields.map((tableField, tableFieldIdx) =>
                                                                                        (<Box key={tableFieldIdx} sx={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: '10px', gap: '5px' }}>
                                                                                            {revalidateStatus && <Box sx={{ flexBasis: '5%', minWidth: 24 }}>
                                                                                                <ReactSVG
                                                                                                    src={(tableField?.view ?? false) ? viewIcon : hideIcon}
                                                                                                    beforeInjection={(svg) => {
                                                                                                        svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                                                    }}
                                                                                                />
                                                                                            </Box>}
                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', width: 'calc(100% - 4%)', gap: '5px', marginLeft: '4%' }}>
                                                                                                <FormControl sx={{ flexBasis: '50%', minWidth: 120 }}>
                                                                                                    <TextField
                                                                                                        value={tableField.name}
                                                                                                        size="small"
                                                                                                        sx={{
                                                                                                            width: '100%',
                                                                                                            ...styles.textInput,
                                                                                                            '& .MuiOutlinedInput-root': {
                                                                                                                ...componentStyle.textField['& .MuiOutlinedInput-root'],
                                                                                                                backgroundColor: (revalidateStatus && (tableField?.view ?? false) === false) ? '#f5f5f5' : '#FFFFFF'
                                                                                                            }
                                                                                                        }}
                                                                                                        placeholder='Field Name'
                                                                                                        onChange={(e) => handleDomainDictionaryGroupTableFieldName(index, tableIndex, tableFieldIdx, e.target.value)}
                                                                                                        InputProps={{
                                                                                                            readOnly: false,
                                                                                                            style: styles.paraText,
                                                                                                            // endAdornment: (
                                                                                                            //     <InputAdornment position="end">
                                                                                                            //         <Search style={{ cursor: 'pointer', height: '20px', width: '20px' }}
                                                                                                            //             onClick={() => handleGetFieldDetails('group_table_fields', tableField.name, tableFieldIdx, tableIndex, index)}
                                                                                                            //         />
                                                                                                            //     </InputAdornment>
                                                                                                            // )
                                                                                                        }}
                                                                                                    />
                                                                                                </FormControl>
                                                                                                <FormControl sx={{ flexBasis: '30%', minWidth: 100 }}>
                                                                                                    <Select
                                                                                                        value={tableField.type || "string"}
                                                                                                        onChange={(e) => handleDomainDictionaryGroupTableFieldType(index, tableIndex, tableFieldIdx, e.target.value)}
                                                                                                        size="small"
                                                                                                        sx={{
                                                                                                            ...styles.textInput,
                                                                                                            ...componentStyle.selectField,
                                                                                                            backgroundColor: (revalidateStatus && (tableField?.view ?? false) === false) ? '#f5f5f5' : 'inherit'
                                                                                                        }}
                                                                                                    >
                                                                                                        {['string', 'date', 'number'].map(type => (
                                                                                                            <MenuItem key={type} value={type}>
                                                                                                                <Typography sx={styles.paraText}>
                                                                                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                                                                                </Typography>
                                                                                                            </MenuItem>
                                                                                                        ))}
                                                                                                    </Select>
                                                                                                </FormControl>
                                                                                                <Box sx={{ cursor: "pointer", flexBasis: '5%', minWidth: 24 }}
                                                                                                    onClick={() => handleDomainDictionaryAliasModalOpen('group_tables', tableFieldIdx, tableField?.name, tableField?.description, tableField?.type,
                                                                                                        tableField?.alias, index, item?.name, tableIndex, table?.name)}
                                                                                                >
                                                                                                    <ReactSVG src={aliasIcon} beforeInjection={(svg) => {
                                                                                                        svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                                                    }} />
                                                                                                </Box>
                                                                                                <Box sx={{ cursor: "pointer", flexBasis: '5%', minWidth: 24 }}
                                                                                                    onClick={() => handleDomainDictionaryGroupTableFieldDelete(index, tableIndex, tableFieldIdx)}
                                                                                                >
                                                                                                    <ReactSVG src={trashIcon} beforeInjection={(svg) => {
                                                                                                        svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                                                    }} />
                                                                                                </Box>
                                                                                            </Box>
                                                                                        </Box>)))
                                                                                        :
                                                                                        (<Typography sx={{ width: "100%", marginTop: '10px', textAlign: 'center', ...styles.paraText }}>No Fields Available</Typography>)
                                                                                })()}

                                                                                <Box
                                                                                    onClick={() => handleDomainDictionaryGroupTableFieldAdd(index, tableIndex)}
                                                                                    sx={{
                                                                                        cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                                                                                        marginTop: '10px', marginLeft: revalidateStatus ? '12%' : '4%'
                                                                                    }}
                                                                                >
                                                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                                        <ReactSVG
                                                                                            src={addFieldIcon}
                                                                                            beforeInjection={(svg) => {
                                                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height}; display: block;`);
                                                                                            }}
                                                                                        />
                                                                                    </Box>
                                                                                    <Typography sx={{ ...styles.paraText, color: "#0B51C5", lineHeight: 1, display: "flex", alignItems: "center" }}>
                                                                                        Add Field
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Box>
                                                                        </Collapse>
                                                                    </Box>))
                                                                    :
                                                                    (<Typography sx={{ width: revalidateStatus ? "calc(100% - 12%)" : "calc(100% - 4%)", marginLeft: revalidateStatus ? '12%' : '4%', ...styles.paraText }}>
                                                                        No Tables Available
                                                                    </Typography>)
                                                                }
                                                            </Box>
                                                        </Box>

                                                    </Box>
                                                </Collapse>
                                            </Box>
                                        )) :
                                        (<Typography sx={{ width: revalidateStatus ? "calc(100% - 10%)" : '100%', marginLeft: revalidateStatus ? '10%' : 0, ...styles.paraText }}>No Groups Available</Typography>)
                                    }
                                </Box>
                            </Box>
                        </Box>

                    </Box>

                    <Box sx={styles.resultContainer}>

                        <Box sx={{ width: '7%', display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                            <Box
                                sx={{
                                    padding: '5px',
                                    backgroundColor: `${previewType === 'file_preview' ? '#0B51C5' : '#FFFFFF'}`,
                                    border: `solid 1px ${previewType === 'file_preview' ? '#FFFFFF' : '#0B51C5'}`,
                                    borderRadius: '10px',
                                    height: '48px',
                                    width: '48px',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    cursor: (fileLoading || isOcrProcessing) ? 'not-allowed' : 'pointer',
                                }}
                                onClick={() => { (!fileLoading && !isOcrProcessing && !extractionLoading && !loading) && setPreviewType('file_preview') }}
                                disabled={fileLoading || isOcrProcessing || extractionLoading || loading}
                            >
                                <ReactSVG
                                    src={fileViewIcon}
                                    beforeInjection={(svg) => {
                                        svg.setAttribute('style', 'width: 24px; height: 24px; display: block;');
                                        const paths = svg.querySelectorAll('path');
                                        paths.forEach((path) => {
                                            path.setAttribute('stroke', `${previewType === 'file_preview' ? '#FFFFFF' : '#0B51C5'}`);
                                        });
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', margin: '5px 0px' }}>
                                <IconButton
                                    onClick={() => changePage(pageNumber - 1)}
                                    disabled={pageNumber <= 1 || fileLoading || isOcrProcessing || extractionLoading}
                                >
                                    <KeyboardArrowUp style={{ height: '18px', width: '18px' }} />
                                </IconButton>

                                <Box
                                    sx={{
                                        padding: '5px',
                                        backgroundColor: '#FFFFFF',
                                        border: '#FFFFFF',
                                        borderRadius: '10px',
                                        height: '48px',
                                        width: '48px',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    }}
                                >
                                    <Typography sx={styles.paraText}>{pageNumber}</Typography>
                                </Box>
                                <IconButton
                                    onClick={() => changePage(pageNumber + 1)}
                                    disabled={pageNumber >= totalPages || fileLoading || isOcrProcessing || extractionLoading}
                                >
                                    <KeyboardArrowDown style={{ height: '18px', width: '18px' }} />
                                </IconButton>
                            </Box>

                            <Box
                                sx={{
                                    padding: '5px',
                                    backgroundColor: `${previewType === 'result_preview' ? '#0B51C5' : '#FFFFFF'}`,
                                    border: `solid 1px ${previewType === 'result_preview' ? '#FFFFFF' : '#0B51C5'}`,
                                    borderRadius: '10px',
                                    height: '48px',
                                    width: '48px',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    cursor: (fileLoading || isOcrProcessing) ? 'not-allowed' : 'pointer',
                                }}
                                onClick={() => { (!fileLoading && !isOcrProcessing && !extractionLoading && !loading) && setPreviewType('result_preview') }}
                                disabled={fileLoading || isOcrProcessing || extractionLoading || loading}
                            >
                                <ReactSVG
                                    src={extraction_result}
                                    beforeInjection={(svg) => {
                                        svg.setAttribute('style', 'width: 24px; height: 24px; display: block;');
                                        const paths = svg.querySelectorAll('path');
                                        paths.forEach((path) => {
                                            path.setAttribute('stroke', `${previewType === 'result_preview' ? '#FFFFFF' : '#0B51C5'}`);
                                        });
                                    }}
                                />
                            </Box>

                            <Box
                                sx={{
                                    padding: '5px',
                                    marginTop: '10px',
                                    height: '48px',
                                    width: '48px',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    backgroundColor: `${previewType === 'extraction' ? '#0B51C5' : '#FFFFFF'}`,
                                    border: `solid 1px ${previewType === 'extraction' ? '#FFFFFF' : '#0B51C5'}`,
                                    borderRadius: '10px',
                                    cursor: (fileLoading || isOcrProcessing) ? 'not-allowed' : 'pointer',
                                }}
                                onClick={() => { (!fileLoading && !isOcrProcessing && !extractionLoading && !loading) && setPreviewType('extraction') }}
                                disabled={fileLoading || isOcrProcessing || extractionLoading || loading}
                            >
                                <ReactSVG
                                    src={jsonViewIcon}
                                    beforeInjection={(svg) => {
                                        svg.setAttribute('style', 'width: 24px; height: 24px; display: block;');
                                        const paths = svg.querySelectorAll('path');
                                        paths.forEach((path) => {
                                            path.setAttribute('stroke', `${previewType === 'extraction' ? '#FFFFFF' : '#0B51C5'}`);
                                        });
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ width: 'calc(93% - 7px)', height: '100%', marginLeft: '7px' }}>
                            <Box sx={styles.fileChangeContainer}>

                                <Box display={'flex'} alignItems={'center'}>
                                    <FormControl>
                                        <Autocomplete
                                            id="extraction-autocomplete"
                                            options={isSearching ? searchResults : extractionFiles}
                                            getOptionLabel={(option) => option?.payload?.file_name || ""}
                                            value={selectedExtractionFile}
                                            onChange={(event, newValue) => {
                                                setSelectedExtractionFile(newValue);
                                                setRevalidateStatus(false);
                                            }}
                                            disabled={fileLoading || isOcrProcessing || extractionLoading || loading || dataLoading}
                                            sx={{
                                                ...componentStyle.autocomplete,
                                                width: '283px',
                                                backgroundColor: '#ffffff',
                                                borderRadius: '5px',
                                                border: '1px solid #D9D9D9',
                                                height: '30px',
                                                '& .MuiOutlinedInput-root': { height: '30px' },
                                            }}
                                            ListboxProps={{ onScroll: isSearching ? undefined : handlePageScroll }}
                                            loading={dataLoading || loadingMore}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Search and Select File"
                                                    value={searchTerm || ""}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            handleSearch();
                                                        }
                                                    }}
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                            <>
                                                                {(dataLoading || loadingMore) && (
                                                                    <CircularProgress size={20} sx={{ color: '#007bff' }} />
                                                                )}
                                                                <IconButton
                                                                    onClick={handleSearch}
                                                                >
                                                                    <Search />
                                                                </IconButton>
                                                                {params.InputProps.endAdornment}
                                                            </>
                                                        ),
                                                    }}
                                                    sx={{ ...styles.paraText, ...componentStyle.textField }}
                                                />
                                            )}
                                            noOptionsText={<Typography sx={styles.paraText}>No file available</Typography>}
                                        />
                                    </FormControl>
                                </Box>

                                <Box
                                    sx={{ cursor: 'pointer', marginLeft: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => document.getElementById('fileInput').click()}
                                >
                                    <ReactSVG src={uploadFileIcon} beforeInjection={(svg) => {
                                        svg.setAttribute('style', 'width: 30px; height: 30px; display: block;');
                                    }} />
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                                        ref={fileInputRef}
                                        id="fileInput"
                                        disabled={fileLoading || loading || extractionLoading || isLoading || isOcrProcessing}
                                        onChange={handleAddNewFile}
                                        style={{ display: 'none', cursor: 'pointer' }}
                                    />
                                </Box>
                            </Box>

                            <Box sx={styles.resultViewContainer}>
                                <Box sx={{ height: '100%', width: '100%', overflow: (loading || fileLoading || extractionLoading || isOcrProcessing) ? 'hidden' : 'auto' }}>
                                    {fileLoading || loading || extractionLoading ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                            <CircularProgress size={40} sx={{ color: '#007bff' }} />
                                            <Typography sx={{ ...styles.paraText, marginTop: '10px' }}>
                                                {isOcrProcessing ? 'Performing OCR...' : 'Loading...'}
                                            </Typography>
                                        </Box>)
                                        :
                                        <Box sx={{ height: '100%', width: '100%', position: "relative" }}>
                                            {previewType === "file_preview" &&
                                                (<Box sx={{ height: '100%', width: '100%', position: "relative" }}>
                                                    {!fileDoc ? (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                            <Typography sx={styles.paraText}>No file selected</Typography>
                                                        </Box>
                                                    ) : (<Box sx={{ flex: 1, p: 1, display: 'flex' }}>
                                                        <Stack spacing={2} sx={{ width: '100%', maxWidth: '100%' }}>
                                                            <Box
                                                                sx={{
                                                                    position: 'relative',
                                                                    border: '1px solid #d1d5db',
                                                                    borderRadius: '4px',
                                                                    overflow: 'hidden',
                                                                    backgroundColor: '#ffffff',
                                                                    minHeight: '100vh'
                                                                }}>


                                                                {(fileType === 'pdf' || fileType === 'xlsx') &&
                                                                    <Box
                                                                        ref={containerRef}
                                                                        className="pdf-container"
                                                                        style={{
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        onMouseMove={handleCanvasMouseMove}
                                                                        onClick={handleCanvasClick}
                                                                        onMouseOut={handleCanvasBlur}
                                                                    >
                                                                        {renderContent()}
                                                                        < canvas
                                                                            ref={canvasRef}
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: 0,
                                                                                left: 0,
                                                                                pointerEvents: 'none',
                                                                                zIndex: 10
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                }
                                                                {fileType === 'docx' &&
                                                                    <Box
                                                                        ref={containerRef}
                                                                        className="pdf-container"
                                                                        style={{
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        <div ref={relativeRef} style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
                                                                            <div ref={contentRef} />
                                                                            <canvas
                                                                                ref={canvasRef}
                                                                                style={{
                                                                                    pointerEvents: 'auto',
                                                                                    cursor: hoveredTextItem ? 'pointer' : 'default',
                                                                                    position: 'absolute',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    zIndex: 10,
                                                                                }}
                                                                                className="annotation-canvas"
                                                                                onMouseMove={handleCanvasMouseMove}
                                                                                onClick={handleCanvasClick}
                                                                                onMouseOut={() => {
                                                                                    setHoveredTextItem(null);
                                                                                    window.getSelection().removeAllRanges();
                                                                                }}
                                                                            />
                                                                        </div>

                                                                    </Box>
                                                                }
                                                            </Box>
                                                        </Stack>
                                                    </Box>
                                                    )}

                                                    {isOcrProcessing && (
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                backgroundColor: '#ffffff',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                zIndex: 10,
                                                            }}
                                                        >
                                                            <CircularProgress size={30} sx={{ color: '#007bff' }} />
                                                            <Typography sx={{ ...styles.paraText, marginTop: '5px' }}>Performing OCR...</Typography>
                                                        </Box>
                                                    )}

                                                </Box>)
                                            }

                                            {previewType === "extraction" &&
                                                (<Box sx={{ height: '100%', width: '100%' }}>
                                                    {extractionResponse
                                                        ?
                                                        (<div style={{ background: '#fff', padding: '12px', borderRadius: '6px' }}>
                                                            <JSONTree
                                                                data={(extractionResponse || [])}
                                                                theme={lightTheme}
                                                                invertTheme={false}
                                                            />
                                                        </div>)
                                                        :
                                                        (<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                            <Typography sx={styles.paraText}>No Data Available</Typography>
                                                        </Box>)
                                                    }
                                                </Box>)
                                            }

                                            {previewType === "result_preview" &&
                                                (<Box sx={{ height: '100%', width: '100%' }}>
                                                    {(extractionResponseData?.files || [])?.length > 1 &&
                                                        (<Box sx={{ display: "flex", justifyContent: "center", marginTop: '10px', marginBottom: '5px' }}>
                                                            <Pagination
                                                                count={(extractionResponseData?.files || [])?.length}
                                                                page={filepage + 1}
                                                                onChange={(e, value) => setFilePage(value - 1)}
                                                                shape="circular"
                                                                sx={styles.navigationBtn}
                                                            />
                                                        </Box>)
                                                    }

                                                    {(extractionResponseData?.files?.some(file =>
                                                        (file.tables?.length > 0) || (file.groups?.length > 0) || Object.keys(file.mapped_fields || {}).length > 0
                                                    ))
                                                        ? (<ExtractionResult extractionResponse={extractionResponseData} filepage={filepage} />)
                                                        :
                                                        (<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                            <Typography sx={styles.paraText}>No Data Available</Typography>
                                                        </Box>)
                                                    }
                                                </Box>)
                                            }
                                        </Box>
                                    }
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Modal For Alias Handling */}
                <Modal open={aliasModalData.modalstatus} onClose={handleDomainDictionaryAliasModalClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
                    <Box sx={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '520px',
                        boxShadow: '24',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '15px',
                        padding: '20px',
                        transform: 'translate(-50%,-50%)'
                    }}>

                        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                            <Typography sx={styles.headingText}>Modify Aliases</Typography>
                            <Box display={'flex'} alignItems={'center'}>
                                <Button
                                    onClick={() => handleDomainDictionaryAliasSave()}
                                    sx={styles.saveBtn}
                                >
                                    <Typography sx={styles.btnText}>SAVE</Typography>
                                </Button>
                                <Button
                                    sx={{ ...styles.cancelBtn, marginLeft: '10px' }}
                                    onClick={handleDomainDictionaryAliasModalClose}
                                >
                                    <Typography sx={styles.btnText}>CANCEL</Typography>
                                </Button>
                            </Box>
                        </Box>

                        <Box marginTop={'10px'}>
                            <Typography sx={styles.subHeadingText}>Domain Dictionary</Typography>
                            <Typography sx={styles.paraText}>{documentTypeData.document_name}</Typography>

                            {aliasModalData?.data_type === "groups" &&
                                <Typography sx={{ ...styles.paraText, marginTop: '10px' }}>
                                    <strong>Group Name : </strong>
                                    {aliasModalData.group_name}
                                </Typography>}

                            {aliasModalData?.data_type === "tables" &&
                                <Typography sx={{ ...styles.paraText, marginTop: '10px' }}>
                                    <strong>Table Name : </strong>
                                    {aliasModalData.table_name}
                                </Typography>}

                            <Box marginTop={'20px'}>
                                <Typography sx={{ ...styles.subHeadingText, marginBottom: '5px' }}>Field Name</Typography>
                                <TextField
                                    value={aliasModalData.field_name || ''}
                                    size="small"
                                    sx={{ width: '60%', ...styles.textInput, ...componentStyle.textField }}
                                    disabled
                                />
                            </Box>

                            <Box marginTop={'20px'}>
                                <Typography sx={{ ...styles.subHeadingText, marginBottom: '5px' }}>Field Description</Typography>
                                <TextField
                                    value={fieldDescriptions || ''}
                                    size="small"
                                    sx={{ width: '100%', ...styles.textInput, ...componentStyle.textField }}
                                    onChange={(e) => setFieldDescription(e.target.value)}
                                />
                            </Box>

                            <Box marginTop={'20px'}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <Typography sx={{ ...styles.subHeadingText, lineHeight: 1, display: "flex", alignItems: "center" }}>
                                        Aliases
                                    </Typography>

                                    <Box
                                        sx={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: 'pointer' }}
                                        onClick={() => handleDomainDictionaryAliasAdd()}
                                    >
                                        <ReactSVG
                                            src={addIcon}
                                            beforeInjection={(svg) => {
                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height}; display: block;`);
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <Box marginTop="10px"
                                    display="flex"
                                    flexWrap="wrap"
                                    gap="10px"
                                    maxWidth="100%"
                                >
                                    {aliasModalData.field_alias?.length > 0 ?
                                        (aliasModalData.field_alias?.map((alias, index) => (
                                            <TextField
                                                key={index}
                                                value={alias}
                                                onChange={(e) => handleDomainDictionaryAliasValue(index, e.target.value)}
                                                placeholder="alias"
                                                size="small"
                                                sx={{ width: "110px", ...styles.textInput, ...componentStyle.textField }}
                                                InputProps={{
                                                    readOnly: false,
                                                    style: styles.paraText,
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <Box
                                                                onClick={() => handleDomainDictionaryAliasDelete(index)}
                                                                sx={{ cursor: "pointer" }}
                                                            >
                                                                <ReactSVG
                                                                    src={trashIcon}
                                                                    beforeInjection={(svg) => {
                                                                        svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                    }}
                                                                />
                                                            </Box>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        )))
                                        :
                                        (<Box>
                                            <Typography sx={styles.paraText}>No Alias Available</Typography>
                                        </Box>)}
                                </Box>
                            </Box>

                        </Box>

                    </Box>
                </Modal >

                {/* Modal For Draw Field Addition Handling */}
                <Modal
                    open={wordSelectionModalData.modalstatus}
                    onClose={handleDrawEntityCancel}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Box sx={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: '520px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: 24,
                        backgroundColor: '#FFFFFF',
                        borderRadius: '15px',
                        padding: '25px',
                        transform: 'translate(-50%,-50%)'
                    }}>


                        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                            <Typography sx={styles.headingText}>Add to Document Type</Typography>
                            <Box display={'flex'} alignItems={'center'}>
                                <Button
                                    sx={styles.saveBtn}
                                    onClick={handleDrawEntitySave}
                                >
                                    <Typography sx={styles.btnText}>SAVE</Typography>
                                </Button>
                                <Button
                                    sx={{ ...styles.cancelBtn, marginLeft: '20px' }}
                                    onClick={handleDrawEntityCancel}
                                >
                                    <Typography sx={styles.btnText}>CANCEL</Typography>
                                </Button>
                            </Box>
                        </Box>

                        <Box marginTop={'20px'}>
                            <Box>
                                <FormControl>
                                    <Typography sx={{ ...styles.paraText, marginBottom: '5px', fontWeight: 600 }}>Field Name</Typography>
                                    <TextField
                                        id="new_field"
                                        placeholder='Analysis Name'
                                        InputProps={{
                                            readOnly: false,
                                            style: styles.paraText
                                        }}
                                        size='small'
                                        value={wordSelectionModalData.draw_data}
                                        onChange={(e) => setWordSelectionModalData({ ...wordSelectionModalData, draw_data: e.target.value })}
                                        sx={{ width: '220px', ...styles.textInput, ...componentStyle.textField }}
                                    />
                                </FormControl>
                            </Box>

                            {/* Handling the field */}
                            {(!drawAddAlias && !drawAddGroup && !drawAddTable) &&
                                <Box marginTop="20px" display="flex" alignItems="center">
                                    <Box
                                        onClick={() => { setDrawAddGroup(false); setDrawAddAlias(true) }}
                                        sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <ReactSVG
                                                src={addUnfillIcon}
                                                beforeInjection={(svg) => {
                                                    svg.setAttribute("style", "width: 16px; height: 16px; display: block;");
                                                }}
                                            />
                                        </Box>
                                        <Typography sx={{ ...styles.paraText, color: "#0B51C5", lineHeight: 1, display: "flex", alignItems: "center" }}>
                                            Add as Alias
                                        </Typography>
                                    </Box>
                                    <Box
                                        onClick={() => {
                                            setDrawAddAlias(false);
                                            setDomainDictionaryGroupTables([]);
                                            setDrawAddGroup(false)
                                            setDrawAddTable(true);
                                        }}
                                        sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginLeft: '20px' }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <ReactSVG
                                                src={addUnfillIcon}
                                                beforeInjection={(svg) => {
                                                    svg.setAttribute("style", "width: 16px; height: 16px; display: block;");
                                                }}
                                            />
                                        </Box>
                                        <Typography sx={{ ...styles.paraText, color: "#0B51C5", lineHeight: 1, display: "flex", alignItems: "center" }}>
                                            Add to Table
                                        </Typography>
                                    </Box>
                                    <Box
                                        onClick={() => {
                                            setDrawAddAlias(false);
                                            setDrawAddTable(false);
                                            setDomainDictionaryGroupTables([]);
                                            setDomainDictionaryGroupTableFields([])
                                            setDomainDictionaryTableFields([])
                                            setDomainDictionaryGroupFields([])
                                            setDrawAddGroup(true)
                                        }}
                                        sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginLeft: '20px' }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <ReactSVG
                                                src={addUnfillIcon}
                                                beforeInjection={(svg) => {
                                                    svg.setAttribute("style", "width: 16px; height: 16px; display: block;");
                                                }}
                                            />
                                        </Box>
                                        <Typography sx={{ ...styles.paraText, color: "#0B51C5", lineHeight: 1, display: "flex", alignItems: "center" }}>
                                            Add to Group
                                        </Typography>
                                    </Box>
                                </Box>
                            }

                            {/* Handling the field alias */}
                            {(drawAddAlias && !drawAddTable && !drawAddGroup) &&
                                (<Box marginTop={'20px'}>
                                    <FormControl>
                                        <Typography sx={{ ...styles.paraText, marginBottom: '5px', fontWeight: 600 }}>Add as Alias</Typography>
                                        <Box display={'flex'} alignItems={'center'}>
                                            <Autocomplete
                                                sx={{ width: '200px', ...styles.textInput }}
                                                size='small'
                                                options={domainDictionaryFields}
                                                getOptionLabel={(option) => option?.name}
                                                InputProps={{
                                                    readOnly: false,
                                                    style: styles.paraText
                                                }}
                                                id="clear-on-escape"
                                                clearOnEscape
                                                value={drawFieldSelection}
                                                renderInput={(params) => (
                                                    <TextField {...params} variant="outlined" placeholder="Choose a field" sx={componentStyle.textField} />
                                                )}
                                                onChange={(event, value) => setDrawFieldSelection(value)}
                                            />
                                            <Box
                                                onClick={() => { setDrawAddAlias(false); setDrawAddGroup(false); setDrawAddTable(false) }}
                                                sx={{ cursor: "pointer", marginLeft: '10px' }}
                                            >
                                                <ReactSVG
                                                    src={trashIcon}
                                                    beforeInjection={(svg) => {
                                                        svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </FormControl>
                                </Box>)
                            }

                            {/* Handling The Table */}
                            {(drawAddTable && !drawAddGroup) &&
                                (<Box marginTop={'20px'}>
                                    <Box >
                                        <Box marginTop={'20px'}>
                                            <FormControl>
                                                <Typography sx={{ ...styles.paraText, marginBottom: '5px', fontWeight: 600 }}>Add to Table</Typography>
                                                <Box display={'flex'} alignItems={'center'}>
                                                    <Autocomplete
                                                        sx={{ width: '200px', ...styles.textInput }}
                                                        size='small'
                                                        options={domainDictionaryTables}
                                                        getOptionLabel={(option) => option?.name}
                                                        InputProps={{
                                                            readOnly: false,
                                                            style: styles.paraText
                                                        }}
                                                        id="clear-on-escape"
                                                        clearOnEscape
                                                        value={drawTableSelection}
                                                        renderInput={(params) => (
                                                            <TextField {...params} variant="outlined" placeholder="Choose a field" sx={componentStyle.textField} />
                                                        )}
                                                        onChange={(event, value) => hanldeGroupTableSelection('table', value)}
                                                    />
                                                    <Box
                                                        onClick={() => setDrawAddTable(false)}
                                                        sx={{ cursor: "pointer", marginLeft: '10px' }}
                                                    >
                                                        <ReactSVG
                                                            src={trashIcon}
                                                            beforeInjection={(svg) => {
                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </FormControl>
                                        </Box>
                                        {!drawAddAlias &&
                                            (<Box
                                                onClick={() => {
                                                    if (!drawTableSelection) {
                                                        alert('Please select the table and try again')
                                                        return
                                                    }
                                                    setDrawAddAlias(true);
                                                }}
                                                sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginTop: '10px' }}
                                            >
                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <ReactSVG
                                                        src={addUnfillIcon}
                                                        beforeInjection={(svg) => {
                                                            svg.setAttribute("style", "width: 16px; height: 16px; display: block;");
                                                        }}
                                                    />
                                                </Box>
                                                <Typography sx={{ ...styles.paraText, color: "#0B51C5", lineHeight: 1, display: "flex", alignItems: "center" }}>
                                                    Add as Alias
                                                </Typography>
                                            </Box>)
                                        }
                                    </Box>

                                    {(drawAddTable && drawAddAlias) &&
                                        (<Box marginTop={'20px'}>
                                            <FormControl>
                                                <Typography sx={{ ...styles.paraText, marginBottom: '5px', fontWeight: 600 }}>Add as Alias</Typography>
                                                <Box display={'flex'} alignItems={'center'}>
                                                    <Autocomplete
                                                        sx={{ width: '200px', ...styles.textInput }}
                                                        size='small'
                                                        options={domainDictionaryTableFields}
                                                        getOptionLabel={(option) => option?.name}
                                                        InputProps={{
                                                            readOnly: false,
                                                            style: styles.paraText
                                                        }}
                                                        id="clear-on-escape"
                                                        clearOnEscape
                                                        value={drawFieldSelection}
                                                        renderInput={(params) => (
                                                            <TextField {...params} variant="outlined" placeholder="Choose a field" sx={componentStyle.textField} />
                                                        )}
                                                        onChange={(event, value) => setDrawFieldSelection(value)}
                                                    />
                                                    <Box
                                                        onClick={() => setDrawAddAlias(false)}
                                                        sx={{ cursor: "pointer", marginLeft: '10px' }}
                                                    >
                                                        <ReactSVG
                                                            src={trashIcon}
                                                            beforeInjection={(svg) => {
                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </FormControl>
                                        </Box>)
                                    }

                                </Box>)
                            }

                            {/* Handling the group */}
                            {drawAddGroup &&
                                (<Box marginTop={'20px'}>
                                    <Box>
                                        <Box>
                                            <FormControl>
                                                <Typography sx={{ ...styles.paraText, marginBottom: '5px', fontWeight: 600 }}>Add to Group</Typography>
                                                <Box display={'flex'} alignItems={'center'}>
                                                    <Autocomplete
                                                        sx={{ width: '200px', ...styles.textInput }}
                                                        size='small'
                                                        options={domainDictionaryGroups}
                                                        getOptionLabel={(option) => option?.name}
                                                        InputProps={{
                                                            readOnly: false,
                                                            style: styles.paraText
                                                        }}
                                                        id="clear-on-escape"
                                                        clearOnEscape
                                                        value={drawGroupSelection}
                                                        renderInput={(params) => (
                                                            <TextField {...params} variant="outlined" placeholder="Choose a field" sx={componentStyle.textField} />
                                                        )}
                                                        onChange={(event, value) => handleGroupSelection(value)}
                                                    />
                                                    <Box
                                                        onClick={() => { setDrawAddGroup(false); setDrawAddTable(false) }}
                                                        sx={{ cursor: "pointer", marginLeft: '10px' }}
                                                    >
                                                        <ReactSVG
                                                            src={trashIcon}
                                                            beforeInjection={(svg) => {
                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </FormControl>
                                        </Box>

                                        {(!drawAddTable && !drawAddAlias) &&
                                            (<Box marginTop="10px" display="flex" alignItems="center">
                                                <Box
                                                    onClick={() => hanldeDrawAddTable('alias')}
                                                    sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <ReactSVG
                                                            src={addUnfillIcon}
                                                            beforeInjection={(svg) => {
                                                                svg.setAttribute("style", "width: 16px; height: 16px; display: block;");
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography sx={{ ...styles.paraText, color: "#0B51C5", lineHeight: 1, display: "flex", alignItems: "center" }}>
                                                        Add as Alias
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    onClick={() => hanldeDrawAddTable('table')}
                                                    sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginLeft: '10px' }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <ReactSVG
                                                            src={addUnfillIcon}
                                                            beforeInjection={(svg) => {
                                                                svg.setAttribute("style", "width: 16px; height: 16px; display: block;");
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography sx={{ ...styles.paraText, color: "#0B51C5", lineHeight: 1, display: "flex", alignItems: "center" }}>
                                                        Add to Table
                                                    </Typography>
                                                </Box>
                                            </Box>)
                                        }
                                    </Box>

                                    {/* group field alias */}
                                    {drawAddAlias &&
                                        (<Box marginTop={'20px'}>
                                            <FormControl>
                                                <Typography sx={{ ...styles.paraText, marginBottom: '5px', fontWeight: 600 }}>Add as Alias</Typography>
                                                <Box display={'flex'} alignItems={'center'}>
                                                    <Autocomplete
                                                        sx={{ width: '200px', ...styles.textInput }}
                                                        size='small'
                                                        options={domainDictionaryGroupFields}
                                                        getOptionLabel={(option) => option?.name}
                                                        InputProps={{
                                                            readOnly: false,
                                                            style: styles.paraText
                                                        }}
                                                        id="clear-on-escape"
                                                        clearOnEscape
                                                        value={drawFieldSelection}
                                                        renderInput={(params) => (
                                                            <TextField {...params} variant="outlined" placeholder="Choose a field" sx={componentStyle.textField} />
                                                        )}
                                                        onChange={(event, value) => setDrawFieldSelection(value)}
                                                    />
                                                    <Box
                                                        onClick={() => setDrawAddAlias(false)}
                                                        sx={{ cursor: "pointer", marginLeft: '10px' }}
                                                    >
                                                        <ReactSVG
                                                            src={trashIcon}
                                                            beforeInjection={(svg) => {
                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </FormControl>
                                        </Box>)
                                    }

                                    {/* group table filed */}
                                    {drawAddTable &&
                                        (<Box marginTop={'20px'}>
                                            <Box marginTop={'20px'}>
                                                <FormControl>
                                                    <Typography sx={{ ...styles.paraText, marginBottom: '5px', fontWeight: 600 }}>Add to Table</Typography>
                                                    <Box display={'flex'} alignItems={'center'}>
                                                        <Autocomplete
                                                            sx={{ width: '200px', ...styles.textInput }}
                                                            size='small'
                                                            options={domainDictionaryGroupTables}
                                                            getOptionLabel={(option) => option?.name}
                                                            InputProps={{
                                                                readOnly: false,
                                                                style: styles.paraText
                                                            }}
                                                            id="clear-on-escape"
                                                            clearOnEscape
                                                            value={drawTableSelection}
                                                            renderInput={(params) => (
                                                                <TextField {...params} variant="outlined" placeholder="Choose a field" sx={componentStyle.textField} />
                                                            )}
                                                            onChange={(event, value) => hanldeGroupTableSelection('group_table', value)}
                                                        />
                                                        <Box
                                                            onClick={() => setDrawAddTable(false)}
                                                            sx={{ cursor: "pointer", marginLeft: '10px' }}
                                                        >
                                                            <ReactSVG
                                                                src={trashIcon}
                                                                beforeInjection={(svg) => {
                                                                    svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </FormControl>
                                            </Box>
                                            {!drawAddAlias &&
                                                (<Box
                                                    onClick={() => {
                                                        if (!drawTableSelection) {
                                                            alert('Please select the table and try again')
                                                            return
                                                        }
                                                        setDrawAddAlias(true);
                                                    }}
                                                    sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginTop: '10px' }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <ReactSVG
                                                            src={addUnfillIcon}
                                                            beforeInjection={(svg) => {
                                                                svg.setAttribute("style", "width: 16px; height: 16px; display: block;");
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography sx={{ ...styles.paraText, color: "#0B51C5", lineHeight: 1, display: "flex", alignItems: "center" }}>
                                                        Add as Alias
                                                    </Typography>
                                                </Box>)
                                            }
                                        </Box>)
                                    }

                                    {/* group table filed alias */}
                                    {(drawAddTable && drawAddAlias) &&
                                        (<Box marginTop={'20px'}>
                                            <FormControl>
                                                <Typography sx={{ ...styles.paraText, marginBottom: '5px', fontWeight: 600 }}>Add as Alias</Typography>
                                                <Box display={'flex'} alignItems={'center'}>
                                                    <Autocomplete
                                                        sx={{ width: '200px', ...styles.textInput }}
                                                        size='small'
                                                        options={domainDictionaryGroupTableFields}
                                                        getOptionLabel={(option) => option?.name}
                                                        InputProps={{
                                                            readOnly: false,
                                                            style: styles.paraText
                                                        }}
                                                        id="clear-on-escape"
                                                        clearOnEscape
                                                        value={drawFieldSelection}
                                                        renderInput={(params) => (
                                                            <TextField {...params} variant="outlined" placeholder="Choose a field" sx={componentStyle.textField} />
                                                        )}
                                                        onChange={(event, value) => setDrawTableFieldSelection(value)}
                                                    />
                                                    <Box
                                                        onClick={() => setDrawAddAlias(false)}
                                                        sx={{ cursor: "pointer", marginLeft: '10px' }}
                                                    >
                                                        <ReactSVG
                                                            src={trashIcon}
                                                            beforeInjection={(svg) => {
                                                                svg.setAttribute('style', `width: ${styles.svgIcons.width}; height:${styles.svgIcons.height};`);
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </FormControl>
                                        </Box>)
                                    }

                                </Box>)
                            }

                        </Box>
                    </Box>
                </Modal >

            </Box >
        </Box >
    )
}

export default ExtractionLayout;