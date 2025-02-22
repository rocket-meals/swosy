import {SingleWorkflowRun, WorkflowRunLogger} from "../workflows-runs-hook/WorkflowRunJobInterface";
import {FormAnswers, FormFields, Forms, FormSubmissions, WorkflowsRuns} from "../databaseTypes/types";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {WORKFLOW_RUN_STATE} from "../helpers/itemServiceHelpers/WorkflowsRunEnum";
import {FormImportSyncFormSubmissions} from "./FormImportTypes";

export abstract class FormImportSyncWorkflow extends SingleWorkflowRun {

    constructor() {
        super();
    }

    abstract createNeededData(): Promise<void>;
    abstract getCurrentResultHash(): Promise<string>;
    abstract getData(): Promise<FormImportSyncFormSubmissions[]>;
    abstract getFormInternalCustomId(): string;
    abstract getFormAlias(): string;

    async runJob(workflowRun: WorkflowsRuns, myDatabaseHelper: MyDatabaseHelper, logger: WorkflowRunLogger): Promise<Partial<WorkflowsRuns>> {
        const workflowRunHelper = myDatabaseHelper.getWorkflowsRunsHelper();
        const lastResultHash = await workflowRunHelper.getPreviousResultHash(workflowRun, logger);
        await logger.appendLog("Last Result Hash: " + lastResultHash);

        await logger.appendLog("Creating needed data.");
        await this.createNeededData();

        const currentResultHash = await this.getCurrentResultHash();
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
            const searchForm: Partial<Forms> = {
                internal_custom_id: this.getFormInternalCustomId(),
            }
            const createForm: Partial<Forms> = {
                internal_custom_id: this.getFormInternalCustomId(),
                alias: this.getFormAlias(),
            }

            let form = await myDatabaseHelper.getFormsHelper().findOrCreateItem(searchForm, createForm);
            if(!form){
                await logger.appendLog("Form not found and could not be created. Skipping workflow run.");
                return logger.getFinalLogWithStateAndParams({
                    state: WORKFLOW_RUN_STATE.FAILED,
                    result_hash: currentResultHash
                });
            } else {
                let formFields = await myDatabaseHelper.getFormsFieldsHelper().findItems({
                    form: form.id
                });
                let dictFormFieldExternalImportIdToFormFieldId: {[key: string]: FormFields} = {};
                for(let formField of formFields){
                    let external_import_id = formField.external_import_id;
                    if(external_import_id){
                        dictFormFieldExternalImportIdToFormFieldId[external_import_id] = formField;
                    }
                }


                // Now we can create the form submissions or search for existing ones
                let formSubmissions = await this.getData();
                for(let formSubmission of formSubmissions){
                    let internal_custom_id = formSubmission.internal_custom_id;
                    await logger.appendLog("Processing form submission with internal_custom_id " + internal_custom_id);
                    let searchFormSubmission: Partial<FormSubmissions> = {
                        form: form.id,
                        internal_custom_id: internal_custom_id, // identifier for the housing contract for future reference
                    }
                    let foundFormSubmission = await myDatabaseHelper.getFormsSubmissionsHelper().findFirstItem(searchFormSubmission);
                    if(!foundFormSubmission){
                        await logger.appendLog("- does not exist. Creating.");
                        let alias = formSubmission.alias;
                        let createFormSubmission: Partial<FormSubmissions> = {
                            form: form.id,
                            internal_custom_id: internal_custom_id, // identifier for the form submission for future reference
                            alias: alias,
                        }

                        let createFormAnswers: Partial<FormAnswers>[] = [];
                        // now we need to fill the form answers with the data from the housing contract
                        // iterate over all data fields of the housing contract
                        let formAnswers = formSubmission.form_answers;
                        for(let passedFormAnswer of formAnswers){
                            let external_import_id = passedFormAnswer.external_import_id;
                            let formField = dictFormFieldExternalImportIdToFormFieldId[external_import_id];
                            if(formField){
                                createFormAnswers.push({
                                    ...passedFormAnswer,
                                    form_field: formField.id,
                                });
                            }
                        }


                        // Set the form answers with provided data
                        createFormSubmission.form_answers = {
                            // @ts-ignore - this way directus will create the relation
                            create: createFormAnswers,
                            // @ts-ignore - this way directus will create the relation
                            update: [],
                            // @ts-ignore - this way directus will create the relation
                            delete: []
                        }

                        await myDatabaseHelper.getFormsSubmissionsHelper().createOne(createFormSubmission);

                    } else {
                        await logger.appendLog("- already exists. Skipping.");
                    }

                }

                return logger.getFinalLogWithStateAndParams({
                    state: WORKFLOW_RUN_STATE.SUCCESS,
                    result_hash: currentResultHash
                });
            }
        }
    }



}