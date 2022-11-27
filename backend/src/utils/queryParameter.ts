// From udacity, lession 2
// https://github.com/udacity/cloud-developer/blob/f8c8feb72fafb9725cec8552248437d470c57846/course-04/exercises/lesson-2/solution/index.js#L87
export function parseNextKeyParameter(event) {
    const nextKeyStr = getQueryParameter(event, 'nextKey')
    if (!nextKeyStr) {
        return undefined
    }

    const uriDecoded = decodeURIComponent(nextKeyStr)
    return JSON.parse(uriDecoded)
}

export function getQueryParameter(event, name) {
    const queryParams = event.queryStringParameters
    if (!queryParams) {
        return undefined
    }

    return queryParams[name]
}

export function encodeNextKey(lastEvaluatedKey) {
    if (!lastEvaluatedKey) {
        return null
    }

    return encodeURIComponent(JSON.stringify(lastEvaluatedKey))
}

export function parseLimitParameter(event) {
    const limitStr = getQueryParameter(event, 'limit')
    if (!limitStr) {
        return undefined
    }

    const limit = parseInt(limitStr, 10)
    if (limit <= 0) {
        throw new Error('Limit should be positive')
    }

    return limit
}