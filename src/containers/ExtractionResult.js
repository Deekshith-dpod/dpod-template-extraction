import React, { useState } from 'react'
import { Box, Collapse, Divider, IconButton, Typography } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

function ExtractionResult({ extractionResponse, filepage }) {
    const [groupOpenIndex, setGroupOpenIndex] = useState(null);
    const [tableOpenIndex, setTableOpenIndex] = useState(null);
    const [groupTableOpenIndex, setGroupTableOpenIndex] = useState(null);

    function formatLabel(label) {
        if (typeof label !== 'string') return '';
        return label.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    return (
        <Box>
            {/* Fields */}
            <Box marginTop={'5px'} padding={Object.entries(extractionResponse?.files?.[filepage]?.mapped_fields || {}).length > 0 && '20px'}>
                {Object.entries(extractionResponse?.files?.[filepage]?.mapped_fields || {}).length > 0 &&
                    (Object.entries(extractionResponse?.files?.[filepage]?.mapped_fields)
                        .filter(([_, field]) =>
                            String(field?.value ?? '').trim() !== '' &&
                            (!('data_absent' in field) || field.data_absent === false) &&
                            field?.source_label != null
                        )

                        .map(([key, field], i) => (
                            <Box
                                key={i}
                                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}
                            >
                                <Typography sx={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {field?.source_label}
                                </Typography>
                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', marginLeft: '5px' }}>
                                    <Typography sx={{ fontSize: '14px', fontWeight: 400, textAlign: 'right', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                        {String(field?.value ?? "").trim() ? field?.value : "--"}
                                    </Typography>
                                </Box>
                            </Box>
                        ))
                    )
                }
            </Box>
            {Object.entries(extractionResponse?.files?.[filepage]?.tables || {}).length > 0 && <Divider />}

            {/* Tables */}
            <Box padding={(extractionResponse?.files?.[filepage]?.tables || []).length > 0 && '20px'}>
                {(extractionResponse?.files?.[filepage]?.tables || []).length > 0 && (
                    extractionResponse?.files?.[filepage]?.tables?.map((item, index) => (
                        <Box key={index}>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontSize: '15px', fontWeight: 500 }}>{formatLabel(item?.table?.source_label)}</Typography>
                                <IconButton
                                    sx={{ fontSize: '15px', fontWeight: 500 }}
                                    onClick={() => setTableOpenIndex(tableOpenIndex === index ? null : index)}
                                >
                                    {tableOpenIndex === index ? <KeyboardArrowUp sx={{ color: '#0B51C5' }} /> : <KeyboardArrowDown sx={{ color: '#0B51C5' }} />}
                                </IconButton>
                            </Box>

                            <Collapse in={tableOpenIndex === index} timeout="auto" unmountOnExit sx={{ backgroundColor: '#FFFFFF' }}>
                                {(item?.rows || []).length === 0 ? (
                                    <Typography sx={{ fontSize: '14px', fontWeight: 400, margin: '0 0 10px 10px' }}>No row available</Typography>
                                ) : (
                                    item.rows
                                        .filter(row => String(row?.result ?? '').trim() !== '')
                                        .map((row, rowIndex) => (
                                            <Box
                                                key={rowIndex}
                                                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '0 20px 10px 20px' }}
                                            >
                                                <Typography sx={{ fontSize: '14px', fontWeight: 400, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                    {row?.parameter}
                                                </Typography>

                                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', marginLeft: '5px' }}>
                                                    <Typography
                                                        sx={{ fontSize: '14px', fontWeight: 400, textAlign: 'right', wordBreak: 'break-word', whiteSpace: 'normal' }}
                                                    >
                                                        {String(row?.result ?? "").trim() ? row?.result : "--"}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )))
                                }
                            </Collapse>
                        </Box>
                    )))
                }
            </Box>
            {(extractionResponse?.files?.[filepage]?.groups || []).length > 0 && <Divider />}

            {/* Groups */}
            <Box padding={'20px'}>
                {(extractionResponse?.files?.[filepage]?.groups || []).length > 0 &&
                    (extractionResponse?.files?.[filepage]?.groups?.map((item, index) => (
                        <Box key={index}>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontSize: '15px', fontWeight: 500 }}>{formatLabel(item?.group_name)}</Typography>
                                <IconButton
                                    sx={{ fontSize: '15px', fontWeight: 500 }}
                                    onClick={() => setGroupOpenIndex(groupOpenIndex === index ? null : index)}
                                >
                                    {groupOpenIndex === index ? <KeyboardArrowUp sx={{ color: '#0B51C5' }} /> : <KeyboardArrowDown sx={{ color: '#0B51C5' }} />}
                                </IconButton>
                            </Box>

                            <Collapse in={groupOpenIndex === index} timeout="auto" unmountOnExit sx={{ backgroundColor: '#FFFFFF' }}>
                                <Box>
                                    {Object.entries(item?.fields || {}).length > 0 &&
                                        Object.entries(item.fields)
                                            .filter(([_, field]) => String(field?.value ?? '').trim() !== '')
                                            .map(([key, field], i) => (
                                                <Box
                                                    key={i}
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "flex-start",
                                                        margin: '0 20px 10px 20px',
                                                        gap: 2,
                                                        flexWrap: "wrap"
                                                    }}
                                                >
                                                    <Typography sx={{ fontSize: "14px", fontWeight: 400, minWidth: "200px", maxWidth: "300px", wordBreak: "break-word" }}>
                                                        {field?.source_label}
                                                    </Typography>

                                                    <Box sx={{ flex: 1, textAlign: "right" }}>
                                                        <Typography sx={{ fontSize: '14px', fontWeight: 400, wordBreak: 'break-word' }} >
                                                            {String(field?.value ?? "").trim() ? field?.value : "--"}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                            ))
                                    }

                                    {(item?.tables || []).length > 0 && item?.tables?.map((table, tableIndex) => (
                                        <Box key={tableIndex} margin={'0 20px 0 20px'}>

                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>{formatLabel(table?.table?.source_label)}</Typography>
                                                <IconButton
                                                    sx={{ fontSize: '15px', fontWeight: 500 }}
                                                    onClick={() => setGroupTableOpenIndex(groupTableOpenIndex === tableIndex ? null : tableIndex)}
                                                >
                                                    {groupTableOpenIndex === tableIndex ? <KeyboardArrowUp sx={{ color: '#0B51C5' }} /> : <KeyboardArrowDown sx={{ color: '#0B51C5' }} />}
                                                </IconButton>
                                            </Box>

                                            <Collapse in={groupTableOpenIndex === tableIndex} timeout="auto" unmountOnExit sx={{ backgroundColor: '#FFFFFF' }}>

                                                {(table?.rows && Array.isArray(table.rows) && table.rows.length > 0) && (
                                                    table.rows
                                                        .filter(row => String(row?.result ?? '').trim() !== '')
                                                        .map((row, rowIndex) => (
                                                            <Box
                                                                key={rowIndex}
                                                                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '0 20px 10px 20px' }}
                                                            >
                                                                <Typography sx={{ fontSize: '14px', fontWeight: 400, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                                    {row?.parameter}
                                                                </Typography>

                                                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', marginLeft: '5px' }}>
                                                                    <Typography sx={{ fontSize: '14px', fontWeight: 400, textAlign: 'right', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                                                        {String(row?.result ?? "").trim() ? row?.result : "--"}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>

                                                        )))
                                                }
                                            </Collapse>
                                        </Box>
                                    ))}
                                </Box>
                            </Collapse>
                        </Box>
                    )))
                }
            </Box>
        </Box>
    )
}

export default ExtractionResult;