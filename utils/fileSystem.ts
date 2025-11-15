import { get, set, del } from 'idb-keyval';

// Fix: Define FileSystemHandlePermissionDescriptor to resolve TypeScript error as it's part of the experimental File System Access API.
interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite';
}

const FILE_HANDLE_KEY = 'teares-app-file-handle';

// Salva o file handle no IndexedDB
export async function saveHandle(handle: FileSystemFileHandle): Promise<void> {
    await set(FILE_HANDLE_KEY, handle);
}

// Recupera o file handle do IndexedDB
export async function getHandle(): Promise<FileSystemFileHandle | undefined> {
    return await get(FILE_HANDLE_KEY);
}

// Limpa o file handle do IndexedDB
export async function clearHandle(): Promise<void> {
    await del(FILE_HANDLE_KEY);
}

// Verifica e solicita permissão para um file handle
export async function verifyPermission(fileHandle: FileSystemFileHandle, readWrite = true): Promise<boolean> {
    const options: FileSystemHandlePermissionDescriptor = {};
    if (readWrite) {
        options.mode = 'readwrite';
    }
    // Verifica o status da permissão atual
    // Fix: Cast fileHandle to `any` to access experimental `queryPermission` method.
    if (await (fileHandle as any).queryPermission(options) === 'granted') {
        return true;
    }
    // Solicita permissão se não for concedida
    // Fix: Cast fileHandle to `any` to access experimental `requestPermission` method.
    if (await (fileHandle as any).requestPermission(options) === 'granted') {
        return true;
    }
    return false;
}

// Abre o seletor de arquivos para obter um novo handle
export async function getFileHandle(): Promise<FileSystemFileHandle> {
     const options = {
        types: [
            {
                description: 'JSON Files',
                accept: {
                    'application/json': ['.json'],
                },
            },
        ],
        suggestedName: 'dados_teares.json',
    };
    // @ts-ignore
    const handle = await window.showOpenFilePicker(options);
    return handle[0];
}

// Lê o conteúdo de um arquivo
export async function readFile(fileHandle: FileSystemFileHandle): Promise<string> {
    const permission = await verifyPermission(fileHandle, false);
    if (!permission) {
        throw new Error('Permission to read file was denied.');
    }
    const file = await fileHandle.getFile();
    return await file.text();
}

// Escreve conteúdo em um arquivo
export async function writeFile(fileHandle: FileSystemFileHandle, contents: string): Promise<void> {
    const permission = await verifyPermission(fileHandle, true);
    if (!permission) {
        throw new Error('Permission to write file was denied.');
    }
    const writable = await fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
}
