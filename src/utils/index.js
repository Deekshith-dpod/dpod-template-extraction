export const convertFloatsToStrings = (obj) => {
    if (typeof obj === 'number' && !Number.isInteger(obj)) {
        return obj.toString();
    } else if (Array.isArray(obj)) {
        return obj.map(convertFloatsToStrings);
    } else if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, convertFloatsToStrings(value)])
        );
    }
    return obj;
};

const getFileNameFromPresignedUrl = async (url) => {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const parts = pathname.split('/');
        const filename = parts[parts.length - 1];
        return filename;
    } catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
}

export const urlToFile = async (url) => {
    try {
        try {
            new URL(url);
        } catch {
            console.log("Invalid URL:", url);
            return null;
        }
        const response = await fetch(url);
        if (!response.ok) {
            console.log(`Fetch failed with status: ${response.status}`);
            return null;
        }
        const blob = await response.blob();
        const filename = await getFileNameFromPresignedUrl(url);
        return new File([blob], filename, { type: "application/pdf" });
    } catch (error) {
        console.log("Unexpected error:", error);
        return null;
    }
};

export const lightTheme = {
    base00: '#ffffff',
    base01: '#f0f0f0',
    base02: '#e0e0e0',
    base03: '#d0d0d0',
    base04: '#999999',
    base05: '#333333',
    base06: '#222222',
    base07: '#000000',
    base08: '#ff0000',
    base09: '#ff9900',
    base0A: '#ffcc00',
    base0B: '#33cc33',
    base0C: '#00cccc',
    base0D: '#0066ff',
    base0E: '#cc66cc',
    base0F: '#990000',
};

export const handleExtractionFields = async (schema_fields = [], entity_fields = {}) => {
    try {
        schema_fields.forEach(field => {
            const match = entity_fields[field?.name];
            if (match) {
                if (match.source_label !== "" && match.value !== null) {
                    field.view = true;
                } else {
                    field.view = false;
                }
            }
        });
        return schema_fields;
    } catch (error) {
        return [];
    }
};

export const handleExtractionTables = async (schema_tables = [], entity_tables = []) => {
    try {
        for (const schema_table of schema_tables) {
            for (const entity_table of entity_tables) {
                if (schema_table?.name === entity_table?.table?.name) {
                    const schema_fields = schema_table.fields ?? [];
                    const entity_fields = entity_table?.rows?.[0]?.fields ?? {};

                    for (const schema_field of schema_fields) {
                        const match = entity_fields[schema_field?.name];
                        if (match) {
                            if (match.source_label !== "" && match.value !== null) {
                                schema_field.view = true
                            } else {
                                schema_field.view = false
                            }
                        }
                    }
                    break;
                }
            }
        }
        return schema_tables;
    } catch (error) {
        return [];
    }
};

export const handleExtractionGroups = async (schema_groups = [], entity_groups = []) => {
    try {
        for (const schema_group of schema_groups) {
            for (const entity_group of entity_groups) {
                if (schema_group?.name === entity_group?.group_name) {
                    const schema_group_fields = schema_group.fields ?? [];
                    const entity_group_fields = entity_group.fields ?? {};

                    for (const field of schema_group_fields) {
                        const match = entity_group_fields[field?.name];
                        if (match) {
                            if (match.source_label !== "" && match.value !== null) {
                                field.view = true;
                            } else {
                                field.view = false;
                            }
                        }
                    }

                    const schema_group_tables = schema_group.tables ?? [];
                    const entity_group_tables = entity_group.tables ?? [];

                    for (const schema_table of schema_group_tables) {
                        for (const entity_table of entity_group_tables) {
                            if (schema_table?.name === entity_table?.table?.name) {
                                const schema_fields = schema_table.fields ?? [];
                                const entity_fields = entity_table?.rows?.[0]?.fields ?? {};

                                for (const schema_field of schema_fields) {
                                    const match = entity_fields[schema_field?.name];
                                    if (match) {
                                        if (match.source_label !== "" && match.value !== null) {
                                            schema_field.view = true;
                                        } else {
                                            schema_field.view = false;
                                        }
                                    }
                                }
                                break;
                            }
                        }
                    }
                    break;
                }
            }
        }
        return schema_groups;
    } catch (error) {
        return [];
    }
};