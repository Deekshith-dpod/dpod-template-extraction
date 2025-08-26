import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import "./styles/css/app.css";
import ExtractionHome from './containers/ExtractionHome';

function App() {

    const [layout, setLayoutPreview] = useState(true);

    const handleLaunch = () => {
        setLayoutPreview(false);
    };

    // local-qa:
    // const appflyte_backend_url = "https://appflyte-backend.ameya.ai".

    const appflyte_backend_url="https://api-dev.appflyte.net"
    const appflyte_agent_api_token = "80236a44-2f80-44be-b3c6-3e2a8a1107c9";

    const extraction_document_type_id="dc314c50-987b-42cd-9b24-5ca51eb944ee"
    const appflyte_project_id = "4f58b8e9-da09-48b6-9af4-fe3ce657373c"


    // [coa]
    // const appflyte_project_id = "ae7e5874-edd1-4cbd-8ee6-b85119a29abf"
    // const extraction_document_type_id = "ae5a87c5-a790-405b-a636-a75f25390125"
    const extraction_file_id = "f51ac-7af7-4cdc-b6a8-7a011fd2d865"

    // // [invoice]:
    // const appflyte_project_id = "cf346d34-d330-4d90-82a8-4022c57e16b4"
    // const extraction_document_type_id = "9685a0bc-706c-406a-b1ab-6380d78c30b4"
    // const extraction_file_id = "f51ac-7af7-4cdc-b6a8-7a011fd2d865"


    return (
        <div id='app'>
            {layout ?
                (<ExtractionHome
                    appflyte_backend_url={appflyte_backend_url}
                    appflyte_agent_api_token={appflyte_agent_api_token}
                    appflyte_project_id={appflyte_project_id}
                    extraction_document_type_id={extraction_document_type_id}
                    extraction_file_id={extraction_file_id}
                    onCancel={handleLaunch}
                />)
                :
                (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <Button
                        onClick={() => setLayoutPreview(true)}
                        sx={{ backgroundColor: "#0B51C5", color: '#ffffff', borderRadius: '15px', width: '100px', textTransform: 'none' }}
                    >
                        Launch
                    </Button>
                </Box>)
            }
        </div >
    )
}

export default App;