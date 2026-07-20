import { ApartmentParserInterface, ApartmentsForParser } from './ApartmentParserInterface';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';

export class ApartmentsParseSchedule {
  private readonly context: WorkflowRunContext;
  private readonly parser: ApartmentParserInterface;

  constructor(context: WorkflowRunContext, parser: ApartmentParserInterface) {
    this.context = context;
    this.parser = parser;
  }

  async parse() {
    await this.context.logger.appendLog('Starting');
    try {
      await this.context.logger.appendLog('Parsing apartments');
      let apartmentsJSONList = await this.parser.getApartmentList();

      await this.context.logger.appendLog('Updating apartments');
      await this.updateApartments(apartmentsJSONList);

      await this.context.logger.appendLog('Finished');
      return this.context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.SUCCESS,
      });
    } catch (err: any) {
      await this.context.logger.appendLog('Error: ' + err.toString());
      return this.context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.FAILED,
      });
    }
  }

  async findOrCreateApartment(apartmentForParser: ApartmentsForParser) {
    const itemService = this.context.myDatabaseHelper.getApartmentsHelper();
    const external_idenfifier = apartmentForParser.basicData.external_identifier;

    const searchObject = {
      external_identifier: external_idenfifier,
    };
    const createObject = searchObject;
    return await itemService.findOrCreateItem(searchObject, createObject);
  }

  async updateApartments(apartmentsForParser: ApartmentsForParser[]) {
    for (let apartmentForParser of apartmentsForParser) {
      let resource = await this.findOrCreateApartment(apartmentForParser);
      if (!!resource && resource?.id) {
        await this.updateApartment(resource.id, apartmentForParser);
      }
    }
  }

  async updateApartment(apartmentId: string, apartmentForParser: ApartmentsForParser) {
    const itemService = this.context.myDatabaseHelper.getApartmentsHelper();
    await itemService.updateOne(apartmentId, apartmentForParser.basicData);

    const building_data = apartmentForParser.buildingData;
    const buildingExternalIdentifier = building_data.external_identifier;
    const searchObject = {
      external_identifier: buildingExternalIdentifier,
    };
    const buildingService = this.context.myDatabaseHelper.getBuildingsHelper();
    const building = await buildingService.findOrCreateItem(searchObject, building_data);
    if (building) {
      const building_id = building.id;
      if (building_id) {
        // Link building to apartment
        await itemService.updateOne(apartmentId, {
          building: building_id,
        });
      }
    }
  }
}
