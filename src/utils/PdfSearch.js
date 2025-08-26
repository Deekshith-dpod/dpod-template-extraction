export const generateSearchKeys = (domainDictionaryFields, domainDictionaryTables, domainDictionaryGroups) => {
    const fieldSearchKey = (domainDictionaryFields || []).map(item => ({ ...item }));

    const tableSearchKeys = [];
    (domainDictionaryTables || []).forEach(table => {
        tableSearchKeys.push({ name: table?.name || null, alias: [] });
        (table.fields || []).forEach(field => { tableSearchKeys.push({ name: field?.name || null, alias: field?.alias || [] }) });
    });

    const groupSearchKeys = [];
    (domainDictionaryGroups || []).forEach(group => {
        groupSearchKeys.push({ name: group?.name || null, alias: [] });
        (group.fields || []).forEach(field => { groupSearchKeys.push({ name: field?.name || null, alias: field?.alias || [] }) });

        (group.tables || []).forEach(table => {
            groupSearchKeys.push({ name: table?.name || null, alias: [] });
            (table.fields || []).forEach(tableField => {
                groupSearchKeys.push({ name: tableField?.name || null, alias: tableField?.alias || [] });
            });
        });
    });
    return [...fieldSearchKey, ...tableSearchKeys, ...groupSearchKeys];
};

const handleExtractionTables = (entity_tables = []) => {
    const searchKeysSet = new Set();
    for (const entity_table of entity_tables) {
        const tableSourceLabel = entity_table?.table?.source_label;
        if (tableSourceLabel) searchKeysSet.add(tableSourceLabel);

        const entityTableRows = entity_table?.rows ?? [];
        for (const row of entityTableRows) {
            const fields = row?.fields ?? {};
            for (const field of Object.values(fields)) {
                if (field?.value !== null && field?.source_label) {
                    searchKeysSet.add(field.source_label);
                }
            }
        }
    }
    return Array.from(searchKeysSet);
};

const handleExtractionGroups = (entity_groups = []) => {
    const searchKeysSet = new Set();

    for (const entity_group of entity_groups) {
        const entity_group_fields = entity_group.fields ?? {};
        for (const field of Object.values(entity_group_fields)) {
            if (field?.value !== null && field?.source_label) {
                searchKeysSet.add(field.source_label);
            }
        }

        const entity_group_tables = entity_group.tables ?? [];
        for (const entity_group_table of entity_group_tables) {
            const tableSourceLabel = entity_group_table?.table?.source_label;
            if (tableSourceLabel) searchKeysSet.add(tableSourceLabel);

            const entityTableRows = entity_group_table?.rows ?? [];
            for (const row of entityTableRows) {
                const fields = row?.fields ?? {};
                for (const field of Object.values(fields)) {
                    if (field?.value !== null && field?.source_label) {
                        searchKeysSet.add(field.source_label);
                    }
                }
            }
        }
    }
    return Array.from(searchKeysSet);
};

export const generateSearchKeysNew = (entities) => {
    const searchKeysSet = new Set();
    const extractionEntities = entities?.files?.[0] ?? {};

    const entityFields = extractionEntities?.mapped_fields ?? {};
    const entityTables = extractionEntities?.tables ?? [];
    const entityGroups = extractionEntities?.groups ?? [];

    for (const field of Object.values(entityFields)) {
        if (field?.value !== null && field?.source_label) {
            searchKeysSet.add(field.source_label);
        }
    }

    const tableKeys = handleExtractionTables(entityTables);
    for (const key of tableKeys) {
        searchKeysSet.add(key);
    }

    const groupKeys = handleExtractionGroups(entityGroups);
    for (const key of groupKeys) {
        searchKeysSet.add(key);
    }

    return Array.from(searchKeysSet);
};


