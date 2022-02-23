export const paginate = async (callback, path) => {
    let nextToken;
    let data = [];
    do {
        const res = await callback(nextToken)
        nextToken = res.NextToken
        data = data.concat(res[path]);
    } while (nextToken)

    return data;
}