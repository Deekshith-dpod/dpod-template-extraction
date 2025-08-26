export async function lowercaseStrings(jsonInput) {
  const processValue = (value) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    if (Array.isArray(value)) {
      return value.map(item => processValue(item));
    }
    if (typeof value === 'object' && value !== null) {
      return processObject(value);
    }
    return value;
  };

  const processObject = (obj) => {
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = processValue(obj[key]);
      }
    }
    return result;
  };

  return processObject(jsonInput);
}