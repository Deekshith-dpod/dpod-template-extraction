const normalizeFieldData = (data) => {
    return {
        name: data.name || "",
        description: data.description || "",
        type: data.type || "string",
        alias: Array.isArray(data.alias) ? data.alias : [],
        fields: Array.isArray(data.fields) ? data.fields : [],
        source_label: data.source_label || ""
    };
};

export const handleNewFieldAdd = async (domain_data, field_data, item_type, item_index, table_index, group_index) => {
    switch (item_type) {
        case "fields": {
            const updated = [...domain_data];
            const normalizedFieldData = normalizeFieldData(field_data);
            updated[item_index] = normalizedFieldData;
            return updated;
        }

        case "tables": {
            const updated = [...domain_data];
            const table = { ...updated[table_index] };
            table.fields = [...(table.fields || [])];
            const normalizedFieldData = normalizeFieldData(field_data);
            table.fields[item_index] = normalizedFieldData;
            updated[table_index] = table;
            return updated;
        }

        case "group_fields": {
            const updatedGroups = [...domain_data];
            const group = { ...updatedGroups[group_index] };

            const normalizedFieldData = normalizeFieldData(field_data);

            console.log(normalizedFieldData)
            console.log(item_index)

            const fields = [...(group.fields || [])];
            fields[item_index] = normalizedFieldData;

            group.fields = fields;
            updatedGroups[group_index] = group;

            return updatedGroups;
        }

        case "group_table_fields": {
            const updatedGroups = [...domain_data];
            const group = { ...updatedGroups[group_index] };

            const table = { ...group.tables[table_index] };
            const fields = [...(table.fields || [])];

            const normalizedFieldData = normalizeFieldData(field_data);
            fields[item_index] = normalizedFieldData;

            table.fields = fields;

            group.tables = [
                ...group.tables.slice(0, table_index),
                table,
                ...group.tables.slice(table_index + 1)
            ];

            updatedGroups[group_index] = group;

            return updatedGroups;
        }


        default:
            console.warn("Unknown item_type:", item_type);
            return domain_data;
    }
};

export const handleConstructFieldData = async (schema_data) => {
    if (!Array.isArray(schema_data) || !schema_data.length) return;

    const [{ fields = [], tables = [], groups = [] }] = schema_data;

    const constructField = ({ name = '', description = '', data_type = 'string', alias = [], source_label = '', view = false }) => ({
        name,
        description,
        type: data_type,
        alias: [],
        source_label,
        view
    });

    const constructTable = ({ name = '', description = '', fields = [] }) => ({
        name,
        description,
        fields: fields.map(constructField),
    });

    const updatedFields = fields.map(constructField);
    const updatedTables = tables.map(constructTable);

    const updatedGroups = groups.map(({ name = '', description = '', fields = [], tables = [] }) => ({
        name,
        description,
        fields: fields.map(constructField),
        tables: tables.map(constructTable),
    }));

    return {
        updatedFields,
        updatedTables,
        updatedGroups,
    };
};



