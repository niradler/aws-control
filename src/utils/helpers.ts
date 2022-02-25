import Path from 'path'
export const toAbsPath = (path) => {
    const isAbsolute = Path.isAbsolute(path)
    if (!isAbsolute) {
        path = Path.join(process.cwd(), path)
    }

    return path
}

export const consoleOutput = (message, type) => {
    switch (type) {
        case 'table':
            console.table(message);
            break;
        case 'log':
            console.log(message);
            break;
        case 'json':
            console.log(JSON.stringify(message, null, 2));
            break;
        default:
            console.log(message);
            break;
    }
}