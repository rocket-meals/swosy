import { WashingmachineParserInterface, WashingmachinesTypeForParser } from './WashingmachineParserInterface';
import { DatabaseTypes } from 'repo-depkit-common';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';

export class WashingmachineParseSchedule {
  private readonly context: WorkflowRunContext;
  private readonly parser: WashingmachineParserInterface;

  constructor(context: WorkflowRunContext, parser: WashingmachineParserInterface) {
    this.context = context;
    this.parser = parser;
  }

  async parse(): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    await this.context.logger.appendLog('Starting washingmachine parsing');

    try {
      await this.context.logger.appendLog('Getting washingmachines from parser');
      let washingmachinesForParser = await this.parser.getWashingmachines();

      await this.context.logger.appendLog('Updating washingmachines');
      await this.updateWashingmachines(washingmachinesForParser);

      await this.context.logger.appendLog('Finished washingmachine parsing');
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

  async updateWashingmachines(washingmachinesForParser: WashingmachinesTypeForParser[]) {
    for (let washingmachine of washingmachinesForParser) {
      await this.updateWashingmachine(washingmachine); // NOSONAR S9382 - sequential on purpose: findOrCreate plus updates per washing machine in a sync job, parallel writes would flood Directus
    }
  }

  async updateWashingmachine(washingmachine: WashingmachinesTypeForParser) {
    let itemsService = this.context.myDatabaseHelper.getWashingmachinesHelper();

    const external_identifier = washingmachine.basicData.external_identifier;
    const searchObject = {
      external_identifier: external_identifier,
    };
    const createObject = searchObject;

    let foundItem = await itemsService.findOrCreateItem(searchObject, createObject);
    if (foundItem) {
      const existingAlias = foundItem.alias;
      const isExistingAlisNotEmpty = existingAlias && existingAlias.length > 0;
      let newAlias = isExistingAlisNotEmpty ? existingAlias : washingmachine.basicData.alias;

      let isJobStarting = foundItem.date_finished === null && washingmachine.basicData.date_finished !== null; // maybe the finish time is just extended
      let isJobEnding = washingmachine.basicData.date_finished === null; // but if the finish time is null, the job is ending

      const additionalWashingmachineData: Partial<DatabaseTypes.Washingmachines> = {};

      if (isJobStarting) {
        additionalWashingmachineData.date_stated = new Date().toISOString();
      }
      if (isJobEnding) {
        additionalWashingmachineData.date_stated = null;
      }

      await this.context.logger.appendLog('Updating washingmachine ' + external_identifier + ' with alias ' + newAlias);
      let partialNewWashingmachine: Partial<DatabaseTypes.Washingmachines> = {
        ...washingmachine.basicData,
        ...additionalWashingmachineData,
        alias: newAlias, // do not overwrite alias if it is already set
      };
      await this.context.logger.appendLog(JSON.stringify(partialNewWashingmachine, null, 2));
      await itemsService.updateOne(foundItem.id, partialNewWashingmachine);
    }
  }
}
