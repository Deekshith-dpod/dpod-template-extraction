export const getStyles = (theme) => ({
    mainContainer: {
        height: '100vh',
        width: '100%',
        backgroundColor: theme.palette.primary.main,
        minHeight: '100vh'
    },
    headerContainer: {
        padding: '10px',
        borderRadius: '15px',
        backgroundColor: theme.palette.secondary.main,
    },
    bodyContainer: {
        display: 'flex',
        flex: 1,
        gap: '1%',
        overflow: 'hidden',
        marginTop: '20px',
        width: '100%',
        maxWidth: '100%',
        '@media (max-width: 768px)': {
            flexDirection: 'column',
        }
    },
    settingsViewContainer: {
        flex: '0 0 32%',
        minWidth: '250px',
        maxWidth: '400px',
        backgroundColor: theme.palette.secondary.main,
        borderRadius: '15px',
        overflow: 'auto',
        padding: '20px',
        '@media (max-width: 768px)': {
            width: '100%',
            maxWidth: '100%',
        }
    },
    resultContainer: {
        flex: '1',
        borderRadius: '15px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        '@media (max-width: 768px)': {
            width: '100%',
            marginTop: '20px',
        }
    },
    fileChangeContainer: {
        height: '60px',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.customColors.ternary.main,
        borderRadius: '15px',
        padding: '15px'
    },
    resultViewContainer: {
        width: '100%',
        height: 'calc(100% - 70px)',
        marginTop: '10px',
        backgroundColor: theme.palette.secondary.main,
        borderRadius: '15px',
        overflow: 'hidden',
        maxWidth: '100%',
    },
    tabButtons: (isActive) => ({
        height: '21px',
        width: '90',
        borderRadius: '5px',
        backgroundColor: isActive ? theme.customColors.button.primary : '#FFFFFF',
        color: isActive ? '#FFFFFF' : theme.customColors.button.primary,
        border: '1px solid #0B51C5',
        textTransform: 'none'
    }),
    tabBtnText: (isActive) => ({
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        textTransform: 'none',
        padding: '10px',
        color: isActive ? '#FFFFFF' : '#0B51C5',
    }),
    headingText: {
        fontWeight: 600,
        fontSize: '16px'
    },
    paraText: {
        fontWeight: 400,
        fontSize: '13px'
    },
    fileUploadContainer: {
        width: '400px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: theme.palette.primary.main,
        borderRadius: '20px',
        marginTop: '10px'
    },
    validateBtn: {
        width: '100px',
        borderRadius: '20px',
        border: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.customColors.button.ternary,
        color: '#ffffff',
        '&.Mui-disabled': {
            backgroundColor: '#444444',
            color: '#ffffff',
            opacity: 0.7,
        }
    },
    saveBtn: {
        width: '100px',
        borderRadius: '20px',
        border: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.customColors.button.primary,
        color: '#ffffff',
        '&.Mui-disabled': {
            backgroundColor: '#444444',
            color: '#ffffff',
            opacity: 0.7,
        }
    },
    cancelBtn: {
        width: '100px',
        borderRadius: '20px',
        border: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.customColors.button.secondary,
        color: '#000000'
    },
    subHeadingText: {
        fontSize: 13,
        fontWeight: 600
    },
    btnText: {
        fontSize: 14,
        fontWeight: 600,
        textTransform: 'none'
    },
    fileDropLabelText: {
        fontSize: 14,
        fontWeight: 600,
    },
    textInput: {
        '& .MuiOutlinedInput-root': {
            height: '35px',
        },
        height: '35px',
    },
    svgIcons: {
        height: '18px',
        width: '18px'
    },
})