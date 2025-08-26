import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {

    const [fileLastEvaluatedKey, setFileLastEvaluatedKey] = useState(null)

    return (
        <AppContext.Provider
            value={{
                setFileLastEvaluatedKey, fileLastEvaluatedKey
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}
