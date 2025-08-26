let globalController = new AbortController();

export const cancelAllApis =async () => {
  globalController.abort();
  globalController = new AbortController();
};

export const makeCancellableRequest = async (axiosInstance, config) => {
  try {
    const response = await axiosInstance({ ...config, signal: globalController.signal });
    return response;
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      console.log(`API request to ${config.url} was cancelled`);
      return null;
    }
    throw error;
  }
};
