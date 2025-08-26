const handleErrorCode = (err) => {
    switch (err.code) {
        default:
            return err.message
    }
}

export const apiErrorHandler = (err) => {
    if (err.response !== undefined && err.response !== null) {

        if (err.response.data === null)
            alert('Something went wrong try again')

        else if ("schema_errors" in err.response.data)
            alert('Please check all fields and retry')

        else if ("message" in err.response.data) {
            if (typeof err.response.data.message === 'object' && "code" in err.response.data.message)
                alert(handleErrorCode(err.response.data.message))
            else
                alert(err.response.data.message)
        }

        else
            alert('Something went wrong try again')
    }
    else {
        if (err.message === "Network Error")
            alert('Something went wrong try again')
    }
}