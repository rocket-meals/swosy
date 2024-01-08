export class ImageBase64UploadHook {
  // Source: http://stackoverflow.com/questions/20267939/nodejs-write-base64-image-file
  static decodeBase64Image(dataString) {
    let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let response = {
      type: undefined,
      data: undefined,
      extension: undefined,
    };

    if (!matches || matches.length !== 3) {
      return new Error('Invalid input string');
    }

    let extension = dataString.substring(
        dataString.indexOf('/') + 1,
        dataString.indexOf(';base64')
    );

    response.type = matches[1];
    response.data = Buffer.from(matches[2], 'base64');
    response.extension = extension;

    return response;
  }

  static toArray(val) {
    if (typeof val === 'string') {
      return val.split(',');
    }

    return Array.isArray(val) ? val : [val];
  }


  static async registerHook(
      beforeHook,
      afterHook,
      collection_name,
      file_field_name,
      payload,
      input,
      database,
      schema,
      accountability,
      registerFunctions,
      context
  ) {
    console.log('After Update');

    let storageName = ImageBase64UploadHook.toArray(context.env.STORAGE_LOCATIONS)[0];

    let services = context.services;
    const { FilesService, FieldsService } = services;

    const adminAccountAbility = JSON.parse(JSON.stringify(accountability));
    adminAccountAbility.admin = true;

    let filesService = new FilesService({
      schema,
      accountability: adminAccountAbility,
    });
    let fieldsService = new FieldsService({
      schema,
      accountability: adminAccountAbility,
    });

    let image = JSON.parse(JSON.stringify(payload[file_field_name]));
    console.log('image:' + image?.length);
    if (image) {
      console.log('Image is not empty');

      if (typeof image === 'string' && image.startsWith('data')) {
        console.log('It is a base64 data');

        payload[file_field_name] = null;

        let body = {
          folder: null,
          type: 'image/png',
          storage: storageName,
          filename_download: 'test.png',
        };

        let collectionInfo = await fieldsService.readOne(
            collection_name,
            file_field_name
        );
        console.log(collectionInfo);
        let folder = collectionInfo?.meta?.options?.folder;
        if (folder) {
          body.folder = folder;
        }

        console.log('DecodeBase64');
        let decodedObj = ImageBase64UploadHook.decodeBase64Image(image);
        console.log('Upload image');
        body.type = decodedObj?.type;
        body.filename_download = 'test' + '.' + decodedObj?.extension;
        let imageBuffer = decodedObj?.data;
        try {
          console.log(body);
          const filename = await filesService.uploadOne(imageBuffer, body);
          console.log('filename');
          console.log(filename);
          payload.image = filename;
        } catch (err) {
          console.log(err);
        }
      } else {
        console.log('It is not a base64');
        console.log(image.substring(0, 20));
      }
    }

    console.log('Image Base64 Parser Hook finished with result: ');
    console.log(payload);

    if (afterHook) {
      payload = await afterHook(
          collection_name,
          file_field_name,
          payload,
          input,
          database,
          schema,
          accountability,
          registerFunctions,
          context
      );
    }

    return payload;
  }
}
