import {SingleWorkflowRun, WorkflowRunLogger} from "../../../workflows-runs-hook/WorkflowRunJobInterface";
import {WorkflowsRuns} from "../../../databaseTypes/types";
import {MyDatabaseHelper} from "../../../helpers/MyDatabaseHelper";
import {EnvVariableHelper} from "../../../helpers/EnvVariableHelper";
import {HannoverTL1HousingFileReader} from "./HannoverTL1HousingFileReader";
import {WORKFLOW_RUN_STATE} from "../../../helpers/itemServiceHelpers/WorkflowsRunEnum";

export class FormHouseWorkflowHannover extends SingleWorkflowRun {
    getWorkflowId(): string {
        return "house-sync-hannover";
    }

    async runJob(workflowRun: WorkflowsRuns, myDatabaseHelper: MyDatabaseHelper, logger: WorkflowRunLogger): Promise<Partial<WorkflowsRuns>> {
        const workflowRunHelper = myDatabaseHelper.getWorkflowsRunsHelper();
        const lastResultHash = await workflowRunHelper.getPreviousResultHash(workflowRun, logger);
        await logger.appendLog("Last Result Hash: " + lastResultHash);

        const pathToHousingContractCsvFile = EnvVariableHelper.getHousingContractCsvFilePath();
        const housingFileReader = new HannoverTL1HousingFileReader(pathToHousingContractCsvFile);
        const housingContracts = await housingFileReader.readData();
        const currentResultHash = housingFileReader.getResultHash(housingContracts);
        await logger.appendLog("Current Result Hash: " + currentResultHash);

        if(lastResultHash === currentResultHash) {
            await logger.appendLog("No new data found. Skipping workflow run.");
            return logger.getFinalLogWithStateAndParams({
                state: WORKFLOW_RUN_STATE.SKIPPED,
                result_hash: currentResultHash
            });
        } else {
            await logger.appendLog("New data found. Running workflow.");

            // Now that we have new housing protocols, we can synchronize them with the database


            return logger.getFinalLogWithStateAndParams({
                state: WORKFLOW_RUN_STATE.SUCCESS,
                result_hash: currentResultHash
            });
        }
    }



}