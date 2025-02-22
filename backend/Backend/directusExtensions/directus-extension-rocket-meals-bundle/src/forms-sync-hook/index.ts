import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {FormsSyncInterface} from "./FormsSyncInterface";
import {WorkflowScheduleHelper} from "../workflows-runs-hook";
import {EnvVariableHelper, SyncForCustomerEnum} from "../helpers/EnvVariableHelper";
import {FormSyncHannover} from "./customers/hannover/FormSyncHannover";
import {FormAnswers, FormSubmissions} from "../databaseTypes/types";
import {PrimaryKey} from "@directus/types";
import {RegisterFunctions} from "@directus/extensions";
import {ApiContext} from "../helpers/ApiContext";

function getFormSync(): FormsSyncInterface | null {
    return null;
}

/**
 * This function registers a hook to create form_answers for a form_submission before it is created. So that the form_answers are created according to the selected form.
 * @param registerFunctions
 * @param apiContext
 */
function registerHookToCreateFormAnswersForFormSubmission(registerFunctions: RegisterFunctions, apiContext: ApiContext){
    registerFunctions.filter<Partial<FormSubmissions>>(CollectionNames.FORM_SUBMISSIONS+".items.create", async (input, meta, eventContext) => {
        let form_id: PrimaryKey | undefined = undefined;
        if(!!input.form){
            if(typeof input.form === "string"){
                form_id = input.form;
            } else {
                form_id = input.form.id;
            }
        }
        if(!form_id){
            throw new Error("Form ID is not set. Please select a form.");
        }

        // so now we have the form_id. We can now get the form and all form_fields
        let myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);

        let form = await myDatabaseHelper.getFormsHelper().findFirstItem({
            id: form_id
        });
        if(!form){
            throw new Error("Form not found. Please create a form first or select a valid form.");
        }
        let form_fields = await myDatabaseHelper.getFormsFieldsHelper().findItems({
            form: form_id
        });

        let createFields: (Partial<FormAnswers> & { form_field: string })[] = [];
        for(let form_field of form_fields){
            createFields.push({
                form_field: form_field.id,
            });
        }
        input.form_answers = {
            // @ts-ignore - this way directus will create the relation
            create: createFields,
            update: [],
            delete: []
        }

        return input;
    })
}

export default defineHook(async (registerFunctions, apiContext) => {

    registerHookToCreateFormAnswersForFormSubmission(registerFunctions, apiContext);




    switch(EnvVariableHelper.getSyncForCustomer()){
        case SyncForCustomerEnum.HANNOVER:
            FormSyncHannover.registerHooks(registerFunctions, apiContext);
            break;
        default:
            break;
    }


    // TODO: Implement update/create hooks for form sending via mail

});