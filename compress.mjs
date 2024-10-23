import fs from 'fs';
import zlib from 'node:zlib';
import path from 'path';
import { EventEmitter } from 'events';


class CompressionEmitter extends EventEmitter {}

const emitter = new CompressionEmitter();


class FileError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FileError';
    }
}


async function compressFile(inputFile, outputFile) {
    try {
        await fs.promises.access(inputFile);  
        const readStream = fs.createReadStream(inputFile);
        const writeStream = fs.createWriteStream(outputFile);
        const gzip = zlib.createGzip();

       
        readStream.pipe(gzip).pipe(writeStream);

        writeStream.on('finish', () => {
            emitter.emit('done', `File compressed to ${outputFile}`);
        
            decompressFile(outputFile, path.join(process.cwd(), 'decompressed_sample.txt'));
        });

        readStream.on('error', (err) => {
            emitter.emit('error', new FileError(`Error reading file: ${err.message}`));
        });

        writeStream.on('error', (err) => {
            emitter.emit('error', new FileError(`Error writing file: ${err.message}`));
        });
    } catch (err) {
        emitter.emit('error', new FileError(`File not found: ${inputFile}`));
    }
}

async function decompressFile(inputFile, outputFile) {
    try {
        await fs.promises.access(inputFile); 
        const readStream = fs.createReadStream(inputFile);
        const writeStream = fs.createWriteStream(outputFile);
        const gunzip = zlib.createGunzip();

      
        readStream.pipe(gunzip).pipe(writeStream);

        writeStream.on('finish', () => {
            emitter.emit('done', `File decompressed to ${outputFile}`);
        });

        readStream.on('error', (err) => {
            emitter.emit('error', new FileError(`Error reading file: ${err.message}`));
        });

        writeStream.on('error', (err) => {
            emitter.emit('error', new FileError(`Error writing file: ${err.message}`));
        });
    } catch (err) {
        emitter.emit('error', new FileError(`Compressed file not found: ${inputFile}`));
    }
}


const inputFilePath = path.join(process.cwd(), 'sample.txt');
const outputFilePath = path.join(process.cwd(), 'sample.txt.gz');


emitter.on('done', (message) => {
    console.log(message);
});

emitter.on('error', (err) => {
    console.error(err.name, err.message);
});


compressFile(inputFilePath, outputFilePath);

