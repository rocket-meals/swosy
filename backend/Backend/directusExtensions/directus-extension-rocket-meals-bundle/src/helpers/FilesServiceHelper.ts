import {
    FileServiceCreator,
    FileServiceFileStream,
    FileServiceSteamType,
    FilesService,
    MutationOptions
} from "./ItemsServiceCreator";
import {ItemsServiceHelper} from "./ItemsServiceHelper";
import {CollectionNames} from "./CollectionNames";
import {PrimaryKey} from "@directus/types";
import {DirectusFiles} from "../databaseTypes/types";
import {AssetsService} from "@directus/api";
import {Readable} from "node:stream";
import type {Stat} from "@directus/storage";
import {CreateShareLinkOptionForDirectusFiles, ShareDirectusFileMethod, ShareServiceHelper} from "./ShareServiceHelper";
import * as Buffer from "node:buffer";
import {MyDatabaseHelperInterface} from "./MyDatabaseHelperInterface";

export class FilesServiceHelper extends ItemsServiceHelper<DirectusFiles> implements FilesService, ShareDirectusFileMethod {

    constructor(myDatabaseHelper: MyDatabaseHelperInterface) {
        super(myDatabaseHelper, CollectionNames.DIRECTUS_FILES);
    }

    protected override async getItemsService(){
        const filesServiceCreator = new FileServiceCreator(this.apiContext, this.eventContext);
        let filesService = await filesServiceCreator.getFileService();
        return filesService;
    }

    async uploadOneFromBuffer(buffer: Buffer, filename: string, myDatabaseHelper: MyDatabaseHelperInterface, directus_folder_id?: string): Promise<PrimaryKey> {
        const filesHelper = new FilesServiceHelper(myDatabaseHelper);

        // Convert Buffer to a Readable Stream
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null); // Mark end of stream

        // Define file metadata
        const fileMetadata = {
            filename_download: filename,
            type: 'application/pdf',
            storage: "local",
            folder: directus_folder_id,
        };

        // Upload the file
        try {
            const fileId = await this.uploadOne(stream, fileMetadata);
            console.log('File uploaded successfully with ID:', fileId);
            return fileId;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }


    async uploadOne(
        stream: FileServiceSteamType,
        data: FileServiceFileStream,
        primaryKey?: PrimaryKey,
        opts?: MutationOptions,
    ): Promise<PrimaryKey> {
        let filesService = await this.getItemsService();
        return filesService.uploadOne(stream, data, primaryKey, opts);
    }

    async importOne(importURL: string, body: Partial<DirectusFiles>): Promise<PrimaryKey> {
        let filesService = await this.getItemsService();
        return filesService.importOne(importURL, body);
    }

    async readFileContent(id: PrimaryKey): Promise<Buffer> {
        console.log("FilesServiceHelper.readFileContent: ", id);
        const AssetsService: AssetsService = this.apiContext.services.AssetsService
        let schema = await this.apiContext.getSchema();
        // @ts-ignore
        let assetsService = new AssetsService({
            accountability: null, //this makes us admin
            knex: this.knex,
            schema: schema,
        })

        console.log(" - getAsset: ", id);
        let file: {
            stream: Readable;
            file: any;
            stat: Stat;
        } = await assetsService.getAsset(id, { transformationParams: {} }); // https://github.com/directus/directus/discussions/14318

        console.log(" - read the file buffer");
        let chunks: Buffer[] = [];
        return new Promise<Buffer>((resolve, reject) => {
            file.stream.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });
            file.stream.on('end', () => {
                // @ts-ignore
                resolve(Buffer.concat(chunks));
            });
            file.stream.on('error', (error: Error) => {
                reject(error);
            });
        });
    }

    createDirectusFilesShareLink(options: CreateShareLinkOptionForDirectusFiles): Promise<string | null> {
        let shareServiceHelper = new ShareServiceHelper(this.myDatabaseHelper);
        return shareServiceHelper.createDirectusFilesShareLink(options);
    }

}