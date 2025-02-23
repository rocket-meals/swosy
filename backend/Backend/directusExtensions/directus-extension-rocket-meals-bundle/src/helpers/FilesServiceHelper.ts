import {
    FileServiceCreator,
    FileServiceFileStream,
    FileServiceSteamType,
    FilesService,
    MutationOptions
} from "./ItemsServiceCreator";
import {ApiContext} from "./ApiContext";
import {ItemsServiceHelper} from "./ItemsServiceHelper";
import {CollectionNames} from "./CollectionNames";
import {EventContext, PrimaryKey} from "@directus/types";
import {DirectusFiles} from "../databaseTypes/types";
import {AssetsService} from "@directus/api";
import type {Readable} from "node:stream";
import type {Stat} from "@directus/storage";

export class FilesServiceHelper extends ItemsServiceHelper<DirectusFiles> implements FilesService {

    constructor(apiContext: ApiContext, eventContext?: EventContext) {
        super(apiContext, CollectionNames.DIRECTUS_FILES, eventContext);
    }

    protected override async getItemsService(){
        const filesServiceCreator = new FileServiceCreator(this.apiContext, this.eventContext);
        let filesService = await filesServiceCreator.getFileService();
        return filesService;
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
                resolve(Buffer.concat(chunks));
            });
            file.stream.on('error', (error: Error) => {
                reject(error);
            });
        });
    }

}